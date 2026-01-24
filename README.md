# TaskFlow Pro

A professional task scheduler and stakeholder reminder platform with voice-based task creation, automated reminders, and calendar management.

## Features

- 🎤 Voice-based task creation
- 👥 Stakeholder & contact integration
- 📱 Automated reminders (WhatsApp, SMS, Email)
- 📅 Calendar-based task management
- ✅ Verified user identity for sending
- 🔐 Secure authentication with JWT
- 🚀 Production-ready architecture

## Tech Stack

### Frontend
- React + TypeScript
- Next.js (App Router)
- Tailwind CSS
- Zustand (State Management)
- Web Speech API

### Backend
- Node.js + TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis + BullMQ
- JWT Authentication

### DevOps
- Docker & docker-compose
- Environment-based configs
- Centralized logging

## Quick Start

1. Clone the repository
2. Copy environment files: `cp .env.example .env`
3. Start services: `docker-compose up -d`
4. Run migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Access app: http://localhost:3000

## Project Structure

```
taskflow-pro/
├── frontend/          # Next.js React app
├── backend/           # NestJS API server
├── shared/            # Shared types and utilities
├── docker/            # Docker configurations
└── docs/              # Documentation
```

## Development

See individual README files in `frontend/` and `backend/` directories for detailed setup instructions.

## Deployment

Production deployment instructions are available in `docs/deployment.md`.