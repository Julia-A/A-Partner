# A-Partner Backend

A-Partner Backend is the RESTful API for **A-Partner**, an accountability and goal-tracking application that helps users create major goals, break them into milestones, track actionable steps, earn XP, maintain streaks, and view progress analytics.

The backend is built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**, using a modular feature-based architecture for cleaner structure and easier maintenance.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Routes](#api-routes)
- [Authentication](#authentication)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Core Application Flow](#core-application-flow)
- [Future Improvements](#future-improvements)

---

## Overview

A-Partner Backend handles the server-side logic for the accountability app. It manages user authentication, goal creation, milestone tracking, step completion, XP rewards, streak calculation, password management, and analytics.

The backend exposes REST API endpoints that are consumed by the A-Partner frontend.

---

## Features

- User registration and login
- JWT-based authentication
- Refresh token support
- Password reset flow
- Password change while logged in
- Protected API routes
- Goal creation, update, deletion, completion, and uncompletion
- Milestone creation, update, deletion, and automatic completion
- Step creation, update, deletion, completion, and uncompletion
- Timeline validation for goals, milestones, and steps
- XP rewards for completed steps, milestones, and goals
- XP deduction when actions are reversed or deleted
- User profile and gamification tracking
- Current streak and best streak tracking
- Today focus steps
- Overdue step tracking
- Analytics overview
- Daily and weekly completion analytics
- Centralized validation middleware
- Centralized error handling
- Modular feature-based folder structure

---

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **Joi**
- **JWT**
- **bcrypt**
- **Nodemailer**
- **dotenv**
- **cors**
- **nodemon**

---

## Project Structure

```txt
Backend/
  src/
    app.js
    server.js

    config/
      db.js
      mail.js

    features/
      Analytics/
        analytics.controllers.js
        analytics.route.js
        analytics.services.js

      auth/
        auth.controllers.js
        auth.emails.js
        auth.models.js
        auth.routes.js
        auth.services.js
        auth.validation.js

      Gamification/
        userProfile.controllers.js
        userProfile.models.js
        userProfile.routes.js
        userProfile.services.js
        userProfile.validation.js

      goals/
        goals.controllers.js
        goals.emails.js
        goals.models.js
        goals.routes.js
        goals.services.js
        goals.validation.js

      milestones/
        milestones.controllers.js
        milestones.models.js
        milestones.routes.js
        milestones.services.js
        milestones.validations.js

      steps/
        steps.controllers.js
        steps.models.js
        steps.routes.js
        steps.services.js
        steps.validation.js

    middleware/
      auth.middleware.js
      error.middleware.js
      notFound.middleware.js
      validate.middleware.js

    routes/
      index.js

    utils/
      ApiError.js
      asyncHandler.js
      date.js
      logger.js
      pick.js
      sendEmail.js
      token.js

  package.json
```

---

## Architecture

The backend follows a **feature-based modular architecture**.

Each feature is organized into separate files based on responsibility:

```txt
feature/
  feature.models.js
  feature.validation.js
  feature.services.js
  feature.controllers.js
  feature.routes.js
```

### Models

Models define the database schema using Mongoose.

Example responsibilities:

- Define fields
- Set required properties
- Add indexes
- Define relationships between collections

### Validation

Validation files define the accepted request body, params, or query structure using Joi.

This helps prevent invalid or unexpected data from reaching the business logic.

### Services

Services contain the core business logic.

Example responsibilities:

- Create database records
- Check ownership
- Validate timelines
- Award or deduct XP
- Complete or uncomplete related resources
- Handle database transactions

### Controllers

Controllers handle HTTP request and response logic.

They receive data from the request, call the appropriate service, and return a response.

### Routes

Routes define API endpoints and attach middleware such as authentication and validation.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- MongoDB database, local or hosted

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Julia-A/A-Partner.git
```

Move into the backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the `Backend` directory.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
ACCESS_JWT_SECRET=your_access_token_secret
REFRESH_JWT_SECRET=your_refresh_token_secret
FRONTEND_URL=http://localhost:5173
APP_NAME=A-Partner
```

### Environment Variable Description

| Variable | Description |
|---|---|
| `PORT` | Port the backend server runs on |
| `MONGODB_URI` | MongoDB connection string |
| `ACCESS_JWT_SECRET` | Secret key for signing access tokens |
| `REFRESH_JWT_SECRET` | Secret key for refresh token logic |
| `FRONTEND_URL` | Frontend URL allowed for CORS and reset links |
| `APP_NAME` | Application name used in emails or app config |

---

## Available Scripts

### Start Development Server

```bash
npm run dev
```

This starts the backend server using Nodemon.

The server should run on:

```txt
http://localhost:3000
```

---

## Health Check

```txt
GET /health
```

Expected response:

```json
{
  "ok": true
}
```

---

## API Routes

All API routes are mounted under:

```txt
/api
```

### Auth Routes

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/verify-reset-token
POST /api/auth/reset-password
POST /api/auth/change-password
```

### User/Profile Routes

```txt
GET /api/users/me/profile
GET /api/users/me/xp-history
```

### Goal Routes

```txt
GET    /api/goal
POST   /api/goal
GET    /api/goal/:goalId
PATCH  /api/goal/:goalId
DELETE /api/goal/:goalId
POST   /api/goal/:goalId/complete
POST   /api/goal/:goalId/uncomplete
```

### Milestone Routes

```txt
GET    /api/goal/:goalId/milestones
POST   /api/goal/:goalId/milestones
GET    /api/milestone/:milestoneId
PATCH  /api/milestone/:milestoneId
DELETE /api/milestone/:milestoneId
```

### Step Routes

```txt
GET    /api/milestone/:milestoneId/steps
POST   /api/milestone/:milestoneId/steps
PATCH  /api/steps/:stepId
DELETE /api/steps/:stepId
POST   /api/steps/:stepId/complete
POST   /api/steps/:stepId/uncomplete
GET    /api/steps/today
GET    /api/steps/overdue
```

### Analytics Routes

```txt
GET /api/analytics/overview
GET /api/analytics/daily
GET /api/analytics/weekly
```

---

## Authentication

The backend uses JWT authentication.

After login or registration, the server returns:

- Access token
- Refresh token
- User details

Protected routes require an Authorization header:

```txt
Authorization: Bearer <access_token>
```

The authentication middleware verifies the token and attaches the authenticated user to the request:

```js
req.user = {
  id: user._id.toString(),
  email: user.email
};
```

---

## Validation

Request validation is handled with Joi.

Validation middleware checks:

- Request body
- Route params
- Query params

Example route validation:

```js
goalRouter.post(
  "/",
  requireAuth,
  joiValidate(goalSchema),
  goalControllers.create
);
```

This keeps controllers cleaner and prevents bad data from reaching services.

---

## Error Handling

The backend uses centralized error handling.

### Custom API Errors

`ApiError` is used for predictable application errors:

```js
throw new ApiError(404, "Goal not found");
```

### Async Handler

`asyncHandler` catches errors from async controllers and passes them to the global error middleware.

```js
const create = asyncHandler(async (req, res) => {
  const result = await goalServices.create(req.user.id, req.body);
  res.status(201).json({ goal: result });
});
```

### Global Error Middleware

All errors are returned in a consistent format:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation error"
  }
}
```

---

## Core Application Flow

```txt
User registers or logs in
  -> User creates a goal
    -> Goal is broken into milestones
      -> Milestones are broken into steps
        -> User completes steps
          -> XP is awarded
          -> Streak is updated
          -> Milestone may auto-complete
          -> Goal may auto-complete
          -> Analytics are updated
```

---

## Gamification Logic

A-Partner rewards users for progress.

Typical XP flow:

```txt
Complete step       -> earn XP
Complete milestone  -> earn XP bonus
Complete goal       -> earn XP bonus
Undo completion     -> deduct XP
Delete completed item -> deduct related XP
```

The user profile tracks:

- XP
- Level
- Current streak
- Best streak
- Last completion date

---

## Timeline Rules

The app validates timeline consistency.

Examples:

- A goal must have a start date and target date.
- A goal target date must be after the start date.
- A step must have a start date and end date.
- A step must stay within the parent goal timeline.
- Milestone dates are optional.
- If milestone dates are provided, they must stay within the parent goal timeline.

---

## Future Improvements

- Email verification
- Recurring steps or habits
- Notification/reminder system
- Accountability partner features
- More detailed analytics
- Unit and integration tests
- API documentation with Swagger or Postman
- Role-based access control

---

## Author

Built by **Julia Aderemi**.
