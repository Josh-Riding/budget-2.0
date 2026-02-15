export interface SimpleFinTransaction {
  id: string;
  posted: number;
  amount: string;
  description: string;
  pending?: boolean;
  transacted_at?: number;
}

export interface SimpleFinAccount {
  org: { domain?: string; "sfin-url"?: string };
  id: string;
  name: string;
  currency: string;
  balance: string;
  "available-balance"?: string;
  "balance-date": number;
  transactions?: SimpleFinTransaction[];
}

export interface SimpleFinAccountSet {
  errors: string[];
  accounts: SimpleFinAccount[];
}

export async function claimSetupToken(setupToken: string): Promise<string> {
  const claimUrl = Buffer.from(setupToken, "base64").toString("utf-8");
  const response = await fetch(claimUrl, {
    method: "POST",
    headers: { "Content-Length": "0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to claim token: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

export async function fetchAccounts(
  accessUrl: string,
  startDate?: Date
): Promise<SimpleFinAccountSet> {
  const url = new URL(accessUrl);
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
  const authHeader =
    "Basic " + Buffer.from(`${url.username}:${url.password}`).toString("base64");

  const params = new URLSearchParams();
  if (startDate) {
    params.append("start-date", Math.floor(startDate.getTime() / 1000).toString());
  }

  const endpoint = `${baseUrl}/accounts${params.toString() ? "?" + params.toString() : ""}`;
  const response = await fetch(endpoint, {
    headers: { Authorization: authHeader },
    signal: AbortSignal.timeout(300000),
  });

  if (!response.ok) {
    throw new Error(`SimpleFin API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
