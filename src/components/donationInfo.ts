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

  // 2. Reuse your exact filtering logic
  const validSupporters = allSupporters.filter((supporter) => {
    const supportDate = new Date(supporter.support_created_on);
    const today = new Date();
    const isFromThisMonth =
      supportDate.getMonth() === today.getMonth() &&
      supportDate.getFullYear() === today.getFullYear();

    const amount =
      parseFloat(supporter.support_coffee_price) * supporter.support_coffees;

    return (
      supporter.support_currency === "USD" &&
      supporter.refunded_at === null &&
      amount >= 1.0 &&
      isFromThisMonth
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
