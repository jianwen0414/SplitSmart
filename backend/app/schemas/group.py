from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    base_currency: str = Field(default="MYR", min_length=3, max_length=3)


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    base_currency: str | None = Field(default=None, min_length=3, max_length=3)


class GroupJoin(BaseModel):
    invite_code: str = Field(min_length=1, max_length=8)


class MemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
    display_name: str
    nickname: str | None = None
    role: str
    joined_at: datetime


class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: str | None
    base_currency: str
    created_by: UUID
    invite_code: str
    created_at: datetime
    updated_at: datetime


class GroupDetail(GroupRead):
    members: list[MemberRead] = []
