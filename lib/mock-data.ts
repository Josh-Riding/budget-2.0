import { Bill, Transaction } from "./types";

export const MOCK_BILLS: Bill[] = [
  { id: "1", name: "Rent", expectedAmount: 1200, paidAmount: 1200, date: "2024-02-01" },
  { id: "2", name: "Internet", expectedAmount: 80, paidAmount: 80, date: "2024-02-05" },
  { id: "3", name: "Electricity", expectedAmount: 150 }, // Unpaid
  { id: "4", name: "Spotify", expectedAmount: 15, paidAmount: 15, date: "2024-02-10" },
  { id: "5", name: "Gym", expectedAmount: 50 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2024-02-12", name: "Starbucks", amount: 5.50, category: "uncategorized" },
  { id: "t2", date: "2024-02-11", name: "Uber Ride", amount: 24.00, category: "uncategorized" },
  { id: "t3", date: "2024-02-10", name: "Spotify Premium", amount: 15.00, category: "4" }, // Matches Bill ID 4
  { id: "t4", date: "2024-02-08", name: "Shell Gas Station", amount: 45.00, category: "everything_else" },
  { id: "t5", date: "2024-02-05", name: "Comcast", amount: 80.00, category: "2" }, // Matches Bill ID 2
  { id: "t6", date: "2024-02-01", name: "Property Mgmt", amount: 1200.00, category: "1" }, // Matches Bill ID 1
  { id: "t7", date: "2024-02-15", name: "Paycheck from Google", amount: 3500.00, category: "income", incomeMonth: "02/2024" },
  { id: "t8", date: "2024-02-14", name: "Target", amount: 124.50, category: "uncategorized" },
  { id: "t9", date: "2024-02-13", name: "Amazon", amount: 34.00, category: "uncategorized" },
];

export async function getTransactions(): Promise<Transaction[]> {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_TRANSACTIONS]), 500);
  });
}

export async function getBills(): Promise<Bill[]> {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_BILLS]), 500);
    });
  }

// SimpleFin Connections
import { SimpleFinConnection, AvailableSimpleFinConnection } from "./types";

export const MOCK_SIMPLEFIN_CONNECTIONS: SimpleFinConnection[] = [
  { id: "sf1", name: "Chase Checking", currentBalance: 4210.00, isOnBudget: true, accountType: "checking" },
  { id: "sf2", name: "Ally Savings", currentBalance: 12500.00, isOnBudget: false, accountType: "savings" },
  { id: "sf3", name: "Capital One Credit", currentBalance: -1250.00, isOnBudget: true, accountType: "credit" },
  { id: "sf4", name: "Vanguard Brokerage", currentBalance: 45000.00, isOnBudget: false, accountType: "investment" },
];

export const MOCK_AVAILABLE_SIMPLEFIN_CONNECTIONS: AvailableSimpleFinConnection[] = [
  { id: "av1", name: "Wells Fargo Checking", accountType: "checking" },
  { id: "av2", name: "Discover Credit Card", accountType: "credit" },
  { id: "av3", name: "Fidelity 401k", accountType: "retirement" },
];

// Connection-specific transactions
export const MOCK_CONNECTION_TRANSACTIONS: Record<string, Transaction[]> = {
  sf1: [ // Chase Checking (on-budget)
    { id: "ct1", date: "2024-02-12", name: "Starbucks", amount: 5.50, category: "uncategorized", connectionId: "sf1" },
    { id: "ct2", date: "2024-02-11", name: "Uber Ride", amount: 24.00, category: "uncategorized", connectionId: "sf1" },
    { id: "ct3", date: "2024-02-10", name: "Spotify Premium", amount: 15.00, category: "4", connectionId: "sf1" },
    { id: "ct4", date: "2024-02-08", name: "Shell Gas Station", amount: 45.00, category: "everything_else", connectionId: "sf1" },
    { id: "ct5", date: "2024-02-15", name: "Paycheck from Google", amount: 3500.00, category: "income", incomeMonth: "02/2024", connectionId: "sf1" },
  ],
  sf2: [ // Ally Savings (off-budget)
    { id: "ct6", date: "2024-02-01", name: "Interest Payment", amount: 45.23, connectionId: "sf2" },
    { id: "ct7", date: "2024-01-15", name: "Transfer from Checking", amount: 1000.00, connectionId: "sf2" },
    { id: "ct8", date: "2024-01-01", name: "Interest Payment", amount: 42.15, connectionId: "sf2" },
  ],
  sf3: [ // Capital One Credit (on-budget)
    { id: "ct9", date: "2024-02-14", name: "Target", amount: 124.50, category: "uncategorized", connectionId: "sf3" },
    { id: "ct10", date: "2024-02-13", name: "Amazon", amount: 34.00, category: "uncategorized", connectionId: "sf3" },
    { id: "ct11", date: "2024-02-05", name: "Comcast", amount: 80.00, category: "2", connectionId: "sf3" },
    { id: "ct12", date: "2024-02-01", name: "Property Mgmt", amount: 1200.00, category: "1", connectionId: "sf3" },
  ],
  sf4: [ // Vanguard Brokerage (off-budget)
    { id: "ct13", date: "2024-02-01", name: "Dividend - VTSAX", amount: 125.50, connectionId: "sf4" },
    { id: "ct14", date: "2024-01-15", name: "Auto Investment", amount: -500.00, connectionId: "sf4" },
    { id: "ct15", date: "2024-01-01", name: "Dividend - VTSAX", amount: 118.75, connectionId: "sf4" },
  ],
};

export async function getSimpleFinConnections(): Promise<SimpleFinConnection[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_SIMPLEFIN_CONNECTIONS]), 500);
  });
}

export async function getAvailableSimpleFinConnections(): Promise<AvailableSimpleFinConnection[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_AVAILABLE_SIMPLEFIN_CONNECTIONS]), 500);
  });
}

export async function getConnectionTransactions(connectionId: string): Promise<Transaction[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...(MOCK_CONNECTION_TRANSACTIONS[connectionId] || [])]), 500);
  });
}
