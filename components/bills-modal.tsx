"use client";

import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
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

interface Bill {
  id: string;
  name: string;
  expectedAmount: number;
  paidAmount?: number;
  date?: string;
}

interface BillsModalProps {
  currentMonth: Date;
}

export function BillsModal({ currentMonth }: BillsModalProps) {
  const [bills, setBills] = useState<Bill[]>([
    { id: "1", name: "Rent", expectedAmount: 1200, paidAmount: 1200, date: "2024-02-01" },
    { id: "2", name: "Internet", expectedAmount: 80, paidAmount: 80, date: "2024-02-05" },
    { id: "3", name: "Electricity", expectedAmount: 150 }, // Unpaid
  ]);

  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");

  const handleAddBill = () => {
    if (!newBillName || !newBillAmount) return;

    const newBill: Bill = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBillName,
      expectedAmount: parseFloat(newBillAmount),
    };

    setBills([...bills, newBill]);
    setNewBillName("");
    setNewBillAmount("");
  };

  const handleDeleteBill = (id: string) => {
    setBills(bills.filter((bill) => bill.id !== id));
  };

  const handleUseLastMonth = () => {
    // Mock functionality for now - typically this would fetch from backend/context
    const lastMonthBills: Bill[] = [
      { id: "lm-1", name: "Rent", expectedAmount: 1200 },
      { id: "lm-2", name: "Internet", expectedAmount: 80 },
      { id: "lm-3", name: "Electricity", expectedAmount: 140 },
      { id: "lm-4", name: "Water", expectedAmount: 45 },
    ];
    setBills(lastMonthBills);
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-colors p-2 rounded-lg -m-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            Bills Expected
          </span>
          <span className="text-2xl font-bold text-slate-700 select-none">$1,200.00</span>
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
          <div className="rounded-md border">
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
                      <TableCell className="text-right">${bill.expectedAmount.toFixed(2)}</TableCell>
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
            <Copy className="mr-2 h-4 w-4" /> Use Last Month's Bills
          </Button>
          {/* Close is handled automatically by Dialog primitive, but we can add a close button if desired */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
