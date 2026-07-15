# API Documentation – CodeLens AI

Base URL (local): `http://localhost:8000/api/v1`  
Interactive docs: `http://localhost:8000/docs`

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

---

## Auth

### `POST /auth/register`

Create a user.

```json
{
  "email": "dev@example.com",
  "username": "devuser",
  "password": "securepass1",
  "full_name": "Dev User"
}
```

**201** → `UserOut`

### `POST /auth/login`

```json
{ "email": "dev@example.com", "password": "securepass1" }
```

**200**

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

### `POST /auth/refresh`

```json
{ "refresh_token": "..." }
```

### `GET /auth/me`

Returns the authenticated user.

---

## Users

### `GET /users/me` · `PATCH /users/me`

Update fields: `full_name`, `bio`, `avatar_url`, `preferred_ai_provider` (`gemini` | `openai`).

### `POST /users/me/password`

```json
{
  "current_password": "old",
  "new_password": "newsecure1"
}
```

**204**

### `GET /users/me/stats`

```json
{
  "total_reviews": 12,
  "favorite_reviews": 3,
  "average_score": 81.5,
  "languages_used": { "python": 8, "typescript": 4 },
  "reviews_this_week": 2,
  "reviews_this_month": 7
}
```

---

## Reviews

### `POST /reviews`

Submit code for AI analysis.

```json
{
  "title": "Binary search",
  "language": "python",
  "source_code": "def search(...):\n  ...",
  "filename": "search.py",
  "ai_provider": "gemini"
}
```

**201** → full `ReviewOut` including structured `result`:

```json
{
  "quality_score": 88,
  "summary": "...",
  "bugs": [{ "severity": "medium", "title": "...", "description": "...", "line": 12, "suggestion": "..." }],
  "security_issues": [],
  "performance_issues": [],
  "readability": { "score": 90, "notes": ["..."] },
  "maintainability": { "score": 85, "notes": ["..."] },
  "best_practices": [],
  "complexity": {
    "time_complexity": "O(log n)",
    "space_complexity": "O(1)",
    "explanation": "..."
  },
  "optimizations": ["..."],
  "refactored_code": "...",
  "line_explanations": [{ "line": 1, "code": "...", "explanation": "..." }],
  "strengths": ["..."],
  "language_detected": "python"
}
```

### `GET /reviews`

Query params:

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | default 1 |
| `page_size` | int | default 12, max 50 |
| `q` | string | search title/summary/filename |
| `language` | string | filter |
| `favorites_only` | bool | filter |

### `GET /reviews/{id}` · `PATCH /reviews/{id}` · `DELETE /reviews/{id}`

### `POST /reviews/{id}/favorite`

Toggles `is_favorite`.

### `POST /reviews/{id}/actions`

```json
{
  "action": "unit_tests",
  "ai_provider": "gemini"
}
```

`action` ∈ `explain_functions` | `unit_tests` | `documentation` | `readme` | `optimize`

**200** → `{ "action": "...", "content": "markdown..." }`

### `POST /reviews/convert`

```json
{
  "source_code": "...",
  "source_language": "python",
  "target_language": "typescript",
  "ai_provider": "openai"
}
```

### `GET /reviews/{id}/pdf`

Returns `application/pdf` attachment.

---

## Chat

### `GET /reviews/{id}/chat`

```json
{ "messages": [ { "id": 1, "role": "user", "content": "...", "created_at": "..." } ] }
```

### `POST /reviews/{id}/chat`

```json
{
  "content": "Why is this O(n^2)?",
  "action": "chat",
  "ai_provider": "gemini"
}
```

**201** → assistant `ChatMessageOut`

---

## Health

### `GET /health`

```json
{ "status": "ok", "app": "CodeLens AI", "env": "development", "ai_default": "gemini" }
```

---

## Error format

```json
{ "detail": "Human readable message" }
```

Validation errors (422) return FastAPI’s standard array of field errors.
