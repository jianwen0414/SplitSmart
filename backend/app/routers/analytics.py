from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.analytics import AnalyticsResponse
from app.services import analytics_service, group_service
from app.utils.auth import get_current_user_id

router = APIRouter(prefix="/groups/{group_id}", tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(group_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await group_service.get_group(db, group_id, user_id)
    return await analytics_service.aggregate(db, group_id)
