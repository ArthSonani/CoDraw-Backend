# CoDraw Backend

Express + Socket.IO backend for collaborative whiteboarding, authentication, asset uploads, metrics, and text-to-drawing generation.

## Features

- Authentication with signed HTTP-only cookies (JWT)
- Whiteboard persistence in MongoDB (Mongoose)
- Real-time collaboration via Socket.IO (canvas + voice room signaling)
- Image upload to Cloudinary for whiteboard previews
- Text-to-drawing generation using Google Gemini API
- Event/usage metrics stored in Firebase Firestore
- CORS configured for a dashboard frontend

## Tech Stack

- Node.js, Express 5
- Socket.IO 4
- MongoDB + Mongoose 8
- Cloudinary
- Firebase Admin SDK (Firestore)
- JSON Web Tokens (JWT), bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- A MongoDB connection string (Atlas or self-hosted)
- Cloudinary account (for preview uploads)
- Google Gemini API key
- Firebase Service Account (for metrics to Firestore)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following keys:

```bash
# Server
PORT=3000

# Database
MONGO_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=some_strong_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Firebase (Service Account)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
# For local .env, ensure newlines are escaped as \n
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

### Run in Development

```bash
npm run dev
```

By default, the server listens on `PORT` (defaults to `3000`).

## API Reference

Base URL: `/api`
