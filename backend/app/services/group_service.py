from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.group import Group, GroupMember
from app.models.profile import Profile
from app.schemas.group import GroupCreate, GroupUpdate, MemberRead
from app.services import activity_service


async def create_group(session: AsyncSession, creator_id: UUID, payload: GroupCreate) -> Group:
    group = Group(
        id=uuid4(),
        name=payload.name,
        description=payload.description,
        base_currency=payload.base_currency,
        created_by=creator_id,
    )
    session.add(group)
    await session.flush()
    session.add(GroupMember(id=uuid4(), group_id=group.id, user_id=creator_id, role="admin"))
    await session.flush()
    return group


async def list_user_groups(session: AsyncSession, user_id: UUID) -> list[Group]:
    res = await session.execute(
        select(Group).join(GroupMember, GroupMember.group_id == Group.id).where(GroupMember.user_id == user_id).order_by(Group.created_at.desc())
    )
    return list(res.scalars().all())


async def get_group(session: AsyncSession, group_id: UUID, user_id: UUID) -> Group:
    res = await session.execute(
        select(Group).join(GroupMember, GroupMember.group_id == Group.id).where(Group.id == group_id, GroupMember.user_id == user_id)
    )
    group = res.scalar_one_or_none()
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "group not found or you are not a member"})
    return group


async def get_group_members(session: AsyncSession, group_id: UUID) -> list[MemberRead]:
    res = await session.execute(
        select(GroupMember, Profile.display_name)
        .join(Profile, Profile.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
    )
    out: list[MemberRead] = []
    for member, display_name in res.all():
        out.append(MemberRead(
            user_id=member.user_id,
            display_name=display_name,
            nickname=member.nickname,
            role=member.role,
            joined_at=member.joined_at,
        ))
    return out


async def update_group(session: AsyncSession, group_id: UUID, user_id: UUID, payload: GroupUpdate) -> Group:
    group = await get_group(session, group_id, user_id)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(group, k, v)
    await session.flush()
    await activity_service.log(
        session, group_id=group_id, user_id=user_id,
        action="group_updated", entity_type="group", entity_id=group_id,
        metadata={"fields": list(data.keys())},
    )
    return group


async def join_group_by_invite(session: AsyncSession, user_id: UUID, invite_code: str) -> Group:
    res = await session.execute(select(Group).where(Group.invite_code == invite_code))
    group = res.scalar_one_or_none()
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "invite code not found"})
    existing = await session.execute(select(GroupMember).where(GroupMember.group_id == group.id, GroupMember.user_id == user_id))
    if existing.scalar_one_or_none() is None:
        session.add(GroupMember(id=uuid4(), group_id=group.id, user_id=user_id, role="member"))
        await session.flush()
        name_res = await session.execute(select(Profile.display_name).where(Profile.id == user_id))
        member_name = name_res.scalar_one_or_none() or ""
        await activity_service.log(
            session, group_id=group.id, user_id=user_id,
            action="member_joined", entity_type="member", entity_id=user_id,
            metadata={"member_name": member_name},
        )
    return group


async def leave_group(session: AsyncSession, group_id: UUID, user_id: UUID) -> None:
    name_res = await session.execute(select(Profile.display_name).where(Profile.id == user_id))
    member_name = name_res.scalar_one_or_none() or ""
    await session.execute(delete(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    await session.flush()
    await activity_service.log(
        session, group_id=group_id, user_id=user_id,
        action="member_left", entity_type="member", entity_id=user_id,
        metadata={"member_name": member_name},
    )
