/**
 * Pure helpers for fund-allocation persistence, extracted from the seal-month
 * route so the filtering logic can be unit tested without a database.
 */

export interface AllocationInput {
  fundId: string;
  amount: number;
}

export interface FundAllocationInsert {
  fundId: string;
  month: string;
  amount: string;
}

/**
 * Build the fund_allocations rows to insert when sealing a month, dropping any
 * zero-amount allocations. Amounts are stringified to match the numeric column.
 *
 * Returning an empty array for an all-zero (e.g. negative/broke) month is
 * intentional: the caller must guard against inserting an empty array, which
 * Drizzle rejects with "values() must be called with at least one value".
 */
export function buildFundAllocationInserts(
  month: string,
  allocations: AllocationInput[]
): FundAllocationInsert[] {
  return allocations
    .filter((a) => a.amount !== 0)
    .map((a) => ({
      fundId: a.fundId,
      month,
      amount: String(a.amount),
    }));
}
