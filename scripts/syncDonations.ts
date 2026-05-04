import fs from "fs";
import path from "path";

import { Supporter } from "@/app/search/types";

const token = process.env.BMC_API_TOKEN;
if (!token)
  throw new Error("BMC_API_TOKEN is not set in environment variables.");

const DONATIONS_FILE_PATH = path.join(process.cwd(), "donations.json");

interface BMCPagedResponse<T> {
  data: T[];
  next_page_url: string | null;
}

interface BMCSupporter {
  support_id: number;
  transaction_id: string;
  support_coffee_price: string;
  support_coffees: number;
  support_currency: string;
  supporter_name: string;
  support_created_on: string;
  refunded_at: string | null;
  country: string;
}

interface BMCSubscription {
  subscription_id: number;
  transaction_id: string;
  payer_name: string;
  subscription_coffee_price: string;
  subscription_coffee_num: number;
  subscription_currency: string;
  subscription_current_period_start: string;
  subscription_current_period_end: string;
  subscription_cancelled_on: string | null;
  subscription_is_cancelled: string; // "0" or "1"
  country: string;
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const all: T[] = [];
  let pageUrl: string | null = url;
  while (pageUrl) {
    const res = await fetch(pageUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as BMCPagedResponse<T>;
    all.push(...json.data);
    pageUrl = json.next_page_url ?? null;
  }
  return all;
}

const [supporters, subscriptions] = await Promise.all([
  fetchAllPages<BMCSupporter>(
    "https://developers.buymeacoffee.com/api/v1/supporters",
  ),
  fetchAllPages<BMCSubscription>(
    "https://developers.buymeacoffee.com/api/v1/subscriptions",
  ),
]);

const activeSubscribers: Supporter[] = subscriptions
  .filter((s) => !s.subscription_is_cancelled && !s.subscription_cancelled_on)
  .map((s) => ({
    support_id: s.subscription_id,
    transaction_id: `sub_${s.subscription_id}`,
    support_coffee_price: s.subscription_coffee_price,
    support_coffees: s.subscription_coffee_num,
    support_currency: s.subscription_currency,
    supporter_name: s.payer_name || "Anonymous",
    support_created_on: s.subscription_current_period_start,
    subscription_period_end: s.subscription_current_period_end,
    refunded_at: null,
    country: s.country ?? "Unknown",
  }));

// Merge by transaction_id; supporters take priority on collision
const byId = new Map<string, Supporter>();
for (const s of supporters) byId.set(s.transaction_id, s);
for (const s of activeSubscribers) byId.set(s.transaction_id, s);

fs.writeFileSync(
  DONATIONS_FILE_PATH,
  JSON.stringify([...byId.values()], null, 2),
);
console.log(
  `Saved ${supporters.length} one-time supporters + ${activeSubscribers.length} active subscribers`,
);
