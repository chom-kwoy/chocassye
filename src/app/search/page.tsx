"use server";

import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import React from "react";

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
    keywords: [
      "corpus",
      "Middle Korean",
      "Early Modern Korean",
      "historical Korean",
      "text database",
      "search",
      "database",
      "Middle Korean text database",
      "Early Modern Korean text database",
      "historical Korean text database",
      "search engine",
      "search engine for Middle Korean",
      "search engine for Early Modern Korean",
      "search engine for historical Korean",
      "search engine for Middle Korean text",
      "search engine for Early Modern Korean text",
      "search engine for historical Korean text",
      "말뭉치",
      "중세국어",
      "중세 한국어",
      "근대국어",
      "근대 한국어",
      "역사 말뭉치",
      "국어사 자료",
      "국어사 코퍼스",
      "국어사 DB",
      "검색",
      "DB",
      "데이터베이스",
      "중세국어 검색",
      "근대국어 검색",
      "옛말 검색",
      "옛말 자료",
    ],
  };
}

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isGoogleBot =
    userAgent.toLowerCase().includes("googlebot") ||
    userAgent.toLowerCase().includes("google-inspectiontool");
  console.log("User-Agent:", userAgent, "isGoogleBot:", isGoogleBot);

  const cookieStore = await cookies();
  const hasSeenModal = cookieStore.has("donationModalSeen");
  const showDonationDialog = !isGoogleBot && !hasSeenModal;

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
        showDonationDialog={showDonationDialog}
      />
    );
  } else {
    return <div>Error loading data</div>;
  }
}
