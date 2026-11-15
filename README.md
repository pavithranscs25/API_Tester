# API Tester

API Tester is a developer-focused workspace for building and sending HTTP requests. The React frontend communicates with a Spring Boot backend, which executes external API requests on its behalf.

## Features

- Send `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- Configure query parameters, headers, authorization, and JSON request bodies.
- Enable or disable individual query parameters and headers.
- Validate URLs and JSON bodies before sending.
- View response status, timing, size, body, and headers.
- Switch between pretty and raw response views and copy response content.
- Search, reload, and delete request history saved in browser LocalStorage.
- Switch between dark and light themes.

## Requirements

- Node.js and npm
- Java 21 and Maven (or the included Maven wrapper) to run the backend

## Run locally

Start the Spring Boot backend from the repository root:

```bash
cd backend/api-tester-backend
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run` instead of `./mvnw`.

The backend runs at `http://localhost:8080`. In a separate terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Frontend scripts

Run these commands from the `frontend` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Backend integration

The frontend sends request configurations to:

```text
POST http://localhost:8080/api/requests/execute
```

The JSON payload contains `url`, `method`, `headers`, and `body`. The backend handles the actual external request and returns its response. If the backend is unavailable or rejects a request, API Tester displays the error returned by the backend.

If the backend address changes, update `API_BASE_URL` in `frontend/src/services/api.js`.

## Project structure

```text
backend/api-tester-backend/  Spring Boot API
frontend/                    React + Vite application
  src/
    App.jsx                  Main application and request workspace
    App.css                  Application and responsive styles
    index.css                Global styles
    services/api.js          Spring Boot API client
    utils/request.js         URL parameter and response-size helpers
```

For frontend-specific setup and details, see [frontend/README.md](frontend/README.md).
