"""AI chat endpoints scoped to a review."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.models.chat import ChatMessage
from app.models.review import Review
from app.schemas.chat import ChatHistoryResponse, ChatMessageCreate, ChatMessageOut
from app.services import ai_service

router = APIRouter()


@router.get("/{review_id}/chat", response_model=ChatHistoryResponse)
async def get_chat_history(review_id: int, current_user: CurrentUser, db: DbSession):
    review = await _owned(db, review_id, current_user.id)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.review_id == review.id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return ChatHistoryResponse(
        messages=[ChatMessageOut.model_validate(m) for m in messages]
    )


@router.post(
    "/{review_id}/chat",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def send_chat_message(
    review_id: int,
    payload: ChatMessageCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    review = await _owned(db, review_id, current_user.id)
    provider = payload.ai_provider or current_user.preferred_ai_provider

    # Persist user message
    user_msg = ChatMessage(
        review_id=review.id,
        role="user",
        content=payload.content,
        action=payload.action or "chat",
    )
    db.add(user_msg)
    await db.flush()

    # Load recent history
    hist_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.review_id == review.id)
        .order_by(ChatMessage.created_at.asc())
    )
    history = [
        {"role": m.role, "content": m.content} for m in hist_result.scalars().all()
    ]

    try:
        reply = await ai_service.chat_about_code(
            source_code=review.source_code,
            language=review.language,
            history=history[:-1],  # exclude just-added user msg duplicate context
            user_message=payload.content,
            action=payload.action or "chat",
            provider=provider,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        ) from exc

    assistant_msg = ChatMessage(
        review_id=review.id,
        role="assistant",
        content=reply,
        action=payload.action or "chat",
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)
    return assistant_msg


async def _owned(db, review_id: int, owner_id: int) -> Review:
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.owner_id == owner_id)
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return review
