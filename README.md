# BONNESANTE MEDICALS — ASAL Enterprise PWA System

## Overview
Full offline-first Progressive Web Application for enterprise operations management.

## Architecture
- **Frontend**: React + TypeScript + Vite (PWA with Service Worker)
- **Backend**: Python FastAPI
- **Database**: PostgreSQL (cloud master) + IndexedDB (local offline)
- **Sync**: Two-way background sync with conflict resolution

## Project Structure
```
BONNESANTE OPERATIONS/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # Config, security, deps
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # App entry
│   ├── alembic/            # DB migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React PWA
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API + sync services
│   │   ├── store/          # State management
│   │   ├── db/             # Dexie IndexedDB
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helpers
│   ├── public/
│   └── vite.config.ts
├── deploy/                 # Deployment configs
└── README.md
```

## Modules
1. User & Role Management (RBAC)
2. Production & Warehouse Management
3. Sales Management
4. Marketing & Customer Care
5. All Staff Activity Log (ASAL Core Engine)
6. Disciplinary Automation Engine
7. KPI & Target Engine
8. Monthly Management Dashboard
9. Offline-First Sync Engine
10. Security Framework

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment
See `deploy/` for Nginx, SSL, and systemd configs.
