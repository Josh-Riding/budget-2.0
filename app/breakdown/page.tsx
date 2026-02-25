import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getIncomeDetailsForMonth,
  getBillsForMonth,
  getSpendingTransactionsForMonth,
  getFundBalances,
  getFundTransactionsForMonth,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

interface BreakdownPageProps {
  searchParams: Promise<{ month?: string }>;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function BreakdownPage({ searchParams }: BreakdownPageProps) {
  const params = await searchParams;
  const month =
    params.month ||
    `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;

  const [incomeDetails, bills, spendingTxns, fundBalances, fundTxns] = await Promise.all([
    getIncomeDetailsForMonth(month),
    getBillsForMonth(month),
    getSpendingTransactionsForMonth(month),
    getFundBalances(),
    getFundTransactionsForMonth(month),
  ]);

  const savings = 300;

  const totalIncome = incomeDetails.reduce((s, r) => s + r.amount, 0);
  const totalBillsExpected = bills.reduce((s, b) => s + b.expectedAmount, 0);
  const totalBillsPaid = bills.reduce((s, b) => s + (b.paidAmount ?? 0), 0);
  const totalSpending = spendingTxns.reduce((s, t) => s + t.amount, 0);

  const totalRemaining = totalIncome - totalBillsExpected - totalSpending;
  const remainingCash = totalRemaining - savings;

  // Group fund transactions by fundId
  const fundTxnMap = new Map<string, typeof fundTxns>();
  for (const t of fundTxns) {
    if (!fundTxnMap.has(t.fundId)) fundTxnMap.set(t.fundId, []);
    fundTxnMap.get(t.fundId)!.push(t);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/?month=${month}`}>
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Budget Breakdown</h1>
        <span className="text-sm text-slate-500 ml-auto">{month}</span>
      </div>

      {/* Income */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Income</h2>
        <div className="bg-white rounded-lg divide-y divide-slate-100 shadow-sm">
          {incomeDetails.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No income recorded</div>
          )}
          {incomeDetails.map((r, i) => (
            <div key={i} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-slate-500">{r.date}</span>
              <span className="font-semibold text-emerald-600">${fmt(r.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 text-sm font-bold bg-slate-50 rounded-b-lg">
            <span>Total Income</span>
            <span className="text-emerald-600">${fmt(totalIncome)}</span>
          </div>
        </div>
      </section>

      {/* Bills */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Bills — {bills.filter((b) => b.paidAmount && b.paidAmount > 0).length}/{bills.length} Paid
        </h2>
        <div className="bg-white rounded-lg divide-y divide-slate-100 shadow-sm">
          {bills.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No bills for this month</div>
          )}
          {bills.map((bill) => {
            const paid = bill.paidAmount && bill.paidAmount > 0;
            return (
              <div key={bill.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                  <span className={`truncate ${paid ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {bill.name}
                  </span>
                  {bill.date && (
                    <span className="text-xs text-slate-400 shrink-0">paid {bill.date}</span>
                  )}
                </div>
                <span className={`shrink-0 ${paid ? "text-slate-400" : "text-slate-700"}`}>
                  ${fmt(paid ? bill.paidAmount! : bill.expectedAmount)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between px-4 py-3 text-sm bg-slate-50">
            <span className="text-slate-500 text-xs">Expected total</span>
            <span className="font-semibold text-slate-700">${fmt(totalBillsExpected)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm bg-slate-50 rounded-b-lg">
            <span className="text-slate-500 text-xs">Paid so far</span>
            <span className="font-semibold text-slate-600">${fmt(totalBillsPaid)}</span>
          </div>
        </div>
      </section>

      {/* Everything Else Spending */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Other Spending</h2>
        <div className="bg-white rounded-lg divide-y divide-slate-100 shadow-sm">
          {spendingTxns.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">No other spending</div>
          )}
          {spendingTxns.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm gap-3">
              <span className="text-slate-700 truncate flex-1 min-w-0">{t.name}</span>
              <span className="text-xs text-slate-400 shrink-0">{t.date}</span>
              <span className="text-slate-700 shrink-0">${fmt(t.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 text-sm font-semibold bg-slate-50 rounded-b-lg">
            <span>Total Other Spending</span>
            <span className="text-slate-700">${fmt(totalSpending)}</span>
          </div>
        </div>
      </section>

      {/* Funds */}
      {fundBalances.filter((f) => f.balance !== 0 || fundTxnMap.has(f.fundId)).length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Funds</h2>
          <div className="space-y-3">
            {fundBalances.map((f) => {
              const txns = fundTxnMap.get(f.fundId) ?? [];
              const monthActivity = txns.reduce((s, t) => s + t.amount, 0);
              const startingBalance = f.balance - monthActivity;
              return (
                <div key={f.fundId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{f.name}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Start: <span className="font-medium text-slate-600">${fmt(startingBalance)}</span></span>
                      <span>Now: <span className={`font-semibold ${f.balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>${fmt(f.balance)}</span></span>
                    </div>
                  </div>
                  {txns.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">No activity this month</div>
                  ) : (
                    txns.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-50 gap-3">
                        <span className="text-slate-700 truncate flex-1 min-w-0">{t.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{t.date}</span>
                        <span className={`shrink-0 font-medium ${t.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {t.amount >= 0 ? "+" : ""}${fmt(Math.abs(t.amount))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Summary */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Summary</h2>
        <div className="bg-white rounded-lg divide-y divide-slate-100 shadow-sm">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-500">Income</span>
            <span className="text-emerald-600 font-semibold">${fmt(totalIncome)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-500">Bills (expected)</span>
            <span className="text-red-500">− ${fmt(totalBillsExpected)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-500">Other Spending</span>
            <span className="text-red-500">− ${fmt(totalSpending)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm font-semibold">
            <span className="text-slate-600">Total Remaining</span>
            <span className={totalRemaining >= 0 ? "text-slate-700" : "text-red-500"}>
              ${fmt(totalRemaining)}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-500">Savings</span>
            <span className="text-red-500">− ${fmt(savings)}</span>
          </div>
          <div className="flex justify-between px-4 py-4 font-bold text-base bg-slate-50 rounded-b-lg">
            <span>Remaining Cash</span>
            <span className={remainingCash >= 0 ? "text-emerald-600" : "text-red-500"}>
              ${fmt(remainingCash)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
