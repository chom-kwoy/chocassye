import crypto from "crypto";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { Supporter } from "@/app/search/types";

export const DONATIONS_FILE_PATH = path.join(process.cwd(), "donations.json");

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the signature (Security)
    // BMC sends a signature to verify the request is actually from them.
    const signature = req.headers.get("x-signature-sha256");
    const secret = process.env.BMC_WEBHOOK_SECRET;

    // Note: If you haven't set up a secret in BMC yet, you can temporarily skip this check,
    // but it is highly recommended for production.
    let body: {
      type: string;
      data: Supporter;
    };
    if (secret && signature) {
      const bodyText = await req.text(); // Read raw body for verification
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
      // Reparse JSON since we consumed the stream
      body = JSON.parse(bodyText);
    } else {
      // Fallback if no secret configured yet
      body = await req.json();
    }

    const { type, data } = body;

    // 2. Handle "Donation Created" Event
    if (type === "donation.created") {
      // Create the new supporter object
      const newSupporter: Supporter = data;

      saveDonation(newSupporter);
    }

    // 3. Handle "Refund" Event
    if (type === "refund.created") {
      // TODO
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

// --- Helper: Save to JSON File ---
function saveDonation(newSupporter: Supporter) {
  let supporters: Supporter[] = [];

  // Read existing data
  if (fs.existsSync(DONATIONS_FILE_PATH)) {
    const fileContent = fs.readFileSync(DONATIONS_FILE_PATH, "utf-8");
    try {
      supporters = JSON.parse(fileContent);
    } catch (e) {
      console.error("Error parsing donations file, starting fresh.", e);
    }
  }

  // Check if already exists (deduplication)
  const exists = supporters.some(
    (s) => s.transaction_id === newSupporter.transaction_id,
  );
  if (!exists) {
    supporters.push(newSupporter);

    // Write back to file
    fs.writeFileSync(DONATIONS_FILE_PATH, JSON.stringify(supporters, null, 2));
    console.log(`Saved new donation from ${newSupporter.supporter_name}`);
  }
}
