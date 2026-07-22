// Force a negative-UTC-offset timezone (US Mountain) so these tests reproduce
// the original bug: `new Date("2026-07-01")` parsed as UTC midnight rendered as
// the previous month here. Must be set before any Date is constructed.
process.env.TZ = "America/Denver";

import { parseLocalDate, monthKey, getMonthDateRange } from "@/lib/utils";

describe("monthKey", () => {
  it("keeps a 1st-of-month date in its own month (the reported bug)", () => {
    // These are the exact transactions that were being hidden from July.
    expect(monthKey("2026-07-01")).toBe("07/2026");
  });

  it("handles mid-month and end-of-month dates", () => {
    expect(monthKey("2026-07-10")).toBe("07/2026");
    expect(monthKey("2026-07-31")).toBe("07/2026");
  });

  it("handles January and December boundaries", () => {
    expect(monthKey("2026-01-01")).toBe("01/2026");
    expect(monthKey("2026-12-31")).toBe("12/2026");
  });
});

describe("parseLocalDate", () => {
  it("anchors a date-only string to the intended local calendar day", () => {
    const d = parseLocalDate("2026-07-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July, 0-indexed
    expect(d.getDate()).toBe(1); // no UTC shift back to June 30
  });

  it("does not drift for end-of-month dates", () => {
    const d = parseLocalDate("2026-12-31");
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

describe("getMonthDateRange", () => {
  it("returns a half-open range for a normal month", () => {
    expect(getMonthDateRange("07/2026")).toEqual({
      start: "2026-07-01",
      end: "2026-08-01",
    });
  });

  it("rolls over to the next year for December", () => {
    expect(getMonthDateRange("12/2026")).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
  });

  it("agrees with monthKey on the range boundary (regression guard)", () => {
    // A transaction on the range start must map to the same month the range
    // represents — this is the invariant whose violation hid the 3 txns.
    const { start } = getMonthDateRange("07/2026");
    expect(monthKey(start)).toBe("07/2026");
  });
});
