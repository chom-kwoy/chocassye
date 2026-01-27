"use server";

import fs from "fs";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React from "react";

import { DONATIONS_FILE_PATH } from "@/app/api/webhook/bmc/constants";
import { DonationInfo, Supporter } from "@/app/search/types";
import { getTranslation } from "@/components/detectLanguage";

import { getStats, search } from "./search";
import { SearchPageWrapper } from "./searchPageWrapper";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const searchTerm = params.term ?? "";
  const { t } = await getTranslation();
  return {
    title:
      searchTerm === ""
        ? t("page-title")
        : t("page-title-with-searchTerm", { searchTerm: searchTerm }),
    description: t("page-description"),
  };
}

async function getBMCInfo(): Promise<DonationInfo> {
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

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  let donationInfo: DonationInfo | null = null;
  const cookieStore = await cookies();
  const hasSeenModal = cookieStore.has("donationModalSeen");
  if (!hasSeenModal) {
    try {
      donationInfo = await getBMCInfo();
    } catch (e) {
      console.error("Failed to retrieve BMC info", e);
    }
  }

  const params = await searchParams;
  const query = {
    term: params.term ?? "",
    doc: params.doc ?? "",
    page: parseInt(params.page ?? "1"),
    excludeModern: params.excludeModern === "yes",
    ignoreSep: params.ignoreSep === "yes",
  };
  const statsPromise = getStats(query);
  const results = await search(query);
  if (results.status === "success") {
    return (
      <SearchPageWrapper
        result={{
          loaded: true,
          result: results.results,
          page_N: results.page_N,
          result_term: query.term,
          result_doc: query.doc,
          result_page: query.page,
          excludeModern: query.excludeModern,
          ignoreSep: query.ignoreSep,
        }}
        statsPromise={statsPromise}
        donationInfo={donationInfo}
      />
    );
  } else {
    return <div>Error loading data</div>;
  }
}
