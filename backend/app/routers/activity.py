from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.activity import ActivityRead
from app.services import activity_service, group_service
from app.utils.auth import get_current_user_id

router = APIRouter(prefix="/groups/{group_id}", tags=["activity"])


@router.get("/activities", response_model=list[ActivityRead])
async def list_(
    group_id: UUID,
    type: str | None = Query(default=None),
    member: UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await group_service.get_group(db, group_id, user_id)
    return await activity_service.list_activities(
        db, group_id=group_id, action=type, member=member, limit=limit, offset=offset,
    )
