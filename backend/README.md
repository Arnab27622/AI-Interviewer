# Prepify Backend

The backend for Prepify, providing the REST API and Socket.io server to bridge the front end and the AI service.

## Architecture
- **Express.js**: For all API routes
- **MongoDB + Mongoose**: For databases (Users & Sessions)
- **Socket.io**: Real-time progress updates during answers/evaluation
- **JWT**: For authentication

## Setup
1. Clone repo, CD to this directory.
2. `npm install`
3. Setup `.env` file with `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`.
4. `npm run build` or `npm run dev`
