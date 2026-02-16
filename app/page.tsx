import { DashboardContent } from "@/components/dashboard-content";
import {
  getIncomeForMonth,
  getIncomeDetailsForMonth,
  getExpensesForMonth,
  getEverythingElseForMonth,
  getBillsForMonth,
  getSimpleFinConnections,
  getFundBalances,
  getFunds,
  getUncategorizedCount,
  getTransactionCountForMonth,
  isMonthSealed,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

interface DashboardProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const params = await searchParams;
  const month = params.month || `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;

  const [
    income,
    incomeDetails,
    expenses,
    everythingElseSpending,
    monthBills,
    allConnections,
    fundBalances,
    funds,
    uncategorizedCount,
    transactionCount,
    sealed,
  ] = await Promise.all([
    getIncomeForMonth(month),
    getIncomeDetailsForMonth(month),
    getExpensesForMonth(month),
    getEverythingElseForMonth(month),
    getBillsForMonth(month),
    getSimpleFinConnections(),
    getFundBalances(),
    getFunds(),
    getUncategorizedCount(month),
    getTransactionCountForMonth(month),
    isMonthSealed(month),
  ]);

  // Calculate bill stats
  const billsTotal = monthBills.length;
  // A bill is paid if it has a paidAmount (from transactions categorized to it)
  const billsPaid = monthBills.filter((b) => b.paidAmount && b.paidAmount > 0).length;
  const unpaidBillsTotal = monthBills
    .filter((b) => !b.paidAmount || b.paidAmount === 0)
    .reduce((s, b) => s + b.expectedAmount, 0);

  // Networth = sum of all connection balances
  const networth = allConnections.reduce((s, c) => s + c.currentBalance, 0);

  // Remaining cash = income - expenses - unpaid bills - $300 savings
  const remainingCash = income - expenses - unpaidBillsTotal - 300;

  // Total remaining = income minus all actual transactions for the month
  const totalRemainingCash = income - expenses;

  return (
    <DashboardContent
      month={month}
      income={income}
      billsPaid={billsPaid}
      billsTotal={billsTotal}
      networth={networth}
      fundBalances={fundBalances}
      funds={funds}
      uncategorizedCount={uncategorizedCount}
      isSealed={sealed}
      remainingCash={remainingCash}
      totalRemainingCash={totalRemainingCash}
      transactionCount={transactionCount}
      incomeDetails={incomeDetails}
      everythingElseSpending={everythingElseSpending}
      bills={monthBills}
    />
  );
}
