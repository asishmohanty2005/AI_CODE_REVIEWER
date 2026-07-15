# CodeLens AI – Intelligent Code Reviewer

Premium full-stack AI code review platform. Paste or upload source code, get a structured quality report (bugs, security, performance, complexity, refactors), chat about the results, generate tests/docs, convert languages, and export PDFs.

![Stack](https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=flat-square)
![Backend](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square)
![AI](https://img.shields.io/badge/Gemini-OpenAI-8B5CF6?style=flat-square)

---

## Features

- **Auth** – Register, login, JWT access + refresh tokens, profile & settings
- **Dashboard** – Stats, language charts, recent & favorite reviews
- **Monaco editor** – Multi-language source editing with file upload
- **AI review** – Quality score, bugs, security, performance, readability, maintainability, best practices, complexity (time/space), optimizations, refactored code, line-by-line notes
- **AI chat** – Conversational follow-ups on any review
- **Actions** – Explain functions, unit tests, documentation, README, optimize
- **Convert** – Translate code between supported languages
- **Compare** – Original vs refactored side-by-side
- **History** – Search, filter, favorite, delete
- **PDF export** – Downloadable review reports
- **Providers** – Google Gemini (default) + optional OpenAI
- **UI** – Dark glassmorphism theme inspired by Linear / Vercel / Stripe

### Supported languages

Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, HTML, CSS, SQL (+ auto-detect)

---

## Project structure

```
codelens-ai/
├── backend/                 # FastAPI + SQLAlchemy + AI services
│   ├── app/
│   │   ├── api/v1/          # REST routers
│   │   ├── core/            # Config, security, deps
│   │   ├── db/              # Engine & session
│   │   ├── models/          # ORM
│   │   ├── schemas/         # Pydantic
│   │   ├── services/        # AI + PDF
│   │   └── main.py
│   ├── alembic/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
├── frontend/                # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── docs/
│   ├── API.md
│   ├── INSTALLATION.md
│   └── DEPLOYMENT.md
└── README.md
```

---

## Quick start

### Prerequisites

- Node.js 20+
- Python 3.11+
- (Optional) PostgreSQL / Neon for production
- Gemini and/or OpenAI API key

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env – set SECRET_KEY and GEMINI_API_KEY (or OPENAI_API_KEY)
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

SQLite is used by default (`sqlite+aiosqlite:///./codelens.db`) so you can develop without Postgres.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing secret | required in prod |
| `DATABASE_URL` | Async SQLAlchemy URL | SQLite file |
| `CORS_ORIGINS` | Comma-separated origins | localhost:5173 |
| `GEMINI_API_KEY` | Google AI Studio key | — |
| `OPENAI_API_KEY` | OpenAI key | — |
| `DEFAULT_AI_PROVIDER` | `gemini` or `openai` | `gemini` |
| `GEMINI_MODEL` | Model name | `gemini-2.0-flash` |
| `OPENAI_MODEL` | Model name | `gpt-4o-mini` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime | `60` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base, e.g. `https://api.example.com/api/v1` |
| `VITE_APP_NAME` | App display name |

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get tokens |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| GET | `/api/v1/auth/me` | Current user |
| GET/PATCH | `/api/v1/users/me` | Profile |
| GET | `/api/v1/users/me/stats` | Dashboard stats |
| POST | `/api/v1/reviews` | Create AI review |
| GET | `/api/v1/reviews` | List / search history |
| GET | `/api/v1/reviews/{id}` | Review detail |
| POST | `/api/v1/reviews/{id}/favorite` | Toggle favorite |
| POST | `/api/v1/reviews/{id}/actions` | Secondary AI actions |
| POST | `/api/v1/reviews/convert` | Language conversion |
| GET | `/api/v1/reviews/{id}/pdf` | PDF export |
| GET/POST | `/api/v1/reviews/{id}/chat` | AI chat |

Full reference: [docs/API.md](docs/API.md)

---

## Deployment

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontend | **Vercel** | Build `frontend`, env `VITE_API_URL` |
| Backend | **Render** | Use `backend/render.yaml` or Docker |
| Database | **Neon PostgreSQL** | Set `DATABASE_URL=postgresql+asyncpg://...` |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step instructions.

---

## Architecture notes

- **Clean separation** – API routers → services → models; frontend pages → services → API client
- **JWT auth** – Bearer access tokens + refresh rotation
- **AI abstraction** – Single service with Gemini/OpenAI adapters and graceful fallbacks
- **Async SQLAlchemy 2.0** – Works with SQLite (local) and Postgres (prod)
- **Structured AI output** – JSON schema validated with Pydantic before persistence

---

## License

MIT – use freely for personal and commercial projects.

---

**CodeLens AI** · Intelligent Code Reviewer · Built with care for production quality.
