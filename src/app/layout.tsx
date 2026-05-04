import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { getCookie } from "cookies-next/server";
import { dir } from "i18next";
import { polyfill } from "interweave-ssr";
import { Metadata } from "next";
import { cookies, headers } from "next/headers";
import React from "react";

import App from "@/components/App";
import { DonationProvider } from "@/components/DonationContext";
import DarkLightThemeProvider from "@/components/ThemeContext";
import { TranslationProvider } from "@/components/TranslationProvider";
import { THEME_COOKIE_KEY } from "@/components/config";
import { detectLanguage, getTranslation } from "@/components/detectLanguage";
import { getBMCInfo } from "@/components/donationInfo";

import "./index.css";

polyfill(); // Polyfill for interweave on server side

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("page-title"),
    description: t("page-description"),
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lng = await detectLanguage();
  const theme = await getCookie(THEME_COOKIE_KEY, { cookies });

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isBot =
    userAgent.toLowerCase().includes("googlebot") ||
    userAgent.toLowerCase().includes("google-inspectiontool");

  let donationInfo = null;
  if (!isBot) {
    try {
      donationInfo = await getBMCInfo();
    } catch (e) {
      console.error("Failed to retrieve BMC info", e);
    }
  }

  return (
    <html lang={lng} dir={dir(lng)}>
      <body>
        <AppRouterCacheProvider>
          <div id="root">
            <TranslationProvider defaultLng={lng}>
              <DarkLightThemeProvider initialThemeType={theme}>
                <DonationProvider donationInfo={donationInfo}>
                  <App>{children}</App>
                </DonationProvider>
              </DarkLightThemeProvider>
            </TranslationProvider>
          </div>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
