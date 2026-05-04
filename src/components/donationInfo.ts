import fs from "fs";

import { DONATIONS_FILE_PATH } from "@/app/api/webhook/bmc/constants";
import { DonationInfo, Supporter } from "@/app/search/types";

export async function getBMCInfo(): Promise<DonationInfo> {
  // 1. Read from local file (Simulating DB)
  let allSupporters: Supporter[] = [];

  if (fs.existsSync(DONATIONS_FILE_PATH)) {
    try {
      const fileContent = fs.readFileSync(DONATIONS_FILE_PATH, "utf-8");
      allSupporters = JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to read local donation data", error);
    }
  }

  // 2. Filter to current month's contributions
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const validSupporters = allSupporters.filter((supporter) => {
    const amount =
      parseFloat(supporter.support_coffee_price) * supporter.support_coffees;

    if (
      supporter.support_currency !== "USD" ||
      supporter.refunded_at !== null ||
      amount < 1.0
    )
      return false;

    if (supporter.subscription_period_end) {
      // Subscriber: active if their current period overlaps the current month
      return new Date(supporter.subscription_period_end) > monthStart;
    }

    // One-time: must be from this calendar month
    const supportDate = new Date(supporter.support_created_on);
    return (
      supportDate.getMonth() === today.getMonth() &&
      supportDate.getFullYear() === today.getFullYear()
    );
  });

  // 3. Calculate Total
  let totalDonations = 0;
  validSupporters.forEach((supporter) => {
    const amount =
      parseFloat(supporter.support_coffee_price) * supporter.support_coffees;
    totalDonations += amount;
  });
  console.log("totalDonations", totalDonations);

  return { totalDonations, supporters: validSupporters };
}
