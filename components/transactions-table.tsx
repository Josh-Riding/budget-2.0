"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction, TransactionSplit, Bill } from "@/lib/types";
import { CategorySelector } from "@/components/category-selector";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Split, ArrowDown01, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionsTableProps {
  transactions: Transaction[];
  bills: Bill[];
}

export function TransactionsTable({ transactions: initialTransactions, bills }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const handleCategoryChange = (transactionId: string, category: string, incomeMonth?: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, category, incomeMonth: category === "income" ? incomeMonth : undefined }
          : t
      )
    );
  };

  const handleSplitCategoryChange = (transactionId: string, splitId: string, category: string, incomeMonth?: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          return {
            ...t,
            splits: t.splits.map((s) =>
              s.id === splitId
                ? { ...s, category, incomeMonth: category === "income" ? incomeMonth : undefined }
                : s
            ),
          };
        }
        return t;
      })
    );
  };

  const handleSplitTransaction = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId) {
          return {
            ...t,
            isSplit: true,
            splits: [
              {
                id: `${transactionId}-split-1`,
                amount: 0,
                date: t.date,
                category: undefined,
              },
              {
                id: `${transactionId}-split-2`,
                amount: 0,
                date: t.date,
                category: undefined,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  const handleUnsplitTransaction = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId) {
          return {
            ...t,
            isSplit: false,
            splits: undefined,
          };
        }
        return t;
      })
    );
  };

  const handleSplitAmountChange = (transactionId: string, splitId: string, amount: number) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          // Calculate total of other splits
          const otherSplitsTotal = t.splits.reduce((sum, s) => (s.id !== splitId ? sum + s.amount : sum), 0);
          // Cap the amount so total doesn't exceed transaction amount
          const maxAmount = t.amount - otherSplitsTotal;
          const validAmount = Math.min(Math.max(0, amount), maxAmount);
          
          return {
            ...t,
            splits: t.splits.map((s) => (s.id === splitId ? { ...s, amount: validAmount } : s)),
          };
        }
        return t;
      })
    );
  };

  const handleSplitDateChange = (transactionId: string, splitId: string, date: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          return {
            ...t,
            splits: t.splits.map((s) => (s.id === splitId ? { ...s, date } : s)),
          };
        }
        return t;
      })
    );
  };

  const addSplitRow = (transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplit: TransactionSplit = {
            id: `${transactionId}-split-${t.splits.length + 1}`,
            amount: 0,
            date: t.date,
            category: undefined,
          };
          return {
            ...t,
            splits: [...t.splits, newSplit],
          };
        }
        return t;
      })
    );
  };

  const removeSplitRow = (transactionId: string, splitId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplits = t.splits.filter((s) => s.id !== splitId);
          // If only one split left, unsplit the transaction
          if (newSplits.length < 2) {
            return {
              ...t,
              isSplit: false,
              splits: undefined,
            };
          }
          return {
            ...t,
            splits: newSplits,
          };
        }
        return t;
      })
    );
  };

  const fillRemainingBalance = (transactionId: string, splitId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const totalAllocated = t.splits.reduce((sum, s) => (s.id !== splitId ? sum + s.amount : sum), 0);
          const remaining = t.amount - totalAllocated;
          return {
            ...t,
            splits: t.splits.map((s) => (s.id === splitId ? { ...s, amount: Math.max(0, remaining) } : s)),
          };
        }
        return t;
      })
    );
  };

  const getRemainingBalance = (transaction: Transaction): number => {
    if (!transaction.splits) return transaction.amount;
    const totalAllocated = transaction.splits.reduce((sum, s) => sum + s.amount, 0);
    return transaction.amount - totalAllocated;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right w-[120px]">Amount</TableHead>
            <TableHead className="w-[250px]">Category</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <React.Fragment key={transaction.id}>
              <TableRow className={cn(transaction.isSplit && "border-b-0")}>
                <TableCell className="font-medium">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell className="text-right">
                  ${transaction.amount.toFixed(2)}
                  {transaction.isSplit && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Remaining: ${getRemainingBalance(transaction).toFixed(2)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {!transaction.isSplit && (
                    <CategorySelector
                      value={transaction.category}
                      incomeMonth={transaction.incomeMonth}
                      bills={bills}
                      onSelect={(category, incomeMonth) =>
                        handleCategoryChange(transaction.id, category, incomeMonth)
                      }
                    />
                  )}
                </TableCell>
                <TableCell>
                  {!transaction.isSplit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSplitTransaction(transaction.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Split className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsplitTransaction(transaction.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>

              {/* Split Rows */}
              {transaction.isSplit && transaction.splits && (
                <>
                  {transaction.splits.map((split, index) => (
                    <TableRow key={split.id} className="bg-muted/30 border-b-0">
                      <TableCell className="pl-12">
                        <Input
                          type="date"
                          value={split.date}
                          onChange={(e) => handleSplitDateChange(transaction.id, split.id, e.target.value)}
                          className="h-8 w-[140px] text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Split {index + 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={split.amount || ""}
                            onChange={(e) =>
                              handleSplitAmountChange(transaction.id, split.id, parseFloat(e.target.value) || 0)
                            }
                            className="h-8 w-24 text-right"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => fillRemainingBalance(transaction.id, split.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <ArrowDown01 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Use remaining amount</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategorySelector
                          value={split.category}
                          incomeMonth={split.incomeMonth}
                          bills={bills}
                          onSelect={(category, incomeMonth) =>
                            handleSplitCategoryChange(transaction.id, split.id, category, incomeMonth)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {transaction.splits && transaction.splits.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSplitRow(transaction.id, split.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="pl-12 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSplitRow(transaction.id)}
                        className="h-7 text-xs"
                      >
                        + Add Split
                      </Button>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
