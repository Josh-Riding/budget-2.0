import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, transactions } from "@/lib/db/schema";
import { getAppSetting } from "@/lib/db/queries";
import { fetchAccounts } from "@/lib/simplefin";

export async function POST() {
  const accessUrl = await getAppSetting("simplefin_access_url");
  if (!accessUrl) {
    return NextResponse.json({ error: "SimpleFin not connected" }, { status: 400 });
  }

  try {
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const data = await fetchAccounts(accessUrl, startDate);

    let accountCount = 0;
    let transactionCount = 0;

    for (const account of data.accounts) {
      // Upsert connection — update balance, preserve user settings
      const existing = await db
        .select({ id: connections.id })
        .from(connections)
        .where(eq(connections.id, account.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(connections)
          .set({
            name: account.name,
            currentBalance: account.balance,
            lastSyncedAt: new Date(),
          })
          .where(eq(connections.id, account.id));
      } else {
        await db.insert(connections).values({
          id: account.id,
          name: account.name,
          currentBalance: account.balance,
          isOnBudget: true,
          lastSyncedAt: new Date(),
        });
      }
      accountCount++;

      // Insert new transactions (skip duplicates)
      if (account.transactions) {
        for (const txn of account.transactions) {
          if (txn.pending) continue;

          const txnId = `${account.id}-${txn.id}`;
          const txnDate = new Date(txn.posted * 1000).toISOString().split("T")[0];

          try {
            await db.insert(transactions).values({
              id: txnId,
              connectionId: account.id,
              date: txnDate,
              name: txn.description,
              amount: txn.amount,
              categoryType: "uncategorized",
              isSplit: false,
            });
            transactionCount++;
          } catch {
            // Duplicate — already exists, skip
          }
        }
      }
    }

    return NextResponse.json({
      accounts: accountCount,
      transactions: transactionCount,
      errors: data.errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
