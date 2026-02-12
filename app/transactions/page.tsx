import { TransactionsTable } from "@/components/transactions-table";
import { getTransactions, getBills } from "@/lib/mock-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const bills = await getBills();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <TransactionsTable transactions={transactions} bills={bills} />
          </div>
        </div>
      </div>
    </div>
  );
}
