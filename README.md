# Black Bullet Backend

Node.js + Express backend API for Black Bullet, with MongoDB via Mongoose.

## Tech Stack

- Node.js (CommonJS)
- Express
- MongoDB + Mongoose
- dotenv
- cors
- bcrypt

## Prerequisites

- Node.js 18+ (recommended)
- MongoDB instance (local or cloud)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the backend root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=black_bullet
CORS_ORIGIN=http://localhost:3000
```

### Environment Variables

- `PORT`: API port (default: `5000`)
- `MONGODB_URI`: MongoDB connection URI (**required**)
- `MONGODB_DB_NAME`: Optional database name override
- `CORS_ORIGIN`: Comma-separated list of allowed origins. If not set, `*` is used.

## Run

- Development (watch mode):

```bash
npm run dev
```

- Production:

```bash
npm start
```

## API Endpoints

- `GET /`
  - Basic server status
  - Returns: `{ ok, service, message }`

- `GET /api/health`
  - Health + DB connection status
  - Returns: `{ ok, uptimeSeconds, timestamp, database }`

## Data Models

The server registers these Mongoose models at startup:

- `Admin`
- `Booking`
- `Service`
- `Settings`
- `Post`

## Project Structure

```text
Black_bullet_backend/
  app.js            # Express app and middleware
  index.js          # Server bootstrap + DB connection
  config/
    db.js           # MongoDB connection logic
  models/           # Mongoose schemas
  routes/
    health.js       # Health-check endpoint
```

## Notes

- The backend currently exposes only base and health routes.
- API resource routes (auth, bookings, services, posts, etc.) can be added under `routes/` and mounted in `app.js`.
