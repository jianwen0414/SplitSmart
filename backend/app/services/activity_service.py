"""Central activity logger. Every mutating service should call `log(...)`.

Activities table must exist in Supabase per PRD §4 — backend will 500 if not.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity

VALID_ACTIONS = {
    "expense_created", "expense_updated", "expense_deleted",
    "settlement_created", "member_joined", "member_left", "group_updated",
}
VALID_ENTITY_TYPES = {"expense", "settlement", "group", "member"}


async def log(
    session: AsyncSession,
    *,
    group_id: UUID,
    user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> Activity:
    if action not in VALID_ACTIONS:
        raise ValueError(f"unknown activity action: {action}")
    if entity_type not in VALID_ENTITY_TYPES:
        raise ValueError(f"unknown entity_type: {entity_type}")
    act = Activity(
        id=uuid4(),
        group_id=group_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        activity_metadata=metadata or {},
    )
    session.add(act)
    await session.flush()
    return act


async def list_activities(
    session: AsyncSession,
    *,
    group_id: UUID,
    action: str | None = None,
    member: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Activity]:
    stmt = select(Activity).where(Activity.group_id == group_id)
    if action:
        stmt = stmt.where(Activity.action == action)
    if member:
        stmt = stmt.where(Activity.user_id == member)
    stmt = stmt.order_by(Activity.created_at.desc()).limit(limit).offset(offset)
    res = await session.execute(stmt)
    return list(res.scalars().all())
