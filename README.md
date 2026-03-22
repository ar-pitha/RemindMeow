# Alaram

## Project overview

Alaram is a full-stack PWA alarm and task scheduling app with:
- User authentication (register/login)
- Task CRUD + recurring alarms
- Push notifications and alarm sound handling
- Analytics dashboard and notification diagnostics

## Repository structure

- `backend/`: Express API, MongoDB models, schedulers, services, and websockets.
- `frontend/`: React PWA UI, service worker, Firebase messaging integration.

## Key features

- Create and manage timed tasks and reminders.
- Run recurring task scheduler with job state maintainers.
- Notifications that work in browser foreground and with PWA capabilities.
- Admin-like user activity analytics and notification history.

## Setup and run locally

### 1. Backend

```powershell
cd backend
npm install
# configure .env (MONGO_URI, JWT_SECRET, FIREBASE keys etc.)
npm run dev
```

### 2. Frontend

```powershell
cd frontend
npm install
npm start
```

### 3. Production build

```powershell
cd frontend
npm run build
```

## Development notes

- Backend routes in `backend/routes/{auth,task,user,notification,analytics}Routes.js`.
- Controllers in `backend/controllers/*Controller.js`.
- Scheduler logic in `backend/schedulers/`.
- frontend PWA + Firebase config in `frontend/src/firebase/firebase.js`.

## Troubleshooting

- Ensure MongoDB is running and connected.
- Ensure service worker scope is root for PWA features.
- On iOS, auto-play sound in background is limited by browser restrictions.

## Contribution

Please open issues for bug reports, or PRs for enhancements, with clear reproduction steps.
