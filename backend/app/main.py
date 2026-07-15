"""CodeLens AI – FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app import models  # noqa: F401 – register models

logging.basicConfig(level=logging.INFO if settings.debug else logging.WARNING)
logger = logging.getLogger("codelens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup (simple bootstrap; use Alembic in prod migrations)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("%s started (env=%s)", settings.app_name, settings.app_env)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Intelligent AI-powered code reviewer. "
        "Detects bugs, security issues, performance problems, "
        "analyzes complexity, and suggests optimized code."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
        "health": f"{settings.api_v1_prefix}/health",
    }
