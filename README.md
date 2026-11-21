# API_Testing

A collection of Postman API test suites that validate two public APIs, **AutomationExercise** and **Trello**. The suites cover positive and negative scenarios across `GET`, `POST`, `PUT`, and `DELETE` requests, with automated assertions written as Postman test scripts.

## Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Suite 1: AutomationExercise API](#suite-1-automationexercise-api)
- [Suite 2: Trello API](#suite-2-trello-api)
- [What the Tests Validate](#what-the-tests-validate)
- [How to Run](#how-to-run)
- [Author](#author)

## Overview

This project demonstrates end-to-end API testing with Postman:

- Organized request collections grouped by feature or resource.
- Positive and negative test scenarios, including invalid credentials, missing parameters, duplicate data, and unsupported HTTP methods.
- Automated assertions on status codes, response bodies and fields, headers, and response time.
- Environment variables to keep the tests reusable and independent of the environment.
- Request chaining, where values from one response (for example a board ID) are stored and reused in later requests.

## Tech Stack

- **Postman**: request collections, environments, and test scripts (JavaScript)
- **Node.js** (optional): command-line collection runner (`scripts/run-api-collection.js`)
- **GitHub Actions**: CI workflow that runs the suites on every push
- **Git & GitHub**: version control

## Project Structure

```
API_Testing/
├── README.md
├── .github/
│   └── workflows/
│       └── CI.yml
├── scripts/
│   └── run-api-collection.js
└── postman/
    ├── API_Testing_AutomationExcercises/
    │   ├── AutomationExercise-API.postman_collection.json
    │   └── Testing_Env.postman_environment.json
    └── API_Testing_Trello/
        ├── GS_API_Testing.postman_collection.json
        └── GS_Testing_Env.postman_environment.json
```

## Suite 1: AutomationExercise API

Requests are grouped into four folders: **Products**, **Brands**, **Login**, and **Account**.

| Test Case | Method | Endpoint | Scenario |
| --- | --- | --- | --- |
| TC1 | GET | `productsList` | Get all products |
| TC2 | POST | `productsList` | Unsupported method (negative) |
| TC3 | GET | `brandsList` | Get all brands |
| TC4 | PUT | `brandsList` | Unsupported method (negative) |
| TC5 | POST | `searchProduct` | Search for a product |
| TC6 | POST | `searchProduct` | Search without the required parameter (negative) |
| TC7 | POST | `verifyLogin` | Login with valid details |
| TC8 | POST | `verifyLogin` | Login without the email parameter (negative) |
| TC9 | DELETE | `verifyLogin` | Unsupported method (negative) |
| TC10 | POST | `verifyLogin` | Login with invalid details (negative) |
| TC11 | POST | `createAccount` | Create a user account |
| TC12 | DELETE | `deleteAccount` | Delete a user account |
| TC13 | PUT | `updateAccount` | Update a user account |
| TC14 | GET | `getUserDetailByEmail` | Get user details by email |
| TC15 | POST | `createAccount` | Create an account with an already registered email (negative) |

## Suite 2: Trello API

Covers the full lifecycle of a Trello board and its members:

1. **Create Board**: creates a board and stores its ID in an environment variable.
2. **Update Board**: updates the board using the stored ID.
3. **Add Member To The Board**: adds a member to the board.
4. **Get The Members Of The Board**: retrieves the board members and verifies the added member.
5. **Delete Member From The Board**: removes the member from the board.
6. **Delete Board**: deletes the board to clean up the test data.

## What the Tests Validate

- **Status codes**: expected success and error codes for each scenario.
- **Response body**: valid JSON, required fields and properties, and expected values and messages.
- **Headers**: `Content-Type` is present and correct.
- **Performance**: response time stays within an acceptable threshold.
- **Negative handling**: clear error messages and correct status codes for invalid input and unsupported methods.

## How to Run

### Prerequisites

- [Postman](https://www.postman.com/downloads/) installed
- (Optional) [Node.js](https://nodejs.org/) for command-line runs

### Run in Postman

1. Clone the repository:
   ```bash
   git clone https://github.com/Omartarek876/API_Testing.git
   ```
2. In Postman, click **Import** and select the collection and environment files from the `postman/` folder.
3. Select the matching environment (top-right corner) and fill in its variables:

   **AutomationExercise** (`Testing_Env`)

   | Variable | Description |
   | --- | --- |
   | `BaseURL_WithAPI_Path` | API base URL, for example `https://automationexercise.com/api/` |
   | `LoginValidEmail` / `LoginValidPassword` | Credentials of an existing test account |
   | `LoginInvalidEmail` / `LoginInvalidPassword` | Credentials used for the negative login tests |
   | `Cred_email` / `Cred_password` | Credentials used when creating a new test account |

   **Trello** (`GS_Testing_Env`)

   | Variable | Description |
   | --- | --- |
   | `BaseUrl` | Trello boards endpoint, for example `https://api.trello.com/1/boards/` |
   | `API_key` / `token` | Your Trello API key and token |

4. Open the collection and click **Run collection**, keeping the requests in their folder order.

### Run from the command line (optional)

The repository includes a small Node.js runner that executes a collection file, applies environment variables, and writes an HTML report:

```bash
npm install postman-collection postman-runtime

node scripts/run-api-collection.js \
  --collection postman/API_Testing_AutomationExcercises/AutomationExercise-API.postman_collection.json \
  --environment postman/API_Testing_AutomationExcercises/Testing_Env.postman_environment.json

node scripts/run-api-collection.js \
  --collection postman/API_Testing_Trello/GS_API_Testing.postman_collection.json \
  --environment postman/API_Testing_Trello/GS_Testing_Env.postman_environment.json
```

Environment variables can also be passed without editing the environment files, for example `--env-var "BaseURL_WithAPI_Path=https://automationexercise.com/api/"`. The GitHub Actions CI uses the same runner and uploads the HTML reports as workflow artifacts.

> **Security note:** The environment files in this repository are shared without values. Never commit real credentials, API keys, or tokens. Keep them in your local Postman environment only.

## Author

**Omar Tarek**, Software Test Engineer

- GitHub: [Omartarek876](https://github.com/Omartarek876)
- LinkedIn: [omar-tarek](https://www.linkedin.com/in/omar-tarek-495ba6217/)
