# Invito

Invito is an event invitation and campaign platform with a React/Vite frontend and an Express/MongoDB backend. It supports:

- user signup, login, email verification, and password reset
- event creation with image uploads and CSV/Excel invite imports
- email and WhatsApp invitation workflows
- dashboard analytics for invitations, RSVPs, and attendance
- team member invites under a shared workspace
- subscription and payment flows through Moyasar

## Project Structure

- `frontend` - React + Vite application
- `backend_mongodb` - Express API, MongoDB models, cron jobs, and integrations

## Getting Started

1. Copy the environment templates:

```powershell
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend_mongodb\.env.example backend_mongodb\.env
```

2. Install dependencies:

```powershell
npm run install:frontend
npm run install:backend
```

3. Start the backend:

```powershell
npm run dev:backend
```

4. Start the frontend in a second terminal:

```powershell
npm run dev:frontend
```

## Common Commands

```powershell
npm run build:frontend
npm run lint:frontend
```

## Required Environment Areas

Backend values are needed for:

- MongoDB connection
- JWT signing
- frontend/backend URLs
- Mailgun email delivery
- Moyasar billing
- optional Meta WhatsApp integration

Frontend values are needed for:

- API base URL
- backend URL for direct payment redirects
- frontend URL for success/failure callbacks

## API Docs

When the backend is running, Swagger docs are available at:

- `http://localhost:8082/api-docs`

Health check:

- `http://localhost:8082/api/health`

## Deploying to Railway

This repository should be deployed to Railway as three services:

- `MongoDB`
- `backend` using the `backend_mongodb` folder
- `frontend` using the `frontend` folder

### Service roots

When creating services from the same GitHub repository, set:

- backend root directory: `backend_mongodb`
- frontend root directory: `frontend`

Each service already includes a `railway.toml` file with its Railway build/start settings.

### Backend variables

Set these in the backend Railway service:

```env
NODE_ENV=production
PORT=8082
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=replace-with-a-secure-random-secret
BACKEND_URL=https://YOUR-BACKEND-DOMAIN
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
MAILGUN_USERNAME=api
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_URL=https://api.mailgun.net
MAILGUN_DOMAIN=mg.example.com
MAILGUN_EMAIL=no-reply@example.com
MOYASAR_SECRET_KEY=your-moyasar-secret-key
META_WEBHOOK_VERIFY_TOKEN=replace-with-your-webhook-verify-token
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_CONFIGURATION_ID=your-meta-configuration-id
META_REDIRECT_URI=https://YOUR-BACKEND-DOMAIN/api/event/auth/callback
```

### Frontend variables

Set these in the frontend Railway service:

```env
VITE_MAIN_URL=https://YOUR-BACKEND-DOMAIN/api
VITE_BACKEND_URL=https://YOUR-BACKEND-DOMAIN
VITE_FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
```

### Recommended Railway flow

1. Push this repo to GitHub.
2. Create a new Railway project.
3. Add a MongoDB service.
4. Add the backend service from this repo with root directory `backend_mongodb`.
5. Add the frontend service from this repo with root directory `frontend`.
6. Generate a public domain for backend and frontend.
7. Add the backend and frontend variables above.
8. Redeploy both services.

### Post-deploy checks

- Backend health: `https://YOUR-BACKEND-DOMAIN/api/health`
- Backend docs: `https://YOUR-BACKEND-DOMAIN/api-docs`
- Frontend loads from its Railway domain
- Signup/login works
- Event creation works
- Third-party integrations work after real secrets are added
