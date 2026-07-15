# Installation Guide – CodeLens AI

## System requirements

- **OS**: macOS, Linux, or Windows (WSL2 recommended on Windows)
- **Node.js**: 20.x or newer
- **npm**: 10.x or newer
- **Python**: 3.11 – 3.13
- **Git**

Optional for production parity:

- PostgreSQL 15+ (or Neon serverless)
- Docker

---

## Clone & layout

```bash
git clone <your-repo-url> codelens-ai
cd codelens-ai
```

You should see `frontend/`, `backend/`, and `docs/`.

---

## Backend setup

```bash
cd backend

# Virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Environment
cp .env.example .env
```

### Configure `.env`

Minimum for local development:

```env
SECRET_KEY=replace-with-a-long-random-string
DATABASE_URL=sqlite+aiosqlite:///./codelens.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GEMINI_API_KEY=your_key_here
DEFAULT_AI_PROVIDER=gemini
```

> Without an AI key, the API still runs and returns a graceful fallback review so you can exercise the full UI.

### Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `GET http://localhost:8000/api/v1/health`
- OpenAPI: `http://localhost:8000/docs`

Tables are created automatically on startup (`Base.metadata.create_all`). For production migrations, use Alembic:

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

---

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=CodeLens AI
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview
```

---

## First-run checklist

1. Register a user at `/register`
2. Open Dashboard – stats should show zeros
3. Go to **Review**, keep the sample Fibonacci code, click **Run AI review**
4. Explore Results, Compare, AI Chat, and PDF export
5. Confirm the review appears under **History**

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS errors | Ensure frontend origin is listed in `CORS_ORIGINS` |
| 401 after login | Clear `localStorage` tokens; check `SECRET_KEY` stability |
| AI 502 / fallback scores | Verify `GEMINI_API_KEY` / `OPENAI_API_KEY` |
| Monaco blank | Allow CDN / network for editor assets; hard refresh |
| Postgres SSL issues on Neon | Use `postgresql+asyncpg://...` with Neon’s SSL params |

---

## IDE tips

- Open the monorepo root; mark `frontend` and `backend` as separate projects if needed
- Use the FastAPI OpenAPI schema to generate types if you extend the API
- Tailwind v4 is configured via `@tailwindcss/vite` – no `tailwind.config.js` required
