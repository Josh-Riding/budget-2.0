"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface Fund {
  id: string;
  name: string;
}

interface SealMonthModalProps {
  month: string;
  totalSaved: number;
  funds: Fund[];
}

function getDefaultAllocations(funds: Fund[], totalSaved: number): Record<string, number> {
  const alloc: Record<string, number> = {};

  // Initialize all to 0
  for (const f of funds) {
    alloc[f.id] = 0;
  }

  let remaining = totalSaved;

  // House gets up to $200 (priority 1)
  const house = funds.find((f) => f.name === "House");
  if (house && remaining > 0) {
    alloc[house.id] = Math.min(200, remaining);
    remaining -= alloc[house.id];
  }

  // Travel gets up to $100 (priority 2)
  const travel = funds.find((f) => f.name === "Travel");
  if (travel && remaining > 0) {
    alloc[travel.id] = Math.min(100, remaining);
    remaining -= alloc[travel.id];
  }

  // Remaining split equally between Madison and Josh
  const madison = funds.find((f) => f.name === "Madison");
  const josh = funds.find((f) => f.name === "Josh");
  if (remaining > 0 && madison && josh) {
    const half = Math.floor(remaining * 100) / 200; // Round down to cents
    alloc[madison.id] = half;
    alloc[josh.id] = remaining - half;
  } else if (remaining > 0 && madison) {
    alloc[madison.id] = remaining;
  } else if (remaining > 0 && josh) {
    alloc[josh.id] = remaining;
  }

  return alloc;
}

export function SealMonthModal({ month, totalSaved, funds }: SealMonthModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>(() =>
    getDefaultAllocations(funds, totalSaved)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0);
  const overBudget = totalAllocated > totalSaved + 0.01; // small epsilon for floating point

  const handleAllocationChange = (fundId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setAllocations((prev) => ({ ...prev, [fundId]: num }));
  };

  const handleSeal = async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/seal-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        allocations: funds.map((f) => ({
          fundId: f.id,
          amount: allocations[f.id] ?? 0,
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to seal month");
      setLoading(false);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  const [mm, yyyy] = month.split("/");
  const monthName = new Date(parseInt(yyyy), parseInt(mm) - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-semibold shadow-sm transition-all"
        >
          <Lock className="h-4 w-4 mr-2" />
          Seal {monthName}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Seal {monthName}</DialogTitle>
          <DialogDescription>
            Allocate ${totalSaved.toFixed(2)} saved this month across your funds. You can adjust the
            amounts before finalizing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {funds.map((fund) => (
            <div key={fund.id} className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium w-24">{fund.name}</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={allocations[fund.id] || ""}
                  onChange={(e) => handleAllocationChange(fund.id, e.target.value)}
                  className="w-28 text-right"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm font-semibold">Total Allocated</span>
            <span
              className={`text-sm font-bold ${
                overBudget ? "text-red-600" : "text-slate-900"
              }`}
            >
              ${totalAllocated.toFixed(2)} / ${totalSaved.toFixed(2)}
            </span>
          </div>

          {overBudget && (
            <p className="text-sm text-red-600">
              Total exceeds available savings by ${(totalAllocated - totalSaved).toFixed(2)}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSeal} disabled={loading || overBudget}>
            {loading ? "Sealing..." : "Finalize Seal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
