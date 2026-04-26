# CareerPilot-AI

AI-driven career guidance platform that analyzes resumes, identifies skill gaps, and recommends personalized career paths with learning roadmaps.

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React, TypeScript, Tailwind CSS, Vite   |
| Backend  | Node.js, Express, TypeScript            |
| Database | MongoDB (Mongoose)                      |
| AI/NLP   | Python NLP pipeline, TF-IDF scoring, text similarity |
| Auth     | JWT, bcrypt                             |
| Docs     | Swagger/OpenAPI                         |

## Project Structure

```
CareerPilot-AI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context (auth)
│   │   ├── lib/            # API client (axios)
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript type definitions
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB connection, env, swagger
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, error handling, validation
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic (resume parser, career engine, email)
│   │   └── seeds/          # Database seed data
│   └── uploads/            # Resume file storage
└── package.json            # Root scripts (concurrent dev)
```

## Features (Core MVP)

- **User Authentication** — Register, login, JWT tokens, email verification, password reset
- **Resume Parsing** — Upload PDF/DOCX, NLP-based skill extraction, education & experience parsing
- **Skill Gap Analysis** — Compare user skills against career requirements with category breakdowns
- **Career Recommendations** — AI scoring engine matching skills to career paths with explanations
- **Learning Roadmaps** — Phase-by-phase learning paths with courses and certifications
- **Resume Coaching** — Tailored resume improvement suggestions and portfolio project ideas based on parsed skills and top-fit roles
- **Dashboard Analytics** — Visual charts showing skills, career matches, and gap percentages

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3
- MongoDB running locally or a MongoDB Atlas connection string

### Setup

```bash
# Install all dependencies
npm run install:all

# Copy environment config
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# Seed the database with skills and career paths
npm run seed --prefix server

# Start both frontend and backend in development
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:5000`.

### API Documentation

Visit `http://localhost:5000/api-docs` for Swagger UI.

### API Endpoints

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| POST   | `/api/auth/register`              | Register new user              |
| POST   | `/api/auth/login`                 | Login                          |
| GET    | `/api/auth/me`                    | Get current user profile       |
| POST   | `/api/auth/verify-email`          | Verify email                   |
| POST   | `/api/auth/forgot-password`       | Request password reset         |
| POST   | `/api/auth/reset-password`        | Reset password                 |
| PUT    | `/api/auth/profile`               | Update profile                 |
| POST   | `/api/resume/upload`              | Upload and parse resume        |
| GET    | `/api/resume`                     | List user's resumes            |
| GET    | `/api/resume/:id`                 | Get resume details             |
| GET    | `/api/resume/:id/suggestions`     | Get resume coaching report     |
| DELETE | `/api/resume/:id`                 | Delete resume                  |
| GET    | `/api/career/dashboard`           | Dashboard analytics            |
| GET    | `/api/career/paths`               | List all career paths          |
| GET    | `/api/career/paths/:slug`         | Career path details + roadmap  |
| POST   | `/api/career/analyze/:resumeId`   | Generate recommendations       |
| GET    | `/api/career/recommendations`     | List user's recommendations    |
| GET    | `/api/career/recommendations/:id` | Recommendation details         |
| GET    | `/api/career/skill-gap/:resumeId` | Skill gap analysis             |

## Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run dev`         | Start both client and server      |
| `npm run dev:server`  | Start server only                 |
| `npm run dev:client`  | Start client only                 |
| `npm run build`       | Build both client and server      |
| `npm run install:all` | Install all dependencies          |
