import { buildFundAllocationInserts } from "@/lib/allocations";

describe("buildFundAllocationInserts", () => {
  it("returns an empty array when every allocation is zero (negative/broke month)", () => {
    // This is the seal-month crash: an empty array must NOT be passed to
    // Drizzle's .values(). The route guards on rows.length, so [] means
    // "insert nothing" rather than throw.
    const rows = buildFundAllocationInserts("06/2026", [
      { fundId: "fund-house", amount: 0 },
      { fundId: "fund-travel", amount: 0 },
      { fundId: "fund-josh", amount: 0 },
    ]);
    expect(rows).toEqual([]);
  });

  it("keeps only non-zero allocations and stringifies amounts", () => {
    const rows = buildFundAllocationInserts("06/2026", [
      { fundId: "fund-house", amount: 200 },
      { fundId: "fund-travel", amount: 0 },
      { fundId: "fund-josh", amount: 55.5 },
    ]);
    expect(rows).toEqual([
      { fundId: "fund-house", month: "06/2026", amount: "200" },
      { fundId: "fund-josh", month: "06/2026", amount: "55.5" },
    ]);
  });

  it("preserves negative allocations (withdrawals) but drops exact zeros", () => {
    const rows = buildFundAllocationInserts("06/2026", [
      { fundId: "fund-house", amount: -30 },
      { fundId: "fund-travel", amount: 0 },
    ]);
    expect(rows).toEqual([
      { fundId: "fund-house", month: "06/2026", amount: "-30" },
    ]);
  });

  it("returns an empty array for no funds", () => {
    expect(buildFundAllocationInserts("06/2026", [])).toEqual([]);
  });
});
