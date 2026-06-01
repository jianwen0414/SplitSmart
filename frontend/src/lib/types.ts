export type SplitType = "equal" | "exact" | "percentage" | "itemized";

export type Category =
  | "food"
  | "transport"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "groceries"
  | "general";

export const CATEGORIES: Category[] = [
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "shopping",
  "utilities",
  "groceries",
  "general",
];

export const CURRENCIES = [
  "MYR",
  "USD",
  "SGD",
  "THB",
  "IDR",
  "PHP",
  "EUR",
  "GBP",
  "JPY",
  "KRW",
  "AUD",
  "CNY",
];

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

export interface ItemConsumerInput {
  user_id: string;
  share_weight?: number;
}

export interface ItemInput {
  description: string;
  unit_amount: number;
  quantity: number;
  consumers: ItemConsumerInput[];
}

export interface ItemConsumerRead {
  user_id: string;
  share_weight: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  unit_amount: string;
  quantity: number;
  position: number;
  consumers: ItemConsumerRead[];
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: string;
  currency: string;
  converted_amount: string | null;
  exchange_rate: string | null;
  description: string;
  category: Category;
  split_type: SplitType;
  tax_amount: string;
  service_charge_amount: string;
  receipt_url: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  splits: ExpenseSplit[];
  items: ExpenseItem[];
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
  items?: ItemInput[];
  tax_amount?: number;
  service_charge_amount?: number;
  receipt_url?: string | null;
}

export type ActivityAction =
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "settlement_created"
  | "member_joined"
  | "member_left"
  | "group_updated";

export interface Activity {
  id: string;
  group_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsCategory {
  category: string;
  amount: string;
  percentage: number;
}
export interface AnalyticsDate {
  date: string;
  amount: string;
}
export interface AnalyticsMember {
  user_id: string;
  display_name: string;
  total_paid: string;
  total_share: string;
  net: string;
}

export interface AnalyticsResponse {
  total_spending: string;
  currency: string;
  expense_count: number;
  by_category: AnalyticsCategory[];
  by_date: AnalyticsDate[];
  by_member: AnalyticsMember[];
}

export interface ReceiptLineItem {
  description: string | null;
  amount: string | null;
  quantity: number | null;
}
export interface ReceiptData {
  merchant: string | null;
  total_amount: string | null;
  currency: string | null;
  date: string | null;
  category: Category | null;
  line_items: ReceiptLineItem[];
}
export interface ReceiptScanResponse {
  success: boolean;
  confidence?: "high" | "medium" | "low";
  data?: ReceiptData;
  receipt_url?: string;
  error?: string;
  raw_text?: string;
}

export interface ParsedExpenseData {
  description: string | null;
  amount: string | null;
  currency: string | null;
  category: Category | null;
  date: string | null;
  paid_by_name: string | null;
  paid_by_user_id: string | null;
  split_type: string | null;
  split_among: string[];
  split_among_user_ids: string[];
  unmatched_names: string[];
}
export interface ParseExpenseResponse {
  success: boolean;
  confidence?: "high" | "medium" | "low";
  data?: ParsedExpenseData;
  error?: string;
}

export interface ExpenseInitial {
  amount?: number;
  currency?: string;
  description?: string;
  category?: Category;
  date?: string;
  paid_by?: string;
  splitAmongUserIds?: string[];
  receipt_url?: string;
  split_type?: SplitType;
  items?: ItemInput[];
  tax_amount?: number;
  service_charge_amount?: number;
}
