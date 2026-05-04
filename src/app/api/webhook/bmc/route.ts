import crypto from "crypto";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

import { DONATIONS_FILE_PATH } from "@/app/api/webhook/bmc/constants";
import { Supporter } from "@/app/search/types";

interface BMCDonationWebhookData {
  id: number;
  amount: number;
  object: string;
  status: string;
  message: string;
  currency: string;
  refunded: string; // "true" | "false"
  created_at: number; // Unix timestamp
  note_hidden: string; // "true" | "false"
  refunded_at: number | null;
  support_note: string | null;
  support_type: string;
  supporter_name: string;
  supporter_name_type: string;
  transaction_id: string;
  application_fee: string;
  supporter_id: number;
  supporter_email: string;
  total_amount_charged: string;
  coffee_count: number;
  coffee_price: number;
}

interface BMCMembershipWebhookData {
  subscription_id: number;
  payer_name: string;
  payer_email: string;
  subscription_coffee_price: string;
  subscription_coffee_num: number;
  subscription_currency: string;
  subscription_current_period_start: string;
  subscription_current_period_end: string;
  subscription_created_on: string;
  subscription_cancelled_on: string | null;
  subscription_is_cancelled: boolean | string;
  country: string;
  transaction_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-signature-sha256");
    const secret = process.env.BMC_WEBHOOK_SECRET;

    let body: {
      type: string;
      data: BMCDonationWebhookData | BMCMembershipWebhookData;
    };

    if (secret && signature) {
      const bodyText = await req.text();
      const hash = crypto
        .createHmac("sha256", secret)
        .update(bodyText)
        .digest("hex");

      if (hash !== signature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
      body = JSON.parse(bodyText);
    } else {
      body = await req.json();
    }

    console.log("Webhook received:", body);

    const { type, data } = body;

    if (type === "donation.created") {
      const d = data as BMCDonationWebhookData;
      const dateObj = new Date(d.created_at * 1000);
      const formattedDate = dateObj
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      const mappedSupporter: Supporter = {
        support_id: d.id,
        support_coffees: d.coffee_count,
        transaction_id: d.transaction_id,
        support_created_on: formattedDate,
        supporter_name: d.supporter_name || "Anonymous",
        support_coffee_price: d.coffee_price.toFixed(4),
        support_currency: d.currency,
        country: "Unknown",
        refunded_at: null,
      };

      upsertDonation(mappedSupporter);
    } else if (type === "donation.refunded") {
      const d = data as BMCDonationWebhookData;
      let formattedRefundDate = null;
      if (d.refunded_at) {
        const dateObj = new Date(d.refunded_at * 1000);
        formattedRefundDate = dateObj
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);
      }
      updateRefundStatus(d.transaction_id, formattedRefundDate);
    } else if (type === "membership.created" || type === "membership.updated") {
      const d = data as BMCMembershipWebhookData;
      const mappedSubscriber: Supporter = {
        support_id: d.subscription_id,
        transaction_id: `sub_${d.subscription_id}`,
        support_coffee_price: d.subscription_coffee_price,
        support_coffees: d.subscription_coffee_num,
        support_currency: d.subscription_currency,
        supporter_name: d.payer_name || "Anonymous",
        support_created_on: d.subscription_current_period_start,
        subscription_period_end: d.subscription_current_period_end,
        refunded_at: null,
        country: d.country ?? "Unknown",
      };
      upsertDonation(mappedSubscriber);
    } else if (type === "membership.cancelled") {
      const d = data as BMCMembershipWebhookData;
      removeDonation(`sub_${d.subscription_id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function readDonations(): Supporter[] {
  if (!fs.existsSync(DONATIONS_FILE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DONATIONS_FILE_PATH, "utf-8"));
  } catch (e) {
    console.error("Error parsing donations file, starting fresh.", e);
    return [];
  }
}

function writeDonations(supporters: Supporter[]) {
  fs.writeFileSync(DONATIONS_FILE_PATH, JSON.stringify(supporters, null, 2));
}

function upsertDonation(record: Supporter) {
  const supporters = readDonations();
  const index = supporters.findIndex(
    (s) => s.transaction_id === record.transaction_id,
  );
  if (index !== -1) {
    supporters[index] = record;
    console.log(`Updated record for ${record.supporter_name}`);
  } else {
    supporters.push(record);
    console.log(`Saved new donation from ${record.supporter_name}`);
  }
  writeDonations(supporters);
}

function removeDonation(transactionId: string) {
  const supporters = readDonations();
  const filtered = supporters.filter((s) => s.transaction_id !== transactionId);
  if (filtered.length < supporters.length) {
    writeDonations(filtered);
    console.log(`Removed subscription: ${transactionId}`);
  } else {
    console.warn(
      `Cancellation received for unknown subscription: ${transactionId}`,
    );
  }
}

function updateRefundStatus(transactionId: string, refundedAt: string | null) {
  const supporters = readDonations();
  const index = supporters.findIndex((s) => s.transaction_id === transactionId);
  if (index !== -1) {
    supporters[index].refunded_at = refundedAt;
    writeDonations(supporters);
    console.log(`Updated refund status for transaction: ${transactionId}`);
  } else {
    console.warn(`Refund received for unknown transaction: ${transactionId}`);
  }
}
