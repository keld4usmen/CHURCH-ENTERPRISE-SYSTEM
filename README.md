# Church Enterprise Pilot UI

A React + Vite frontend for the Church Enterprise Pilot.

## Files
- `index.html` — Vite entry HTML
- `package.json` — build and dependency configuration
- `vite.config.js` — Vite React plugin config
- `src/main.jsx` — React app bootstrap
- `src/App.jsx` — chat UI and church data logic
- `src/styles.css` — component styling
- `src/data/church_data.json` — sample church knowledge base

## Run locally
1. Open a terminal in this folder.
2. Install dependencies:
   - `npm install`
3. Start local development server:
   - `npm run dev`
4. Open the shown Vite URL in your browser.

## Build for production
- `npm run build`
- `npm run preview`

## Backend API
A new Express backend is available with SQLite persistence and sync logic.

Run the backend server:
- `npm run backend`
- or `npm start`

Available endpoints:
- `GET /api/church` — returns church, departments, events, policies, faqs, and roles
- `GET /api/notifications` — returns event and policy notifications
- `POST /api/inquiry` — routes inquiries to the right department and stores them
- `POST /api/sync` — syncs `src/data/church_data.json` into the SQLite database
- `GET /api/departments` — returns department contact info
- `GET /api/events` — returns event details
- `GET /api/policies` — returns policy summaries

## Usage
- Ask questions like:
  - "What time is Sunday service?"
  - "Who leads worship?"
  - "Tell me about upcoming events."
  - "How do I contact the church office?"
- Use the quick action buttons for fast answers.

## Webhook integration
This UI now sends chat messages to the configured n8n webhook URL:
`https://yikkyman.app.n8n.cloud/webhook/e47f7c37-8207-47ce-9bf5-52b40ce16ade`

If you receive a 404 webhook error, make sure the n8n workflow is active. In n8n, activate the workflow using the toggle in the editor's top-right corner.

## Thunder Client
You can import `fota-webhook.postman_collection.json` into Thunder Client to test the webhook directly.

## Notes
This project is a lightweight church assistant frontend that reads church data from local JSON and responds with keyword-guided answers. It now also routes live chat requests through the configured n8n webhook while preserving local fallback behavior when the webhook is unavailable.
