# RPF Management

A MERN-stack RFP (Request for Proposal) management application.

## Prerequisites

- Node.js (>= 16)
- npm or yarn

## Setup

# RPF Management

A compact MERN-stack application for managing RFPs (Request for Proposal). This project provides endpoints to generate RFPs, manage vendors, send RFPs to vendors, and compare received proposals. The README below gives quick setup and API reference so you can run and share the project with others.

## Quick facts

- **Author:** Aditya Maurya
- **Node start script:** `npm start` (runs `node src/index.js`)
- **Dev script:** `npm run dev` (runs `nodemon src/index.js`)

## Requirements

- Node.js >= 16
- npm (or yarn)
- MongoDB instance (local or hosted)

## Install

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd "RPF Management"
npm install
```

Create a `.env` file in the project root (do not commit `.env`). Example variables used by the project:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/rpf-db

# Email (IMAP/SMTP) used by email-listener / notifier
EMAIL_HOST=imap.example.com
EMAIL_PORT=993
EMAIL_SECURE=true
EMAIL_USER=you@example.com
EMAIL_PASS=your-email-password

# OpenAI / Google generative AI
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Any other secrets used by services
```

Tip: Create a `.env.example` with keys (no secrets) to share with collaborators.

## Run

Start in development (auto-restarts):

```bash
npm run dev
```

Start production:

```bash
npm start
```

## API Reference (primary routes)

Base URL: `http://localhost:<PORT>` (default `3000`)

- **Health check**
	- `GET /health` — returns service health status.

- **Email parsing (test)**
	- `GET /parse-test` — runs a test email parse routine (used by the email service).

- **RFPs**
	- `POST /generate` — generate a new RFP (request body expected).
	- `POST /send` — send an RFP to vendors.
	- `GET /list` — list all RFPs.
	- `GET /:id` — get a single RFP by id.
	- `GET /:id/proposals` — list proposals submitted for an RFP.
	- `GET /:id/comparison` — compare proposals for an RFP.

- **Vendors**
	- `GET /list` — list registered vendors.
	- `POST /create` — create a new vendor.
	- `PUT /update/:id` — update vendor by id.
	- `DELETE /delete/:id` — delete vendor by id.

Notes: All API routes are declared in `src/routes`. Adjust middleware, auth, or validation as needed for production.

## Project Structure

- `src/` — application source
	- `index.js` — application entry
	- `app.js` — express app setup
	- `routes/` — route definitions
	- `controllers/` — request handlers
	- `models/` — Mongoose models
	- `services/` — background and integration services (email, AI)
- `db/` — database connection helper
- `utils/` — common helpers and response/error wrappers

## Development notes

- The project uses `nodemon` for development. Ensure `nodemon` is installed (it's in `devDependencies` here as a dependency).
- Sensitive files must not be committed — use `.gitignore` to exclude `.env`, `node_modules/`, and other artifacts.
- Add tests and CI as needed before sharing publicly.

## Troubleshooting

- Mongo connection errors: verify `MONGO_URI` and that MongoDB is reachable.
- Email service issues: confirm IMAP/SMTP host, port and credentials.
- AI integrations: ensure correct API keys for OpenAI / Google and that billing/APIs are enabled.

## License

MIT

---

If you want, I can also generate a minimal `curl` collection or Postman collection for the endpoints so you can hand it to the reviewer. Would you like that?
