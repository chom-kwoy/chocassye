import crypto from "crypto";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

import { DONATIONS_FILE_PATH } from "@/app/api/webhook/bmc/constants";
import { Supporter } from "@/app/search/types";

// 1. Define the incoming Webhook Data Structure
interface BMCWebhookData {
  id: number;
  amount: number;
  object: string;
  status: string;
  message: string;
  currency: string;
  refunded: string; // "true" | "false"
  created_at: number; // Unix timestamp
  note_hidden: string; // "true" | "false"
  refunded_at: number | null; // Note: In "refunded" event, this is a Unix timestamp (number)
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

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-signature-sha256");
    const secret = process.env.BMC_WEBHOOK_SECRET;

    let body: {
      type: string;
      data: BMCWebhookData;
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
      // 2. Map Webhook Data to your specific JSON Schema
      const dateObj = new Date(data.created_at * 1000);
      const formattedDate = dateObj
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      const mappedSupporter: Supporter = {
        support_id: data.id,
        support_coffees: data.coffee_count,
        transaction_id: data.transaction_id,
        support_created_on: formattedDate,
        supporter_name: data.supporter_name || "Anonymous",
        support_coffee_price: data.coffee_price.toFixed(4),
        support_currency: data.currency,
        country: "Unknown",
        refunded_at: null, // New donations aren't refunded yet
      };

      saveDonation(mappedSupporter);
    }

    // 3. Handle Refund Event
    else if (type === "donation.refunded") {
      // Convert unix timestamp to string format if it exists
      let formattedRefundDate = null;
      if (data.refunded_at) {
        const dateObj = new Date(data.refunded_at * 1000);
        formattedRefundDate = dateObj
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);
      }

      updateRefundStatus(data.transaction_id, formattedRefundDate);
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

function saveDonation(newSupporter: Supporter) {
  let supporters: Supporter[] = [];

  if (fs.existsSync(DONATIONS_FILE_PATH)) {
    const fileContent = fs.readFileSync(DONATIONS_FILE_PATH, "utf-8");
    try {
      supporters = JSON.parse(fileContent);
    } catch (e) {
      console.error("Error parsing donations file, starting fresh.", e);
    }
  }

  // Deduplication check
  const exists = supporters.some(
    (s) => s.transaction_id === newSupporter.transaction_id,
  );

  if (!exists) {
    supporters.push(newSupporter);
    fs.writeFileSync(DONATIONS_FILE_PATH, JSON.stringify(supporters, null, 2));
    console.log(`Saved new donation from ${newSupporter.supporter_name}`);
  }
}

// Helper to find and update existing record
function updateRefundStatus(transactionId: string, refundedAt: string | null) {
  if (!fs.existsSync(DONATIONS_FILE_PATH)) return;

  try {
    const fileContent = fs.readFileSync(DONATIONS_FILE_PATH, "utf-8");
    const supporters: Supporter[] = JSON.parse(fileContent);

    // Find the donation
    const index = supporters.findIndex(
      (s) => s.transaction_id === transactionId,
    );

    if (index !== -1) {
      // Update only the refunded_at field
      supporters[index].refunded_at = refundedAt;

      // Save back to file
      fs.writeFileSync(
        DONATIONS_FILE_PATH,
        JSON.stringify(supporters, null, 2),
      );
      console.log(`Updated refund status for transaction: ${transactionId}`);
    } else {
      console.warn(`Refund received for unknown transaction: ${transactionId}`);
    }
  } catch (e) {
    console.error("Error updating refund status:", e);
  }
}
