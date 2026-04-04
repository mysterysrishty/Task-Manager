# TaskFlow

TaskFlow is a clean full stack MERN task management app built with MongoDB, Express, React, and Node.js.

## Features

- JWT authentication with register, login, and logout
- Project creation and deletion
- Task creation, filtering, status updates, priority updates, and deletion
- Dashboard analytics for completion rate, upcoming deadlines, and overdue work
- Seeded demo workspace for quick testing

## Project Structure

```text
.
|-- client
|-- server
|-- package.json
`-- README.md
```

## Run Locally

1. Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

2. Create env files from the examples:

```bash
cd server
copy .env.example .env

cd ../client
copy .env.example .env
```

3. Start the backend and frontend from the project root:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

## Environment Variables

Server:

```env
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=replace-with-a-strong-secret
PORT=8001
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@taskflow.com
ADMIN_PASSWORD=admin123
```

Client:

```env
REACT_APP_BACKEND_URL=http://localhost:8001/api
```

## Demo Login

- Email: `demo@taskflow.com`
- Password: `demo123`
