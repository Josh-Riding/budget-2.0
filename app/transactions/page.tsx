import { TransactionsTable } from "@/components/transactions-table";
import {
  getAllOnBudgetTransactions,
  getOnBudgetTransactionsForMonth,
  getIncomeTransactionsForMonth,
  getBills,
  getBillsForMonth,
  getFunds,
  getSimpleFinConnections,
} from "@/lib/db/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: Promise<{ month?: string; filter?: string }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const month = params.month;
  const filter = params.filter;

  const [transactions, bills, funds, allConnections] = await Promise.all([
    filter === "income" && month
      ? getIncomeTransactionsForMonth(month)
      : month
        ? getOnBudgetTransactionsForMonth(month)
        : getAllOnBudgetTransactions(),
    month ? getBillsForMonth(month) : getBills(),
    getFunds(),
    getSimpleFinConnections(),
  ]);

  const connectionNames: Record<string, string> = {};
  for (const c of allConnections) {
    connectionNames[c.id] = c.displayName || c.name;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <TransactionsTable
              transactions={transactions}
              bills={bills}
              funds={funds}
              connectionNames={connectionNames}
              initialMonth={month}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
