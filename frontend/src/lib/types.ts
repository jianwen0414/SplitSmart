export type SplitType = "equal" | "exact" | "percentage";

export type Category =
  | "food" | "transport" | "accommodation" | "entertainment"
  | "shopping" | "utilities" | "groceries" | "general";

export const CATEGORIES: Category[] = [
  "food", "transport", "accommodation", "entertainment",
  "shopping", "utilities", "groceries", "general",
];

export const CURRENCIES = ["MYR", "USD", "SGD", "THB", "IDR", "PHP", "EUR", "GBP", "JPY", "KRW", "AUD", "CNY"];

export interface Group {
  id: string;
  name: string;
  description: string | null;
  base_currency: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  user_id: string;
  display_name: string;
  nickname: string | null;
  role: string;
  joined_at: string;
}

export interface GroupDetail extends Group {
  members: Member[];
}

export interface ExpenseSplit {
  user_id: string;
  amount: string;
  percentage: string | null;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: string;
  currency: string;
  description: string;
  category: Category;
  split_type: SplitType;
  receipt_url: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  splits: ExpenseSplit[];
}

export interface MemberBalance {
  user_id: string;
  display_name: string;
  total_paid: string;
  total_owed: string;
  settlements_paid: string;
  settlements_received: string;
  net_balance: string;
}

export interface SettlementPlanItem {
  from: { user_id: string; display_name: string };
  to: { user_id: string; display_name: string };
  amount: string;
  currency: string;
}

export interface BalanceResponse {
  group_id: string;
  balances: MemberBalance[];
  settlement_plan: SettlementPlanItem[];
  is_settled: boolean;
}

export interface SplitInputPayload {
  user_id: string;
  amount?: number;
  percentage?: number;
}

export interface ExpenseCreatePayload {
  amount: number;
  currency: string;
  description: string;
  category: Category;
  date?: string;
  paid_by: string;
  split_type: SplitType;
  splits: SplitInputPayload[];
}
