"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { format } from "date-fns";

interface BudgetSummaryModalProps {
  month: string;
  income: number;
  incomeDetails: { amount: number; date: string }[];
  billsTotal: number;
  billsPaid: number;
  bills: { name: string; expectedAmount: number; paidAmount?: number }[];
  everythingElseSpending: number;
  totalRemainingCash: number;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BudgetSummaryModal({
  month,
  income,
  incomeDetails,
  billsTotal,
  billsPaid,
  bills,
  everythingElseSpending,
  totalRemainingCash,
}: BudgetSummaryModalProps) {
  const [open, setOpen] = useState(false);

  const [mm, yyyy] = month.split("/");
  const monthDate = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
  const monthName = format(monthDate, "MMMM yyyy");

  const billsExpectedTotal = bills.reduce((s, b) => s + b.expectedAmount, 0);
  const billsPaidTotal = bills.reduce((s, b) => s + (b.paidAmount ?? 0), 0);

  // Format income source dates
  const incomeDates = incomeDetails.map((d) => format(new Date(d.date), "MMM d"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-slate-700"
        >
          <BookOpen className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{monthName} Budget Summary</DialogTitle>
        </DialogHeader>

        <div className="prose prose-sm prose-slate max-w-none space-y-4 mt-2">
          {/* Income */}
          <p className="leading-relaxed">
            <span className="font-semibold text-slate-900">{monthName}</span> has a total income of{" "}
            <span className="font-bold text-emerald-600">${fmt(income)}</span>
            {incomeDates.length > 0 && (
              <>
                {". "}Paychecks received on{" "}
                {incomeDates.map((d, i) => (
                  <span key={i}>
                    {i > 0 && i === incomeDates.length - 1 ? " and " : i > 0 ? ", " : ""}
                    <span className="font-medium">{d}</span>
                  </span>
                ))}
                .
              </>
            )}
          </p>

          {/* Bills */}
          <div className="border-l-2 border-slate-200 pl-4 space-y-2">
            <p className="leading-relaxed">
              There is a total bills expected amount of{" "}
              <span className="font-bold text-slate-900">${fmt(billsExpectedTotal)}</span>.
              {" "}So far,{" "}
              <span className="font-bold text-slate-900">{billsPaid}</span> bill{billsPaid !== 1 ? "s have" : " has"} been
              paid out of <span className="font-bold text-slate-900">{billsTotal}</span> bill{billsTotal !== 1 ? "s" : ""} expected
              {" "}&mdash; a total of{" "}
              <span className="font-bold text-slate-900">${fmt(billsPaidTotal)}</span> out of{" "}
              <span className="font-bold text-slate-900">${fmt(billsExpectedTotal)}</span>.
            </p>
          </div>

          {/* Everything Else */}
          <p className="leading-relaxed">
            All other spending has equated to{" "}
            <span className="font-bold text-slate-900">${fmt(everythingElseSpending)}</span>.
          </p>

          {/* Savings & Remaining */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="leading-relaxed">
              With the consistent savings goal of trying to hit{" "}
              <span className="font-medium">$300.00</span> for saving toward travel and housing, a total of{" "}
              <span className={`font-bold text-lg ${totalRemainingCash >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                ${fmt(totalRemainingCash)}
              </span>{" "}
              remains after all bills paid and spending as of today.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
