# Socketmate Chat Backend Server

This repository houses the backend REST API server and WebSocket signaling engine for the Socketmate real-time chat and WebRTC calling application. It is built using Node.js, Express, MongoDB, and Socket.io.

## Features

- **REST API Endpoints**: Handling authentication, password recovery (Brevo API), and messaging history.
- **WebSocket Gateway**: Event-driven client messaging, typing states, and online connectivity management.
- **WebRTC Signaling Bridge**: Routing SDP offers, answers, and ICE candidate packages between peers.
- **Cloud Media Storage**: Secure user profile uploads mapped directly to Cloudinary CDN via Multer.
- **JWT Session Security**: Secure validation middleware for protected API endpoints.

## Tech Stack

- **Platform**: Node.js
- **HTTP Server**: Express (v5)
- **Real-time Channel**: Socket.io
- **Database ORM**: Mongoose (MongoDB)
- **SMTP Service**: Brevo API (Sendinblue)
- **File Upload Engine**: Multer and Cloudinary

## Getting Started

### Prerequisites
Ensure Node.js (v18+) and MongoDB are installed and running.

### Setup and Installation

1. Navigate to the server directory:
   ```bash
   cd chatServer
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Configure your environment in a `.env` file at the root of `chatServer/`:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat-app
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   BREVO_API_KEY=your_brevo_api_key
   EMAIL_USER=your_verified_sender_email@domain.com
   ```
4. Start the server (with hot-reloading in dev mode):
   ```bash
   npm run start
   ```

## Detailed Documentation
For complete technical details, API listings, database models, and socket event guides, refer to [DOCUMENTATION.md](DOCUMENTATION.md).
