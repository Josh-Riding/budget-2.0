import {
  getConnection,
  getConnectionTransactions,
  getBills,
  getFunds,
} from "@/lib/db/queries";
import { TransactionsTable } from "@/components/transactions-table";
import { OffBudgetTransactionsTable } from "@/components/off-budget-transactions-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = await params;
  const [connection, transactionRows, bills, funds] = await Promise.all([
    getConnection(connectionId),
    getConnectionTransactions(connectionId),
    getBills(),
    getFunds(),
  ]);

  if (!connection) {
    notFound();
  }

  const transactions = transactionRows;

  const isNegative = connection.currentBalance < 0;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/networth">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-slate-900">{connection.displayName || connection.name}</h1>
            <p className={`text-lg mt-1 font-semibold ${isNegative ? 'text-red-600' : 'text-slate-600'}`}>
              ${Math.abs(connection.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {isNegative && <span className="ml-1 text-sm">CR</span>}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Transactions</h2>
              <div className="flex items-center gap-2">
                {connection.accountType && (
                  <Badge variant="outline" className="capitalize">
                    {connection.accountType}
                  </Badge>
                )}
                <Badge variant={connection.isOnBudget ? "default" : "secondary"}>
                  {connection.isOnBudget ? "On Budget" : "Off Budget"}
                </Badge>
              </div>
            </div>
            {connection.isOnBudget ? (
              <TransactionsTable
                transactions={transactions}
                bills={bills}
                funds={funds}
                connectionNames={{ [connection.id]: connection.displayName || connection.name }}
              />
            ) : (
              <OffBudgetTransactionsTable transactions={transactions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
