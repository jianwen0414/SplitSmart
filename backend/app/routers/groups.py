from uuid import UUID
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.group import GroupCreate, GroupUpdate, GroupJoin, GroupRead, GroupDetail
from app.services import group_service
from app.utils.auth import get_current_user_id
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create(request: Request, payload: GroupCreate, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await group_service.create_group(db, user_id, payload)


@router.get("", response_model=list[GroupRead])
async def list_mine(user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await group_service.list_user_groups(db, user_id)


@router.post("/join", response_model=GroupRead)
@limiter.limit("10/minute")
async def join(request: Request, payload: GroupJoin, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await group_service.join_group_by_invite(db, user_id, payload.invite_code)


@router.get("/{group_id}", response_model=GroupDetail)
async def detail(group_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    group = await group_service.get_group(db, group_id, user_id)
    members = await group_service.get_group_members(db, group_id)
    return GroupDetail.model_validate({**{c.name: getattr(group, c.name) for c in group.__table__.columns}, "members": [m.model_dump() for m in members]})


@router.put("/{group_id}", response_model=GroupRead)
async def update(group_id: UUID, payload: GroupUpdate, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await group_service.update_group(db, group_id, user_id, payload)


@router.delete("/{group_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def leave(group_id: UUID, member_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # User can only remove themselves in this scaffold (admin-remove-other is future scope).
    if member_id != user_id:
        from fastapi import HTTPException
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail={"code": "FORBIDDEN", "message": "you can only remove yourself"})
    await group_service.leave_group(db, group_id, user_id)
    return None
