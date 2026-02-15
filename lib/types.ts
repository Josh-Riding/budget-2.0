export interface Bill {
  id: string;
  name: string;
  expectedAmount: number;
  paidAmount?: number;
  date?: string;
}

export interface TransactionSplit {
  id: string;
  label?: string;
  amount: number;
  date: string;
  category?: string;
  incomeMonth?: string;
}

export interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  category?: string; // Can be a Bill ID, "Income", or "Everything Else"
  incomeMonth?: string; // If category is "Income", this stores "MM/YYYY"
  isSplit?: boolean; // Whether this transaction has been split
  splits?: TransactionSplit[]; // Array of split sub-transactions
  connectionId?: string; // Links transaction to SimpleFin connection
}

export type CategoryOption = 
  | { type: 'bill'; id: string; name: string }
  | { type: 'income' }
  | { type: 'uncategorized' }
  | { type: 'everything_else' }
  | { type: 'ignore' };

export interface SimpleFinConnection {
  id: string;
  name: string; // e.g., "Chase Checking", "Savings Account"
  currentBalance: number;
  isOnBudget: boolean; // Determines if transactions are categorized
  accountType?: string; // e.g., "checking", "savings", "credit"
}