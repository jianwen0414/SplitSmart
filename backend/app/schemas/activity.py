from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    group_id: UUID
    user_id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None = None
    metadata: dict = Field(default_factory=dict, validation_alias="activity_metadata")
    created_at: datetime
