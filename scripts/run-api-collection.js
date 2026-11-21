#!/usr/bin/env node
// Command-line runner for Postman collection JSON files.
// Executes a collection with its environment, applies variable overrides,
// prints a per-request summary, and writes a standalone HTML report.
const fs = require('fs');
const path = require('path');
const { Collection, VariableScope } = require('postman-collection');
const runtime = require('postman-runtime');

function readArgs(argv) {
  const opts = { envVars: {} };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--collection') opts.collection = argv[++i];
    else if (a === '--environment') opts.environment = argv[++i];
    else if (a === '--report') opts.report = argv[++i];
    else if (a === '--env-var') {
      const raw = argv[++i];
      const eq = raw.indexOf('=');
      opts.envVars[raw.slice(0, eq)] = raw.slice(eq + 1);
    }
  }
  return opts;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const opts = readArgs(process.argv);
if (!opts.collection) {
  console.error('Usage: node run-api-collection.js --collection FILE [--environment FILE] [--env-var key=value]... [--report FILE]');
  process.exit(2);
}

const collection = new Collection(JSON.parse(fs.readFileSync(opts.collection, 'utf8')));
const environment = opts.environment
  ? new VariableScope(JSON.parse(fs.readFileSync(opts.environment, 'utf8')))
  : new VariableScope({ values: [] });
for (const [k, v] of Object.entries(opts.envVars)) environment.set(k, v);

const results = [];
const failures = [];
const scriptWarnings = [];
let current = null;
const startedAt = new Date();

const runner = new runtime.Runner();
runner.run(collection, {
  environment,
  globals: new VariableScope({ values: [] }),
  iterationCount: 1,
  timeout: 300000,
  timeoutRequest: 30000,
  timeoutScript: 10000
}, function (startErr, run) {
  if (startErr) {
    console.error('Runner failed to start:', startErr.message || startErr);
    process.exit(2);
  }
  run.start({
    beforeRequest: function (err, cursor, request, item) {
      current = {
        name: item ? item.name : '(request)',
        method: request ? request.method : '?',
        url: request ? request.url.toString() : '',
        assertions: [],
        error: err ? (err.message || String(err)) : null
      };
    },
    request: function (err, cursor, response, request, item) {
      if (!current) {
        current = { name: item ? item.name : '(request)', method: request ? request.method : '?', url: request ? request.url.toString() : '', assertions: [], error: null };
      }
      if (err) current.error = err.message || String(err);
      if (response) {
        current.status = response.code;
        current.timeMs = response.responseTime;
      }
      results.push(current);
      if (current.error) failures.push(current.name + ': request error - ' + current.error);
      console.log((current.error ? 'ERROR' : current.status) + '  ' + current.name + (current.timeMs != null ? '  ' + current.timeMs + 'ms' : ''));
      current = null;
    },
    assertion: function (cursor, assertions) {
      const list = Array.isArray(assertions) ? assertions : [assertions];
      const target = results[results.length - 1] || current;
      for (const a of list) {
        if (!a || typeof a !== 'object' || !('passed' in a || 'skipped' in a)) continue;
        const rec = { name: a.name || '(unnamed assertion)', passed: !!a.passed && !a.error, skipped: !!a.skipped };
        if (a.error) rec.error = a.error.message || String(a.error);
        if (target) target.assertions.push(rec);
        if (!rec.skipped && !rec.passed) failures.push((target ? target.name : '?') + ' > ' + rec.name + (rec.error ? ' - ' + rec.error : ''));
      }
    },
    exception: function (cursor, error) {
      const msg = (error && (error.message || error.name)) || (cursor && cursor.message) || 'unknown script error';
      scriptWarnings.push(msg);
      console.log('warning: script error - ' + msg);
    },
    console: function () {},
    done: function () {
      const total = results.reduce((n, r) => n + r.assertions.filter(a => !a.skipped).length, 0);
      const passed = results.reduce((n, r) => n + r.assertions.filter(a => !a.skipped && a.passed).length, 0);
      const failed = total - passed;
      console.log('--------------------------------------------------');
      console.log('requests: ' + results.length + ', assertions: ' + total + ', passed: ' + passed + ', failed: ' + failed);
      if (failures.length) {
        console.log('failures:');
        failures.forEach(f => console.log('  - ' + f));
      }
      if (opts.report) {
        fs.mkdirSync(path.dirname(opts.report), { recursive: true });
        fs.writeFileSync(opts.report, buildReport());
      }
      process.exit(failed || failures.length ? 1 : 0);
    }
  });
});

function buildReport() {
  const rows = results.map(r => {
    const bad = r.error || r.assertions.some(a => !a.skipped && !a.passed);
    const asserts = r.assertions.map(a =>
      `<li class="${a.skipped ? 'skip' : a.passed ? 'ok' : 'bad'}">${a.skipped ? 'SKIP' : a.passed ? 'PASS' : 'FAIL'} - ${esc(a.name)}${a.error ? ' (' + esc(a.error) + ')' : ''}</li>`
    ).join('');
    return `<tr class="${bad ? 'badrow' : 'okrow'}"><td>${esc(r.name)}</td><td>${esc(r.method)}</td><td>${r.error ? 'ERROR: ' + esc(r.error) : r.status}</td><td>${r.timeMs != null ? r.timeMs + ' ms' : ''}</td></tr>
<tr><td colspan="4"><ul>${asserts}</ul></td></tr>`;
  }).join('\n');
  const total = results.reduce((n, r) => n + r.assertions.filter(a => !a.skipped).length, 0);
  const failed = results.reduce((n, r) => n + r.assertions.filter(a => !a.skipped && !a.passed).length, 0);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>API Test Report - ${esc(collection.name)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;margin:2rem;color:#222}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #ddd;padding:6px 10px;text-align:left;vertical-align:top}
th{background:#f4f4f4}
.ok{color:#1a7f37}.bad{color:#cf222e}.skip{color:#777}
.okrow td{background:#f0fff4}.badrow td{background:#fff0f0}
ul{margin:4px 0;padding-left:1.4rem;list-style:none}
.summary{font-size:1.1rem;margin:1rem 0}
</style></head><body>
<h1>API Test Report</h1>
<p><strong>Collection:</strong> ${esc(collection.name)}<br>
<strong>Run at:</strong> ${esc(startedAt.toISOString())}</p>
<p class="summary"><strong>Requests:</strong> ${results.length} &nbsp; <strong>Assertions:</strong> ${total} &nbsp;
<span class="ok"><strong>Passed:</strong> ${total - failed}</span> &nbsp; <span class="bad"><strong>Failed:</strong> ${failed}</span></p>
<table><tr><th>Request</th><th>Method</th><th>Status</th><th>Time</th></tr>
${rows}
</table></body></html>`;
}
