"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction, TransactionSplit, Bill } from "@/lib/types";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { CategorySelector } from "@/components/category-selector";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Split, ArrowDown01, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionsTableProps {
  transactions: Transaction[];
  bills: Bill[];
  funds?: { id: string; name: string }[];
  connectionNames?: Record<string, string>;
  initialMonth?: string;
}

function getCategoryDisplayName(
  category: string,
  bills: Bill[],
  funds: { id: string; name: string }[]
): string {
  // Handle fund categories
  if (category.startsWith("fund:")) {
    const fundId = category.slice(5);
    const fund = funds.find((f) => f.id === fundId);
    return fund ? `${fund.name} Spending` : category;
  }

  // Handle bill categories - look up bill name
  const bill = bills.find((b) => b.id === category);
  if (bill) return bill.name;

  // Handle standard categories
  const categoryMap: { [key: string]: string } = {
    income: "Income",
    everything_else: "Everything Else",
    ignore: "Ignore",
    uncategorized: "Uncategorized",
  };

  return categoryMap[category] || category;
}

export function TransactionsTable({
  transactions: initialTransactions,
  bills,
  funds = [],
  connectionNames = {},
  initialMonth = "All Months",
}: TransactionsTableProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filterMonth, setFilterMonth] = useState<string>("All Months");
  const [filterCategory, setFilterCategory] = useState<string>("All Categories");
  const [filterType, setFilterType] = useState<string>("All");
  const [collapsedSplitRows, setCollapsedSplitRows] = useState<Set<string>>(
    () => new Set(initialTransactions.filter((t) => t.isSplit).map((t) => t.id))
  );
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Extract distinct months and categories from transactions
  const distinctMonths = useMemo(() => {
    const months = new Set<string>();
    initialTransactions.forEach((t) => {
      const monthStr = format(new Date(t.date), "MM/yyyy");
      months.add(monthStr);
      if (t.splits) {
        t.splits.forEach((s) => {
          const splitMonth = format(new Date(s.date), "MM/yyyy");
          months.add(splitMonth);
        });
      }
    });
    return Array.from(months).sort().reverse();
  }, [initialTransactions]);

  const distinctCategories = useMemo(() => {
    const categories = new Set<string>();
    initialTransactions.forEach((t) => {
      if (t.category) categories.add(t.category);
      if (t.splits) {
        t.splits.forEach((s) => {
          if (s.category) categories.add(s.category);
        });
      }
    });
    return Array.from(categories)
      .sort((a, b) => {
        const nameA = getCategoryDisplayName(a, bills, funds);
        const nameB = getCategoryDisplayName(b, bills, funds);
        return nameA.localeCompare(nameB);
      });
  }, [initialTransactions, bills, funds]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tMonth = format(new Date(t.date), "MM/yyyy");
      const monthMatch =
        filterMonth === "All Months" || tMonth === filterMonth;

      // Check if transaction or any split matches category filter
      let categoryMatch = filterCategory === "All Categories";
      if (!categoryMatch) {
        if (t.category === filterCategory) categoryMatch = true;
        if (t.splits) {
          categoryMatch =
            categoryMatch ||
            t.splits.some((s) => s.category === filterCategory);
        }
      }

      // Check type filter (based on amount sign)
      let typeMatch = filterType === "All";
      if (!typeMatch) {
        if (filterType === "Deposits") {
          typeMatch = t.amount >= 0;
        } else if (filterType === "Withdrawals") {
          typeMatch = t.amount < 0;
        }
      }

      return monthMatch && categoryMatch && typeMatch;
    });
  }, [transactions, filterMonth, filterCategory, filterType]);

  const persistSplits = useCallback(
    (transactionId: string, splits: TransactionSplit[]) => {
      const existing = debounceTimers.current.get(transactionId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        debounceTimers.current.delete(transactionId);
        await fetch(`/api/transactions/${transactionId}/split`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            splits: splits.map((s) => ({
              id: s.id,
              label: s.label,
              amount: s.amount,
              date: s.date,
              category: s.category,
              incomeMonth: s.incomeMonth,
            })),
          }),
        });
      }, 500);

      debounceTimers.current.set(transactionId, timer);
    },
    []
  );

  const handleCategoryChange = async (transactionId: string, category: string, incomeMonth?: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, category, incomeMonth: category === "income" ? incomeMonth : undefined }
          : t
      )
    );
    await fetch(`/api/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, incomeMonth }),
    });
    router.refresh();
  };

  const handleSplitCategoryChange = (transactionId: string, splitId: string, category: string, incomeMonth?: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplits = t.splits.map((s) =>
            s.id === splitId
              ? { ...s, category, incomeMonth: category === "income" ? incomeMonth : undefined }
              : s
          );
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const handleSplitTransaction = async (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    setCollapsedSplitRows((prev) => {
      const next = new Set(prev);
      next.delete(transactionId);
      return next;
    });

    const newSplits: TransactionSplit[] = [
      { id: `${transactionId}-split-1`, label: "Split 1", amount: 0, date: transaction.date },
      { id: `${transactionId}-split-2`, label: "Split 2", amount: 0, date: transaction.date },
    ];

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, isSplit: true, splits: newSplits } : t
      )
    );

    await fetch(`/api/transactions/${transactionId}/split`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        splits: newSplits.map((s) => ({
          id: s.id,
          label: s.label,
          amount: s.amount,
          date: s.date,
        })),
      }),
    });
  };

  const handleUnsplitTransaction = async (transactionId: string) => {
    setCollapsedSplitRows((prev) => {
      const next = new Set(prev);
      next.delete(transactionId);
      return next;
    });
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, isSplit: false, splits: undefined, category: "uncategorized" } : t
      )
    );

    await fetch(`/api/transactions/${transactionId}/split`, {
      method: "DELETE",
    });
    router.refresh();
  };

  const handleSplitAmountChange = (transactionId: string, splitId: string, amount: number) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const absTotal = Math.abs(t.amount);
          const otherSplitsTotal = t.splits.reduce((sum, s) => (s.id !== splitId ? sum + Math.abs(s.amount) : sum), 0);
          const maxAmount = absTotal - otherSplitsTotal;
          const validAmount = Math.min(Math.max(0, amount), Math.max(0, maxAmount));

          const newSplits = t.splits.map((s) => (s.id === splitId ? { ...s, amount: validAmount } : s));
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const handleSplitDateChange = (transactionId: string, splitId: string, date: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplits = t.splits.map((s) => (s.id === splitId ? { ...s, date } : s));
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const handleSplitLabelChange = (transactionId: string, splitId: string, label: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplits = t.splits.map((s) => (s.id === splitId ? { ...s, label } : s));
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const addSplitRow = (transactionId: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplit: TransactionSplit = {
            id: `${transactionId}-split-${t.splits.length + 1}`,
            label: `Split ${t.splits.length + 1}`,
            amount: 0,
            date: t.date,
            category: undefined,
          };
          const newSplits = [...t.splits, newSplit];
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const removeSplitRow = (transactionId: string, splitId: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const newSplits = t.splits.filter((s) => s.id !== splitId);
          if (newSplits.length < 2) {
            setCollapsedSplitRows((prev) => {
              const next = new Set(prev);
              next.delete(transactionId);
              return next;
            });
            // Unsplit via API
            fetch(`/api/transactions/${transactionId}/split`, { method: "DELETE" }).then(() =>
              router.refresh()
            );
            return { ...t, isSplit: false, splits: undefined, category: "uncategorized" };
          }
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const fillRemainingBalance = (transactionId: string, splitId: string) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => {
        if (t.id === transactionId && t.splits) {
          const absTotal = Math.abs(t.amount);
          const totalAllocated = t.splits.reduce((sum, s) => (s.id !== splitId ? sum + Math.abs(s.amount) : sum), 0);
          const remaining = absTotal - totalAllocated;
          const newSplits = t.splits.map((s) => (s.id === splitId ? { ...s, amount: Math.max(0, remaining) } : s));
          persistSplits(transactionId, newSplits);
          return { ...t, splits: newSplits };
        }
        return t;
      });
      return updated;
    });
  };

  const toggleSplitRows = (transactionId: string) => {
    setCollapsedSplitRows((prev) => {
      const next = new Set(prev);
      if (next.has(transactionId)) next.delete(transactionId);
      else next.add(transactionId);
      return next;
    });
  };

  const getRemainingBalance = (transaction: Transaction): number => {
    if (!transaction.splits) return Math.abs(transaction.amount);
    const absTotal = Math.abs(transaction.amount);
    const totalAllocated = transaction.splits.reduce((sum, s) => sum + Math.abs(s.amount), 0);
    return absTotal - totalAllocated;
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 sm:gap-4 items-end">
        <div className="flex-1 min-w-[100px]">
          <label className="text-sm font-medium mb-2 block">Month</label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Months">All Months</SelectItem>
              {distinctMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[100px]">
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              {distinctCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {getCategoryDisplayName(category, bills, funds)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[100px]">
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Deposits">Deposits</SelectItem>
              <SelectItem value="Withdrawals">Withdrawals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="self-end">
          <AddTransactionModal bills={bills} funds={funds} />
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-2">
        {filteredTransactions.map((transaction) => {
          const isSplitCollapsed = collapsedSplitRows.has(transaction.id);
          const splitCount = transaction.splits?.length ?? 0;
          const isDeposit = transaction.amount >= 0;

          return (
            <div key={transaction.id} className={cn("border rounded-lg p-3 space-y-2", transaction.isSplit && isSplitCollapsed && "bg-muted/20")}>
              {/* Row 1: Date + Amount */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </span>
                <span className={cn("text-sm font-semibold", isDeposit ? "text-emerald-600" : "text-slate-900")}>
                  {isDeposit ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>

              {/* Row 2: Name + bank */}
              <div>
                <div className="text-sm font-medium truncate" title={transaction.name}>{transaction.name}</div>
                {transaction.connectionId && connectionNames[transaction.connectionId] && (
                  <div className="text-xs text-muted-foreground">{connectionNames[transaction.connectionId]}</div>
                )}
              </div>

              {/* Row 3: Category + actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {!transaction.isSplit ? (
                    <CategorySelector
                      value={transaction.category}
                      incomeMonth={transaction.incomeMonth}
                      bills={bills}
                      funds={funds}
                      isDeposit={isDeposit}
                      allocationStartDate={transaction.date}
                      onSelect={(category, incomeMonth) =>
                        handleCategoryChange(transaction.id, category, incomeMonth)
                      }
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {splitCount} split{splitCount !== 1 ? "s" : ""}
                      {transaction.isSplit && (
                        <span className="ml-1">
                          (${getRemainingBalance(transaction).toFixed(2)} remaining)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!transaction.isSplit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSplitTransaction(transaction.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Split className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSplitRows(transaction.id)}
                        className="h-7 w-7 p-0"
                      >
                        {isSplitCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsplitTransaction(transaction.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Split details (expanded) */}
              {transaction.isSplit && transaction.splits && !isSplitCollapsed && (
                <div className="border-t pt-2 space-y-3">
                  {transaction.splits.map((split, index) => (
                    <div key={split.id} className="bg-muted/30 rounded-md p-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={split.label ?? ""}
                          placeholder={`Split ${index + 1}`}
                          onChange={(e) =>
                            handleSplitLabelChange(transaction.id, split.id, e.target.value)
                          }
                          className="h-7 text-xs flex-1"
                        />
                        {transaction.splits && transaction.splits.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSplitRow(transaction.id, split.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={split.date}
                          onChange={(e) => handleSplitDateChange(transaction.id, split.id, e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={split.amount || ""}
                            onChange={(e) =>
                              handleSplitAmountChange(transaction.id, split.id, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 w-20 text-xs text-right"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fillRemainingBalance(transaction.id, split.id)}
                            className="h-7 w-7 p-0"
                          >
                            <ArrowDown01 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CategorySelector
                        value={split.category}
                        incomeMonth={split.incomeMonth}
                        bills={bills}
                        funds={funds}
                        allocationStartDate={split.date}
                        onSelect={(category, incomeMonth) =>
                          handleSplitCategoryChange(transaction.id, split.id, category, incomeMonth)
                        }
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSplitRow(transaction.id)}
                    className="h-7 text-xs w-full"
                  >
                    + Add Split
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right w-[100px]">Deposit</TableHead>
              <TableHead className="text-right w-[100px]">Withdrawal</TableHead>
              <TableHead className="w-[250px]">Category</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => {
              const isSplitCollapsed = collapsedSplitRows.has(transaction.id);
              const splitCount = transaction.splits?.length ?? 0;
              const splitSummary = transaction.splits
                ?.map((s, index) => s.label?.trim() || `Split ${index + 1}`)
                .join(" | ");

              return (
              <React.Fragment key={transaction.id}>
                <TableRow className={cn(transaction.isSplit && !isSplitCollapsed && "border-b-0", transaction.isSplit && isSplitCollapsed && "bg-muted/20")}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={transaction.name}>{transaction.name}</div>
                    {transaction.connectionId && connectionNames[transaction.connectionId] && (
                      <div className="text-xs text-muted-foreground">{connectionNames[transaction.connectionId]}</div>
                    )}
                    {transaction.isSplit && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {splitCount} split {splitCount === 1 ? "part" : "parts"}
                        {isSplitCollapsed && splitSummary ? `: ${splitSummary}` : ""}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.amount >= 0
                      ? `$${transaction.amount.toFixed(2)}`
                      : ""}
                    {transaction.isSplit && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Remaining: ${getRemainingBalance(transaction).toFixed(2)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.amount < 0
                      ? `$${Math.abs(transaction.amount).toFixed(2)}`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {!transaction.isSplit && (
                      <CategorySelector
                        value={transaction.category}
                        incomeMonth={transaction.incomeMonth}
                        bills={bills}
                        funds={funds}
                        isDeposit={transaction.amount >= 0}
                        allocationStartDate={transaction.date}
                        onSelect={(category, incomeMonth) =>
                          handleCategoryChange(transaction.id, category, incomeMonth)
                        }
                      />
                    )}
                    {transaction.isSplit && (
                      <span className="text-xs text-muted-foreground">
                        {transaction.splits?.some((s) => !s.category || s.category === "uncategorized")
                          ? "Not categorized"
                          : "Split transaction"}
                      </span>
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
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSplitRows(transaction.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isSplitCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSplitCollapsed ? "Expand split details" : "Collapse split details"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnsplitTransaction(transaction.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel split</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </TableCell>
                </TableRow>

              {/* Split Rows */}
              {transaction.isSplit && transaction.splits && !isSplitCollapsed && (
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
                      <TableCell>
                        <Input
                          type="text"
                          value={split.label ?? ""}
                          placeholder={`Split ${index + 1}`}
                          onChange={(e) =>
                            handleSplitLabelChange(transaction.id, split.id, e.target.value)
                          }
                          className="h-8 text-sm"
                        />
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
                      <TableCell></TableCell>
                      <TableCell>
                        <CategorySelector
                          value={split.category}
                          incomeMonth={split.incomeMonth}
                          bills={bills}
                          funds={funds}
                          allocationStartDate={split.date}
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
                    <TableCell colSpan={6} className="pl-12 py-2">
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
          );
        })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
