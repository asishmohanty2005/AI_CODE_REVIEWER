"""User schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=128)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = Field(None, max_length=512)
    preferred_ai_provider: Optional[str] = Field(None, pattern=r"^(gemini|openai)$")


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    preferred_ai_provider: str
    plan: str
    created_at: datetime
    updated_at: datetime


class UserStats(BaseModel):
    total_reviews: int = 0
    favorite_reviews: int = 0
    average_score: float = 0.0
    languages_used: dict[str, int] = Field(default_factory=dict)
    reviews_this_week: int = 0
    reviews_this_month: int = 0
