"""Code review and favorites models."""

from typing import TYPE_CHECKING, Any, List, Optional

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.chat import ChatMessage


class Review(Base, TimestampMixin):
    """A single AI code review session."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled Review")
    language: Mapped[str] = mapped_column(String(64), nullable=False, default="python")
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # AI provider used for this review
    ai_provider: Mapped[str] = mapped_column(String(32), default="gemini", nullable=False)
    ai_model: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Scores & structured results (JSON blobs for flexibility)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Flags
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default="completed", nullable=False
    )  # pending | completed | failed

    owner: Mapped["User"] = relationship("User", back_populates="reviews")
    chat_messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )
    favorites: Mapped[List["ReviewFavorite"]] = relationship(
        "ReviewFavorite", back_populates="review", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Review id={self.id} title={self.title!r} score={self.quality_score}>"


class ReviewFavorite(Base, TimestampMixin):
    """Many-to-many style favorite flag (also mirrored on Review.is_favorite)."""

    __tablename__ = "review_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "review_id", name="uq_user_review_favorite"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    review_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    review: Mapped["Review"] = relationship("Review", back_populates="favorites")
