# ShelfSight AI

ShelfSight AI is a full-stack retail shelf audit platform that combines secure authentication, organization-scoped inventory management, and Google Gemini-powered shelf-image analysis.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL + pg
- AI: Google Gemini via @google/genai
- Auth: JWT + bcrypt

## Monorepo structure

- frontend/: Vite React application
- backend/: Express API and PostgreSQL integration

## Local setup

Requirements: Node.js 20 or later and npm. Local development uses a persistent embedded PostgreSQL database by default, so a separate PostgreSQL install is optional. From PowerShell, create the environment files and install dependencies:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm install
```

Set a long random `JWT_SECRET` in `backend/.env`. The default `USE_EMBEDDED_DATABASE=true` stores local database files under `%LOCALAPPDATA%/ShelfSight AI/database` on Windows or `~/.local/share/shelfsight-ai/database` on other systems, and applies the initial migration automatically. Local embedded mode also creates one demo market with three sample shelves for organizations that have no stores. Set `GEMINI_API_KEY` to enable image analysis. The frontend API URL defaults to `http://localhost:5000/api`.

To use an installed or hosted PostgreSQL instance instead, set its `DATABASE_URL` and set `USE_EMBEDDED_DATABASE=false`. Apply migrations manually as described below. Production always uses `DATABASE_URL`; embedded mode is disabled in production.

For an external PostgreSQL database, create the database and apply the initial schema:

```powershell
psql $env:DATABASE_URL -f backend/migrations/0001_init.sql
```

Run the API and frontend in separate terminals:

```powershell
npm run dev:backend
npm run dev:frontend
```

The frontend is available at `http://localhost:5173`; the API listens at `http://localhost:5000`. Build the frontend with `npm run build:frontend`.

## Configuration

Backend settings are listed in `backend/.env.example`: database URL, JWT expiry/secret, Gemini model/key, CORS origin, upload directory and size limit, and rate limits. Frontend settings are listed in `frontend/.env.example`.

## API overview

All application routes are under `/api`. Protected endpoints require `Authorization: Bearer <token>`.

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET|POST /stores`, `GET|PATCH|DELETE /stores/:storeId`
- `GET|POST /stores/:storeId/shelves`, `GET|PATCH|DELETE /shelves/:shelfId`
- `GET|POST /audits`, `GET|PATCH|DELETE /audits/:auditId`, `POST /audits/:auditId/analyze`
- `GET /findings`, `GET /findings/:findingId`, `PATCH /findings/:findingId/review`
- `GET|POST /tasks`, `GET|PATCH|DELETE /tasks/:taskId`
- `GET /dashboard/summary` and `/analytics/audit-trends`, `/analytics/issue-distribution`, `/analytics/store-performance`, `/analytics/task-summary`

Audit creation accepts multipart form data with an `image` file, `storeId`, `shelfId`, and optional `auditNotes`. Supported image types are JPEG, PNG, and WebP.

## Deployment notes

- `.github/workflows/deploy-pages.yml` deploys the frontend only. Create a GitHub repository, push this project to its `main` branch, then set the repository Actions variable `VITE_API_BASE_URL` to the hosted backend URL including `/api`.
- In GitHub repository settings, enable Pages with the GitHub Actions source. Pushes to `main` then build and deploy the frontend. The workflow fails if `VITE_API_BASE_URL` is missing rather than publishing a frontend that calls localhost.
- The Pages fallback and Vite base path support direct routes such as `/login` under the repository subpath.
- Deploy the backend as a Node.js service with `npm start`, and set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `GEMINI_API_KEY` in the service environment.
- Set `FRONTEND_URL` to the deployed GitHub Pages origin for backend CORS. Store database and Gemini credentials as backend-host secrets, not GitHub Pages variables.
- Embedded PGlite is for local development and single-process evaluation, not a substitute for a managed production database.
- Apply SQL migrations as a separate deployment step. The project currently includes an initial SQL migration but no automated migration runner.
- The API writes uploaded images to `UPLOAD_DIR` on local disk. Use a persistent volume or move uploads to object storage before deploying to an ephemeral/serverless filesystem.
- Keep the Gemini key and database credentials on the backend only. Use HTTPS and a dedicated least-privilege database role in production.

## Security status

API queries include organization filters, and the migration defines PostgreSQL RLS policies keyed to `app.current_organization_id`. The current API does not set that PostgreSQL setting per request or transaction; therefore, the RLS policies are not yet an active tenant-isolation layer for a restricted database role. Complete transaction-scoped tenant context before relying on RLS as a production security boundary. Do not use a superuser database credential in production.

## Health check

`GET /api/health` checks PostgreSQL connectivity and returns HTTP 503 when the database is unavailable. It does not verify Gemini availability.
