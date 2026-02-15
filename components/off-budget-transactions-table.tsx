"use client";

import { Transaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface OffBudgetTransactionsTableProps {
  transactions: Transaction[];
}

export function OffBudgetTransactionsTable({ transactions }: OffBudgetTransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right w-[100px]">Deposit</TableHead>
            <TableHead className="text-right w-[100px]">Withdrawal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell className="text-right font-medium">
                  {transaction.amount >= 0 ? `$${transaction.amount.toFixed(2)}` : ""}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {transaction.amount < 0 ? `$${Math.abs(transaction.amount).toFixed(2)}` : ""}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
