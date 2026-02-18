"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MonthSelector } from "@/components/ui/month-selector";
import { BillsModal } from "@/components/bills-modal";
import { SealMonthModal } from "@/components/seal-month-modal";
import { FundsSettingsModal } from "@/components/funds-settings-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lock, Settings } from "lucide-react";

interface Fund {
  id: string;
  name: string;
}

interface FundBalance {
  fundId: string;
  name: string;
  balance: number;
  position: string;
}

interface DashboardContentProps {
  month: string; // "MM/YYYY"
  income: number;
  billsPaid: number;
  billsTotal: number;
  networth: number;
  fundBalances: FundBalance[];
  funds: Fund[];
  uncategorizedCount: number;
  isSealed: boolean;
  remainingCash: number;
  totalRemainingCash: number;
  transactionCount: number;
  incomeDetails: { amount: number; date: string }[];
  everythingElseSpending: number;
  bills: { id: string; name: string; expectedAmount: number; paidAmount?: number; date?: string }[];
}

export function DashboardContent({
  month,
  income,
  billsPaid,
  billsTotal,
  networth,
  fundBalances,
  funds,
  uncategorizedCount,
  isSealed,
  remainingCash,
  totalRemainingCash,
  transactionCount,
  incomeDetails,
  everythingElseSpending,
  bills,
}: DashboardContentProps) {
  const router = useRouter();
  const [fundsModalOpen, setFundsModalOpen] = useState(false);

  // Parse month for MonthSelector
  const [mm, yyyy] = month.split("/");
  const currentDate = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);

  const handleMonthChange = (date: Date) => {
    const newMonth = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    router.push(`/?month=${newMonth}`);
  };

  // Check if month is in the past (for showing seal button)
  const monthEnd = new Date(parseInt(yyyy), parseInt(mm), 1);
  const isMonthPast = monthEnd <= new Date();

  // Split funds by position from settings
  const leftFunds = fundBalances.filter((f) => f.position === "left");
  const rightFunds = fundBalances.filter((f) => f.position === "right");

  // Total saved this month for seal modal
  const totalSaved = Math.max(0, remainingCash);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Month Selector Header */}
        <MonthSelector currentDate={currentDate} onMonthChange={handleMonthChange} />

        {/* Top Row Grid */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7 items-start">
          {/* Left Card */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm order-2 lg:order-1">
            <CardContent className="space-y-4">
              {leftFunds.length > 0 ? (
                leftFunds.map((fund, i) => (
                  <div key={fund.fundId}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-700">
                        {fund.name}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        ${fund.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No funds on left side
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center Card: Main Financials */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-3 border-slate-200 shadow-md order-1 lg:order-2">
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-6 relative">
              {/* Top-right icons */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-slate-700"
                  onClick={() => setFundsModalOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col items-center space-y-8 w-full">
                <Link
                  href={`/transactions?month=${month}&filter=income`}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Income
                  </span>
                  <div className="text-5xl font-extrabold text-emerald-600 tracking-tight">
                    ${income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </Link>

                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Remaining Cash
                  </span>
                  <div className="text-4xl font-bold text-slate-800 tracking-tight">
                    ${remainingCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Total Remaining
                  </span>
                  <div className="text-2xl font-bold text-slate-600 tracking-tight">
                    ${totalRemainingCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <Link
                href={`/breakdown?month=${month}`}
                className="w-full"
              >
                <Button variant="outline" className="w-full text-xs">
                  View Budget Breakdown
                </Button>
              </Link>

              <div className="grid grid-cols-2 gap-8 w-full border-t pt-6 bg-slate-50/50 rounded-lg p-4">
                <div className="flex flex-col items-center gap-1">
                  <BillsModal
                    currentMonth={currentDate}
                    bills={bills}
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    {billsPaid}/{billsTotal} Bills Paid
                  </span>
                </div>
                <Link
                  href="/networth"
                  className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Networth
                  </span>
                  <span className="text-2xl font-bold text-slate-700">
                    ${networth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </Link>
              </div>

            </CardContent>
          </Card>

          {/* Right Card */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-sm order-3">
            <CardContent className="space-y-4">
              {rightFunds.length > 0 ? (
                rightFunds.map((fund, i) => (
                  <div key={fund.fundId}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-700">
                        {fund.name}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        ${fund.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No funds on right side
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex justify-center z-50">
          {isSealed ? (
            <Link href={`/transactions?month=${month}`}>
              <Badge variant="secondary" className="text-base px-6 py-2 gap-2 cursor-pointer hover:bg-slate-200 transition-colors">
                <Lock className="h-4 w-4" />
                {new Date(parseInt(yyyy), parseInt(mm) - 1).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}{" "}
                Sealed
              </Badge>
            </Link>
          ) : uncategorizedCount > 0 ? (
            <Link href={`/transactions?month=${month}`}>
              <Button
                variant="outline"
                size="lg"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold shadow-sm transition-all"
              >
                {uncategorizedCount} transaction{uncategorizedCount !== 1 ? "s" : ""} not categorized
                yet
              </Button>
            </Link>
          ) : isMonthPast && transactionCount > 0 ? (
            <SealMonthModal month={month} totalSaved={totalSaved} funds={funds} />
          ) : (
            <Link href={`/transactions?month=${month}`}>
              <Button
                variant="outline"
                size="lg"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-semibold shadow-sm transition-all"
              >
                All updated, go to transactions!
              </Button>
            </Link>
          )}
        </div>

        {/* Spacer for bottom fixed bar */}
        <div className="h-20" />
      </div>

      {/* Funds Settings Modal */}
      <FundsSettingsModal open={fundsModalOpen} onOpenChange={setFundsModalOpen} />
    </div>
  );
}
