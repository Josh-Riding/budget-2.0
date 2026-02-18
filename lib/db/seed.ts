import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(schema.fundSettings);
  await db.delete(schema.fundAllocations);
  await db.delete(schema.sealedMonths);
  await db.delete(schema.transactionSplits);
  await db.delete(schema.transactions);
  await db.delete(schema.bills);
  await db.delete(schema.funds);
  await db.delete(schema.connections);

  // ═══════════════════════════════════════════
  // Connections (bank accounts)
  // ═══════════════════════════════════════════
  await db.insert(schema.connections).values([
    {
      id: "sf1",
      name: "Chase Checking",
      currentBalance: "4210.00",
      isOnBudget: true,
      accountType: "checking",
    },
    {
      id: "sf2",
      name: "Ally Savings",
      currentBalance: "12500.00",
      isOnBudget: false,
      accountType: "savings",
    },
    {
      id: "sf3",
      name: "Capital One Credit",
      currentBalance: "-1250.00",
      isOnBudget: true,
      accountType: "credit",
    },
    {
      id: "sf4",
      name: "Vanguard Brokerage",
      currentBalance: "45000.00",
      isOnBudget: false,
      accountType: "investment",
    },
  ]);

  // ═══════════════════════════════════════════
  // Funds
  // ═══════════════════════════════════════════
  await db.insert(schema.funds).values([
    { id: "fund-madison", name: "Madison" },
    { id: "fund-josh", name: "Josh" },
    { id: "fund-house", name: "House" },
    { id: "fund-travel", name: "Travel" },
  ]);

  // ═══════════════════════════════════════════
  // Fund Settings (display names, positions, overrides)
  // ═══════════════════════════════════════════
  await db.insert(schema.fundSettings).values([
    {
      id: "settings-fund-madison",
      fundId: "fund-madison",
      displayName: "Madison",
      position: "left",
      isVisible: true,
    },
    {
      id: "settings-fund-josh",
      fundId: "fund-josh",
      displayName: "Josh",
      position: "left",
      isVisible: true,
    },
    {
      id: "settings-fund-house",
      fundId: "fund-house",
      displayName: "House",
      position: "right",
      isVisible: true,
    },
    {
      id: "settings-fund-travel",
      fundId: "fund-travel",
      displayName: "Travel",
      position: "right",
      isVisible: true,
    },
  ]);

  // ═══════════════════════════════════════════
  // Fund Allocations (money deposited into funds from sealed months)
  // ═══════════════════════════════════════════
  await db.insert(schema.fundAllocations).values([
    // December 2025 sealed — allocated savings
    { id: "alloc-dec-madison", fundId: "fund-madison", month: "12/2025", amount: "200.00" },
    { id: "alloc-dec-josh", fundId: "fund-josh", month: "12/2025", amount: "200.00" },
    { id: "alloc-dec-house", fundId: "fund-house", month: "12/2025", amount: "500.00" },
    { id: "alloc-dec-travel", fundId: "fund-travel", month: "12/2025", amount: "300.00" },
  ]);

  // ═══════════════════════════════════════════
  // Sealed Months
  // ═══════════════════════════════════════════
  // Keep January 2026 unsealed so sealing flow can be tested end-to-end.

  // ═══════════════════════════════════════════
  // January 2026 Bills (all paid — sealed month)
  // ═══════════════════════════════════════════
  await db.insert(schema.bills).values([
    { id: "jan-rent", name: "Rent", expectedAmount: "1200.00", month: "01/2026" },
    { id: "jan-internet", name: "Internet", expectedAmount: "80.00", month: "01/2026" },
    { id: "jan-electric", name: "Electricity", expectedAmount: "140.00", month: "01/2026" },
    { id: "jan-spotify", name: "Spotify", expectedAmount: "15.00", month: "01/2026" },
    { id: "jan-gym", name: "Gym", expectedAmount: "50.00", month: "01/2026" },
    { id: "jan-car-ins", name: "Car Insurance", expectedAmount: "180.00", month: "01/2026" },
  ]);

  // ═══════════════════════════════════════════
  // February 2026 Bills — all paid, total $1,500
  // Income $3,500 - Bills $1,500 - Everything Else $1,450 - $300 savings = ~$250 remaining
  // ═══════════════════════════════════════════
  await db.insert(schema.bills).values([
    { id: "feb-rent",     name: "Rent",          expectedAmount: "1200.00", month: "02/2026" },
    { id: "feb-internet", name: "Internet",       expectedAmount: "80.00",  month: "02/2026" },
    { id: "feb-electric", name: "Electricity",    expectedAmount: "150.00", month: "02/2026" },
    { id: "feb-spotify",  name: "Spotify",        expectedAmount: "15.00",  month: "02/2026" },
    { id: "feb-gym",      name: "Gym",            expectedAmount: "55.00",  month: "02/2026" },
  ]);

  // ═══════════════════════════════════════════
  // January 2026 Transactions — Chase Checking (on-budget, test month for sealing)
  // Deposits are positive, withdrawals are negative
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Income
    { id: "jan-ck-1", connectionId: "sf1", date: "2026-01-15", name: "Paycheck - Google", amount: "3500.00", categoryType: "income", incomeMonth: "01/2026" },
    { id: "jan-ck-2", connectionId: "sf1", date: "2026-01-31", name: "Paycheck - Google", amount: "3500.00", categoryType: "income", incomeMonth: "01/2026" },
    // Bills
    { id: "jan-ck-3", connectionId: "sf1", date: "2026-01-10", name: "Spotify Premium", amount: "-15.00", categoryType: "bill", categoryId: "jan-spotify" },
    { id: "jan-ck-4", connectionId: "sf1", date: "2026-01-03", name: "Planet Fitness", amount: "-50.00", categoryType: "bill", categoryId: "jan-gym" },
    { id: "jan-ck-5", connectionId: "sf1", date: "2026-01-18", name: "State Farm", amount: "-180.00", categoryType: "bill", categoryId: "jan-car-ins" },
    // Everything else
    { id: "jan-ck-6", connectionId: "sf1", date: "2026-01-08", name: "Kroger Groceries", amount: "-85.00", categoryType: "everything_else" },
    { id: "jan-ck-7", connectionId: "sf1", date: "2026-01-20", name: "Shell Gas Station", amount: "-42.00", categoryType: "everything_else" },
    { id: "jan-ck-8", connectionId: "sf1", date: "2026-01-25", name: "Amazon", amount: "-28.50", categoryType: "everything_else" },
    // Intentionally uncategorized so seal is initially blocked for Jan
    { id: "jan-ck-11", connectionId: "sf1", date: "2026-01-19", name: "Starbucks", amount: "-9.25", categoryType: "uncategorized" },
    // Fund spending
    { id: "jan-ck-9", connectionId: "sf1", date: "2026-01-14", name: "Target - Kids Clothes", amount: "-65.00", categoryType: "fund", categoryId: "fund-madison" },
    { id: "jan-ck-10", connectionId: "sf1", date: "2026-01-22", name: "GameStop", amount: "-45.00", categoryType: "fund", categoryId: "fund-josh" },
  ]);

  // ═══════════════════════════════════════════
  // January 2026 Transactions — Capital One Credit (on-budget, test month for sealing)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Bills
    { id: "jan-cc-1", connectionId: "sf3", date: "2026-01-01", name: "Property Mgmt - Rent", amount: "-1200.00", categoryType: "bill", categoryId: "jan-rent" },
    { id: "jan-cc-2", connectionId: "sf3", date: "2026-01-05", name: "Comcast", amount: "-80.00", categoryType: "bill", categoryId: "jan-internet" },
    { id: "jan-cc-3", connectionId: "sf3", date: "2026-01-12", name: "Duke Energy", amount: "-140.00", categoryType: "bill", categoryId: "jan-electric" },
    // Everything else
    { id: "jan-cc-4", connectionId: "sf3", date: "2026-01-18", name: "Target", amount: "-65.00", categoryType: "everything_else" },
    { id: "jan-cc-5", connectionId: "sf3", date: "2026-01-22", name: "Uber Eats", amount: "-32.00", categoryType: "everything_else" },
    // Intentionally uncategorized so seal is initially blocked for Jan
    { id: "jan-cc-7", connectionId: "sf3", date: "2026-01-24", name: "CVS", amount: "-21.40", categoryType: "uncategorized" },
    // Fund spending
    { id: "jan-cc-6", connectionId: "sf3", date: "2026-01-27", name: "Airbnb Deposit", amount: "-150.00", categoryType: "fund", categoryId: "fund-travel" },
  ]);

  // ═══════════════════════════════════════════
  // February 2026 Transactions — Chase Checking (on-budget)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Income: $3,500
    { id: "feb-ck-1", connectionId: "sf1", date: "2026-02-14", name: "Paycheck", amount: "3500.00", categoryType: "income", incomeMonth: "02/2026" },
    // Bills (paid): $15 + $55 = $70
    { id: "feb-ck-2", connectionId: "sf1", date: "2026-02-10", name: "Spotify Premium",  amount: "-15.00",  categoryType: "bill", categoryId: "feb-spotify" },
    { id: "feb-ck-3", connectionId: "sf1", date: "2026-02-03", name: "Planet Fitness",   amount: "-55.00",  categoryType: "bill", categoryId: "feb-gym" },
    // Everything else: $45 + $120 + $85 + $60 + $35 + $55 + $200 + $110 + $90 + $75 + $55 + $200 + $120 + $75 + $125 = $1,450 total across both accounts
    { id: "feb-ck-4", connectionId: "sf1", date: "2026-02-04", name: "Shell Gas Station",  amount: "-45.00",  categoryType: "everything_else" },
    { id: "feb-ck-5", connectionId: "sf1", date: "2026-02-06", name: "Kroger Groceries",   amount: "-120.00", categoryType: "everything_else" },
    { id: "feb-ck-6", connectionId: "sf1", date: "2026-02-09", name: "Walmart",             amount: "-85.00",  categoryType: "everything_else" },
    { id: "feb-ck-7", connectionId: "sf1", date: "2026-02-11", name: "Amazon",              amount: "-60.00",  categoryType: "everything_else" },
    { id: "feb-ck-8", connectionId: "sf1", date: "2026-02-13", name: "Starbucks",           amount: "-35.00",  categoryType: "everything_else" },
    { id: "feb-ck-9", connectionId: "sf1", date: "2026-02-15", name: "Chipotle",            amount: "-55.00",  categoryType: "everything_else" },
    { id: "feb-ck-10", connectionId: "sf1", date: "2026-02-17", name: "Target",             amount: "-200.00", categoryType: "everything_else" },
    // Fund spending
    { id: "feb-ck-11", connectionId: "sf1", date: "2026-02-07", name: "Home Depot",         amount: "-89.00",  categoryType: "fund", categoryId: "fund-house" },
  ]);

  // ═══════════════════════════════════════════
  // February 2026 Transactions — Capital One Credit (on-budget)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Bills (paid): $1,200 + $80 + $150 = $1,430
    { id: "feb-cc-1", connectionId: "sf3", date: "2026-02-01", name: "Property Mgmt - Rent", amount: "-1200.00", categoryType: "bill", categoryId: "feb-rent" },
    { id: "feb-cc-2", connectionId: "sf3", date: "2026-02-05", name: "Comcast",              amount: "-80.00",   categoryType: "bill", categoryId: "feb-internet" },
    { id: "feb-cc-3", connectionId: "sf3", date: "2026-02-12", name: "Duke Energy",          amount: "-150.00",  categoryType: "bill", categoryId: "feb-electric" },
    // Everything else (remaining to hit $1,450 total): $110 + $90 + $75 + $55 + $200 + $125 - ($45+$120+$85+$60+$35+$55+$200) = need $655 here
    { id: "feb-cc-4", connectionId: "sf3", date: "2026-02-08", name: "Uber Eats",            amount: "-110.00",  categoryType: "everything_else" },
    { id: "feb-cc-5", connectionId: "sf3", date: "2026-02-10", name: "Costco Groceries",     amount: "-90.00",   categoryType: "everything_else" },
    { id: "feb-cc-6", connectionId: "sf3", date: "2026-02-14", name: "Netflix + Hulu",       amount: "-75.00",   categoryType: "everything_else" },
    { id: "feb-cc-7", connectionId: "sf3", date: "2026-02-16", name: "CVS Pharmacy",         amount: "-55.00",   categoryType: "everything_else" },
    { id: "feb-cc-8", connectionId: "sf3", date: "2026-02-17", name: "Restaurants",          amount: "-250.00",  categoryType: "everything_else" },
    { id: "feb-cc-9", connectionId: "sf3", date: "2026-02-15", name: "Clothing",             amount: "-125.00",  categoryType: "everything_else" },
    // Split transaction
    {
      id: "feb-cc-10",
      connectionId: "sf3",
      date: "2026-02-06",
      name: "Costco Run",
      amount: "-180.00",
      categoryType: null,
      isSplit: true,
    },
  ]);

  // ═══════════════════════════════════════════
  // Split transaction detail for Costco Run
  // everything_else: $120, fund: $60
  // ═══════════════════════════════════════════
  await db.insert(schema.transactionSplits).values([
    { id: "feb-cc-10-split-1", transactionId: "feb-cc-10", amount: "-120.00", date: "2026-02-06", categoryType: "everything_else" },
    { id: "feb-cc-10-split-2", transactionId: "feb-cc-10", amount: "-60.00",  date: "2026-02-06", categoryType: "fund", categoryId: "fund-madison" },
  ]);

  // ═══════════════════════════════════════════
  // Ally Savings Transactions (off-budget)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    { id: "ally-1", connectionId: "sf2", date: "2026-02-01", name: "Interest Payment", amount: "45.23" },
    { id: "ally-2", connectionId: "sf2", date: "2026-01-15", name: "Transfer from Checking", amount: "1000.00" },
    { id: "ally-3", connectionId: "sf2", date: "2026-01-01", name: "Interest Payment", amount: "42.15" },
    { id: "ally-4", connectionId: "sf2", date: "2026-02-10", name: "Transfer from Checking", amount: "500.00" },
  ]);

  // ═══════════════════════════════════════════
  // Vanguard Transactions (off-budget)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    { id: "vang-1", connectionId: "sf4", date: "2026-02-01", name: "Dividend - VTSAX", amount: "125.50" },
    { id: "vang-2", connectionId: "sf4", date: "2026-01-15", name: "Auto Investment", amount: "-500.00" },
    { id: "vang-3", connectionId: "sf4", date: "2026-01-01", name: "Dividend - VTSAX", amount: "118.75" },
    { id: "vang-4", connectionId: "sf4", date: "2026-02-03", name: "Buy VXUS", amount: "-250.00" },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
