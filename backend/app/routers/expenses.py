from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseRead, SplitRead
from app.services import expense_service, group_service
from app.utils.auth import get_current_user_id

router = APIRouter(prefix="/groups/{group_id}/expenses", tags=["expenses"])


async def _assert_membership(db: AsyncSession, group_id: UUID, user_id: UUID) -> None:
    await group_service.get_group(db, group_id, user_id)


async def _to_read(db: AsyncSession, expense) -> ExpenseRead:
    splits = await expense_service.get_expense_splits(db, expense.id)
    return ExpenseRead(
        id=expense.id, group_id=expense.group_id, paid_by=expense.paid_by,
        amount=expense.amount, currency=expense.currency,
        converted_amount=expense.converted_amount, exchange_rate=expense.exchange_rate,
        description=expense.description,
        category=expense.category, split_type=expense.split_type, receipt_url=expense.receipt_url,
        date=expense.date, created_at=expense.created_at, updated_at=expense.updated_at,
        splits=[SplitRead(user_id=s.user_id, amount=s.amount, percentage=s.percentage) for s in splits],
    )


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create(group_id: UUID, payload: ExpenseCreate, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await _assert_membership(db, group_id, user_id)
    expense = await expense_service.create_expense(db, group_id, payload, user_id)
    return await _to_read(db, expense)


@router.get("", response_model=list[ExpenseRead])
async def list_(group_id: UUID, limit: int = 50, offset: int = 0, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await _assert_membership(db, group_id, user_id)
    expenses = await expense_service.list_expenses(db, group_id, limit=limit, offset=offset)
    return [await _to_read(db, e) for e in expenses]


@router.get("/{expense_id}", response_model=ExpenseRead)
async def get_one(group_id: UUID, expense_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await _assert_membership(db, group_id, user_id)
    expense = await expense_service.get_expense(db, expense_id)
    if expense is None or expense.group_id != group_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "expense not found"})
    return await _to_read(db, expense)


@router.put("/{expense_id}", response_model=ExpenseRead)
async def update(group_id: UUID, expense_id: UUID, payload: ExpenseUpdate, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await _assert_membership(db, group_id, user_id)
    expense = await expense_service.update_expense(db, expense_id, payload, user_id)
    return await _to_read(db, expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(group_id: UUID, expense_id: UUID, user_id: UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await _assert_membership(db, group_id, user_id)
    await expense_service.delete_expense(db, expense_id, user_id)
    return None
