"""User profile and statistics endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.core.security import hash_password, verify_password
from app.models.review import Review
from app.models.user import User
from app.schemas.user import UserOut, UserPasswordUpdate, UserStats, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_profile(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_profile(
    payload: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(current_user, key, value)
    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: UserPasswordUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    await db.flush()


@router.get("/me/stats", response_model=UserStats)
async def get_stats(current_user: CurrentUser, db: DbSession):
    uid = current_user.id

    total = await db.scalar(
        select(func.count()).select_from(Review).where(Review.owner_id == uid)
    )
    favorites = await db.scalar(
        select(func.count())
        .select_from(Review)
        .where(Review.owner_id == uid, Review.is_favorite.is_(True))
    )
    avg_score = await db.scalar(
        select(func.avg(Review.quality_score)).where(
            Review.owner_id == uid, Review.quality_score.is_not(None)
        )
    )

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    week_count = await db.scalar(
        select(func.count())
        .select_from(Review)
        .where(Review.owner_id == uid, Review.created_at >= week_ago)
    )
    month_count = await db.scalar(
        select(func.count())
        .select_from(Review)
        .where(Review.owner_id == uid, Review.created_at >= month_ago)
    )

    lang_rows = await db.execute(
        select(Review.language, func.count())
        .where(Review.owner_id == uid)
        .group_by(Review.language)
    )
    languages = {row[0]: row[1] for row in lang_rows.all()}

    return UserStats(
        total_reviews=total or 0,
        favorite_reviews=favorites or 0,
        average_score=round(float(avg_score or 0), 1),
        languages_used=languages,
        reviews_this_week=week_count or 0,
        reviews_this_month=month_count or 0,
    )
