"""Code review CRUD and AI actions."""

from math import ceil
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select

from app.core.deps import CurrentUser, DbSession
from app.models.review import Review
from app.schemas.review import (
    ActionRequest,
    ConvertCodeRequest,
    ConvertCodeResponse,
    ReviewCreate,
    ReviewListItem,
    ReviewListResponse,
    ReviewOut,
    ReviewUpdate,
)
from app.services import ai_service
from app.services.pdf_service import build_review_pdf

router = APIRouter()


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Submit code for AI review and persist the result."""
    language = payload.language
    if language == "auto":
        language = ai_service.detect_language(payload.source_code, payload.filename)

    provider = payload.ai_provider or current_user.preferred_ai_provider

    result_dict, used_provider, used_model = await ai_service.review_code(
        source_code=payload.source_code,
        language=language,
        filename=payload.filename,
        provider=provider,
    )

    detected = result_dict.get("language_detected") or language
    title = payload.title or (
        f"{(payload.filename or detected).split('/')[-1]} review"
    )

    review = Review(
        owner_id=current_user.id,
        title=title[:255],
        language=detected,
        source_code=payload.source_code,
        filename=payload.filename,
        ai_provider=used_provider,
        ai_model=used_model,
        quality_score=result_dict.get("quality_score"),
        summary=result_dict.get("summary"),
        result=result_dict,
        status="completed",
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.get("", response_model=ReviewListResponse)
async def list_reviews(
    current_user: CurrentUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    q: Optional[str] = Query(None, max_length=200),
    language: Optional[str] = None,
    favorites_only: bool = False,
):
    """Paginated review history with optional search/filter."""
    base = select(Review).where(Review.owner_id == current_user.id)
    count_q = select(func.count()).select_from(Review).where(
        Review.owner_id == current_user.id
    )

    if favorites_only:
        base = base.where(Review.is_favorite.is_(True))
        count_q = count_q.where(Review.is_favorite.is_(True))
    if language:
        base = base.where(Review.language == language)
        count_q = count_q.where(Review.language == language)
    if q:
        like = f"%{q}%"
        filt = or_(
            Review.title.ilike(like),
            Review.summary.ilike(like),
            Review.filename.ilike(like),
        )
        base = base.where(filt)
        count_q = count_q.where(filt)

    total = await db.scalar(count_q) or 0
    pages = max(1, ceil(total / page_size))
    offset = (page - 1) * page_size

    result = await db.execute(
        base.order_by(Review.created_at.desc()).offset(offset).limit(page_size)
    )
    items = result.scalars().all()

    return ReviewListResponse(
        items=[ReviewListItem.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{review_id}", response_model=ReviewOut)
async def get_review(review_id: int, current_user: CurrentUser, db: DbSession):
    review = await _get_owned_review(db, review_id, current_user.id)
    return review


@router.patch("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: int,
    payload: ReviewUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    review = await _get_owned_review(db, review_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(review, key, value)
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: int, current_user: CurrentUser, db: DbSession):
    review = await _get_owned_review(db, review_id, current_user.id)
    await db.delete(review)
    await db.flush()


@router.post("/{review_id}/favorite", response_model=ReviewOut)
async def toggle_favorite(review_id: int, current_user: CurrentUser, db: DbSession):
    review = await _get_owned_review(db, review_id, current_user.id)
    review.is_favorite = not review.is_favorite
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.post("/{review_id}/actions")
async def run_action(
    review_id: int,
    payload: ActionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Run secondary AI actions (unit tests, docs, explain, etc.)."""
    review = await _get_owned_review(db, review_id, current_user.id)
    provider = payload.ai_provider or current_user.preferred_ai_provider
    prompts = {
        "explain_functions": "Explain every function and class in this code.",
        "unit_tests": "Generate comprehensive unit tests.",
        "documentation": "Generate full documentation / docstrings.",
        "readme": "Generate a professional README.md.",
        "optimize": "Optimize this code and explain improvements.",
    }
    message = prompts.get(payload.action, payload.action)
    try:
        content = await ai_service.chat_about_code(
            source_code=review.source_code,
            language=review.language,
            history=[],
            user_message=message,
            action=payload.action,
            provider=provider,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        ) from exc
    return {"action": payload.action, "content": content}


@router.post("/convert", response_model=ConvertCodeResponse)
async def convert_code(payload: ConvertCodeRequest, current_user: CurrentUser):
    provider = payload.ai_provider or current_user.preferred_ai_provider
    try:
        data = await ai_service.convert_code(
            source_code=payload.source_code,
            source_language=payload.source_language,
            target_language=payload.target_language,
            provider=provider,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        ) from exc
    return ConvertCodeResponse(
        source_language=payload.source_language,
        target_language=payload.target_language,
        converted_code=data["converted_code"],
        notes=data.get("notes"),
    )


@router.get("/{review_id}/pdf")
async def export_pdf(review_id: int, current_user: CurrentUser, db: DbSession):
    review = await _get_owned_review(db, review_id, current_user.id)
    pdf_bytes = build_review_pdf(
        title=review.title,
        language=review.language,
        quality_score=review.quality_score,
        summary=review.summary,
        result=review.result,
        source_code=review.source_code,
        created_at=review.created_at,
    )
    filename = f"codelens-review-{review.id}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_owned_review(db, review_id: int, owner_id: int) -> Review:
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.owner_id == owner_id)
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
        )
    return review
