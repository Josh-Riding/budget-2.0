"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Edit2, Check, X } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bill } from "@/lib/types";

interface BillsModalProps {
  currentMonth: Date;
  bills: Bill[];
}

export function BillsModal({ currentMonth, bills: initialBills }: BillsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setBills(initialBills);
      setEditingId(null);
      setNewBillName("");
      setNewBillAmount("");
    }
  };

  const handleAddBill = async () => {
    if (!newBillName || !newBillAmount) return;

    const month = `${String(currentMonth.getMonth() + 1).padStart(2, "0")}/${currentMonth.getFullYear()}`;
    const response = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newBillName,
        expectedAmount: parseFloat(newBillAmount),
        month,
      }),
    });

    if (response.ok) {
      const newBill = await response.json();
      setBills([...bills, newBill]);
      setNewBillName("");
      setNewBillAmount("");
      router.refresh();
    }
  };

  const handleDeleteBill = async (id: string) => {
    const response = await fetch("/api/bills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setBills(bills.filter((bill) => bill.id !== id));
      router.refresh();
    }
  };

  const handleUpdateExpectedAmount = async (id: string, newAmount: number) => {
    const response = await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedAmount: newAmount }),
    });

    if (response.ok) {
      setBills(
        bills.map((bill) =>
          bill.id === id ? { ...bill, expectedAmount: newAmount } : bill
        )
      );
      setEditingId(null);
      router.refresh();
    }
  };

  const handleUseLastMonth = async () => {
    const month = `${String(currentMonth.getMonth() + 1).padStart(2, "0")}/${currentMonth.getFullYear()}`;
    const response = await fetch("/api/bills/copy-last-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentMonth: month }),
    });

    if (response.ok) {
      const refreshedBills = await response.json();
      setBills(refreshedBills);
      router.refresh();
    }
  };

  const currentBillsExpectedTotal = bills.reduce((sum, b) => sum + b.expectedAmount, 0);

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-lg -m-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            Bills Expected
          </span>
          <span className="text-2xl font-bold text-slate-700 select-none">${currentBillsExpectedTotal.toFixed(2)}</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Expected Bills for {monthName}</DialogTitle>
          <DialogDescription>
            Manage your expected bills for this month. Add new bills or copy from last month.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md border max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Name</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No bills added for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.name}</TableCell>
                      <TableCell className="text-right">
                        {editingId === bill.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="h-8 w-24 text-right"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateExpectedAmount(
                                  bill.id,
                                  parseFloat(editAmount) || bill.expectedAmount
                                )
                              }
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <span>${bill.expectedAmount.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingId(bill.id);
                                setEditAmount(bill.expectedAmount.toString());
                              }}
                            >
                              <Edit2 className="h-4 w-4 text-gray-400" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {bill.paidAmount ? `$${bill.paidAmount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {bill.date ? new Date(bill.date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeleteBill(bill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="grid gap-4 py-4 border-t">
          <div className="grid grid-cols-4 items-end gap-4">
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="name">New Bill Name</Label>
              <Input
                id="name"
                placeholder="e.g. Netflix"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
              />
            </div>
            <div className="grid gap-2 col-span-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newBillAmount}
                onChange={(e) => setNewBillAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleAddBill} className="col-span-1 rounded-full" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleUseLastMonth}>
            <Copy className="mr-2 h-4 w-4" /> Use Last Month&apos;s Bills
          </Button>
          {/* Close is handled automatically by Dialog primitive, but we can add a close button if desired */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
