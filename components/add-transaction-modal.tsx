"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelector } from "@/components/category-selector";
import { Bill } from "@/lib/types";

interface AddTransactionModalProps {
  bills: Bill[];
  funds?: { id: string; name: string }[];
}

export function AddTransactionModal({ bills, funds = [] }: AddTransactionModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"withdrawal" | "deposit">("withdrawal");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [incomeMonth, setIncomeMonth] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setName("");
      setAmount("");
      setType("withdrawal");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory(undefined);
      setIncomeMonth(undefined);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !amount) return;

    setSubmitting(true);
    setError(null);
    const finalAmount = type === "withdrawal" ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: finalAmount,
          date,
          category,
          incomeMonth,
        }),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to save transaction. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="txn-name">Name</Label>
            <Input
              id="txn-name"
              placeholder="e.g. Grocery Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="txn-amount">Amount</Label>
              <Input
                id="txn-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "withdrawal" | "deposit")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="txn-date">Date</Label>
            <Input
              id="txn-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <CategorySelector
              value={category}
              incomeMonth={incomeMonth}
              bills={bills}
              funds={funds}
              isDeposit={type === "deposit"}
              allocationStartDate={date}
              onSelect={(cat, month) => {
                setCategory(cat);
                setIncomeMonth(month);
              }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        <Button onClick={handleSubmit} disabled={!name || !amount || submitting}>
          {submitting ? "Adding..." : "Add Transaction"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
