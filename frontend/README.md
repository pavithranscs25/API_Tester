# API Tester

API Tester is a frontend-only API request workspace built with React, JavaScript, and Vite. It sends requests through the companion Spring Boot backend; the browser does not call external API endpoints directly.

## Requirements

- Node.js and npm
- The Spring Boot backend running at `http://localhost:8080` when executing requests

## Run locally

From the `frontend` directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Features

- Send `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- Configure query parameters, headers, authorization, and JSON request bodies.
- Enable or disable individual query parameters and headers.
- Validate URLs and JSON bodies before sending.
- View response status, timing, size, body, and headers.
- Switch between pretty and raw response views and copy response content.
- Search, reload, and delete request history saved in browser LocalStorage.
- Switch between dark and light themes.

## Backend integration

Requests are submitted to:

```text
POST http://localhost:8080/api/requests/execute
```

The frontend sends a JSON payload containing `url`, `method`, `headers`, and `body`. The backend is responsible for making the actual external request and returning its response. If the backend is unavailable or rejects a request, API Tester displays the error returned by the backend.

If the backend runs at a different address, update `API_BASE_URL` in `src/services/api.js`.

## Project structure

```text
src/
  App.jsx            Main application and request workspace
  App.css            Application and responsive styles
  index.css          Global styles
  services/api.js    Spring Boot API client
  utils/request.js   URL parameter and response-size helpers
```
