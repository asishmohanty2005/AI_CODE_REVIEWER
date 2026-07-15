# Deployment Guide – CodeLens AI

Target topology:

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |

---

## 1. Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Convert to async SQLAlchemy form:

```text
postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
```

> Note: some Neon URLs use `sslmode=require` for `psycopg`; for `asyncpg` prefer `ssl=require`.

---

## 2. Backend on Render

### Option A – Blueprint

1. Push the repo to GitHub
2. In Render: **New → Blueprint**
3. Select the repo; it will pick up `backend/render.yaml`
4. Set secret env vars:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `CORS_ORIGINS` = `https://your-frontend.vercel.app`
   - `DATABASE_URL` from Neon (async form)
   - `SECRET_KEY` (generate a long random value)
   - `FRONTEND_URL` = your Vercel URL
   - `APP_ENV=production`
   - `DEBUG=false`

### Option B – Manual web service

- **Root directory**: `backend`
- **Runtime**: Python 3.12
- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Option C – Docker

```bash
cd backend
docker build -t codelens-api .
docker run -p 8000:8000 --env-file .env codelens-api
```

Health check path: `/api/v1/health`

---

## 3. Frontend on Vercel

1. **New Project** → import monorepo
2. **Root Directory**: `frontend`
3. Framework: Vite
4. Build command: `npm run build`
5. Output: `dist`
6. Environment variables:

```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_APP_NAME=CodeLens AI
```

7. Deploy

### `vercel.json` (optional, SPA rewrites)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

A starter file is included at `frontend/vercel.json`.

---

## 4. Post-deploy checklist

- [ ] `GET /api/v1/health` returns `ok`
- [ ] CORS allows the Vercel origin
- [ ] Register + login works end-to-end
- [ ] Review with a real `GEMINI_API_KEY` returns non-fallback scores
- [ ] PDF download works
- [ ] Refresh token rotation works after access token expiry

---

## 5. Security hardening

- Rotate `SECRET_KEY` if it was ever committed
- Never expose AI keys to the frontend
- Prefer Neon + Render private networking where available
- Set short access token TTL in production if needed
- Enable HTTPS only (both platforms do this by default)
- Rate-limit AI endpoints at the reverse proxy if you expect abuse

---

## 6. CI suggestions (optional)

```yaml
# .github/workflows/ci.yml (sketch)
# - backend: pip install + pytest
# - frontend: npm ci && npm run build
```

---

## 7. Custom domain

1. Add domain on Vercel for the SPA
2. Add domain on Render for the API (or use a reverse proxy)
3. Update `CORS_ORIGINS` and `VITE_API_URL` accordingly
