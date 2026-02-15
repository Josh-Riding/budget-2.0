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
  // February 2026 Bills (some unpaid — current month)
  // ═══════════════════════════════════════════
  await db.insert(schema.bills).values([
    { id: "feb-rent", name: "Rent", expectedAmount: "1200.00", month: "02/2026" },
    { id: "feb-internet", name: "Internet", expectedAmount: "80.00", month: "02/2026" },
    { id: "feb-electric", name: "Electricity", expectedAmount: "150.00", month: "02/2026" },
    { id: "feb-spotify", name: "Spotify", expectedAmount: "15.00", month: "02/2026" },
    { id: "feb-gym", name: "Gym", expectedAmount: "50.00", month: "02/2026" },
    { id: "feb-car-ins", name: "Car Insurance", expectedAmount: "180.00", month: "02/2026" },
  ]);

  // ═══════════════════════════════════════════
  // January 2026 Transactions — Chase Checking (on-budget, test month for sealing)
  // Deposits are positive, withdrawals are negative
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Income
    { id: "jan-ck-1", connectionId: "sf1", date: "2026-01-15", name: "Paycheck - Google", amount: "3500.00", categoryType: "income", incomeMonth: "01/2026" },
    { id: "jan-ck-2", connectionId: "sf1", date: "2026-01-31", name: "Paycheck - Google", amount: "3500.00", categoryType: "income", incomeMonth: "02/2026" },
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
  // February 2026 Transactions — Chase Checking (on-budget, mix of categorized/uncategorized)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Income
    { id: "feb-ck-1", connectionId: "sf1", date: "2026-02-14", name: "Paycheck - Google", amount: "3500.00", categoryType: "income", incomeMonth: "02/2026" },
    // Bills (paid)
    { id: "feb-ck-2", connectionId: "sf1", date: "2026-02-10", name: "Spotify Premium", amount: "-15.00", categoryType: "bill", categoryId: "feb-spotify" },
    { id: "feb-ck-3", connectionId: "sf1", date: "2026-02-03", name: "Planet Fitness", amount: "-50.00", categoryType: "bill", categoryId: "feb-gym" },
    // Everything else
    { id: "feb-ck-4", connectionId: "sf1", date: "2026-02-08", name: "Shell Gas Station", amount: "-45.00", categoryType: "everything_else" },
    // Uncategorized
    { id: "feb-ck-5", connectionId: "sf1", date: "2026-02-12", name: "Starbucks", amount: "-5.50", categoryType: "uncategorized" },
    { id: "feb-ck-6", connectionId: "sf1", date: "2026-02-11", name: "Uber Ride", amount: "-24.00", categoryType: "uncategorized" },
    { id: "feb-ck-7", connectionId: "sf1", date: "2026-02-09", name: "Walgreens", amount: "-12.75", categoryType: "uncategorized" },
    // Fund spending
    { id: "feb-ck-8", connectionId: "sf1", date: "2026-02-07", name: "Home Depot", amount: "-89.00", categoryType: "fund", categoryId: "fund-house" },
  ]);

  // ═══════════════════════════════════════════
  // February 2026 Transactions — Capital One Credit (on-budget)
  // ═══════════════════════════════════════════
  await db.insert(schema.transactions).values([
    // Bills (paid)
    { id: "feb-cc-1", connectionId: "sf3", date: "2026-02-01", name: "Property Mgmt - Rent", amount: "-1200.00", categoryType: "bill", categoryId: "feb-rent" },
    { id: "feb-cc-2", connectionId: "sf3", date: "2026-02-05", name: "Comcast", amount: "-80.00", categoryType: "bill", categoryId: "feb-internet" },
    // Uncategorized
    { id: "feb-cc-3", connectionId: "sf3", date: "2026-02-13", name: "Amazon", amount: "-34.00", categoryType: "uncategorized" },
    { id: "feb-cc-4", connectionId: "sf3", date: "2026-02-12", name: "Target", amount: "-124.50", categoryType: "uncategorized" },
    // Split transaction
    {
      id: "feb-cc-5",
      connectionId: "sf3",
      date: "2026-02-06",
      name: "Costco",
      amount: "-210.00",
      categoryType: "uncategorized",
      isSplit: true,
    },
  ]);

  // ═══════════════════════════════════════════
  // Split transaction detail for Costco
  // ═══════════════════════════════════════════
  await db.insert(schema.transactionSplits).values([
    { id: "feb-cc-5-split-1", transactionId: "feb-cc-5", amount: "-150.00", date: "2026-02-06", categoryType: "everything_else" },
    { id: "feb-cc-5-split-2", transactionId: "feb-cc-5", amount: "-60.00", date: "2026-02-06", categoryType: "fund", categoryId: "fund-madison" },
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
