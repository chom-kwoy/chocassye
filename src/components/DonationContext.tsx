"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

import DonationModal from "@/app/search/donationDialog";
import { DonationInfo } from "@/app/search/types";

const DonationContext = createContext<{ openDonationModal: () => void }>({
  openDonationModal: () => {},
});

export function DonationProvider({
  children,
  donationInfo,
}: {
  children: React.ReactNode;
  donationInfo: DonationInfo | null;
}) {
  const [open, setOpen] = useState(false);
  const openDonationModal = useCallback(() => setOpen(true), []);

  return (
    <DonationContext.Provider value={{ openDonationModal }}>
      {children}
      {donationInfo && (
        <DonationModal
          open={open}
          onClose={() => setOpen(false)}
          donationInfo={donationInfo}
        />
      )}
    </DonationContext.Provider>
  );
}

export function useDonationModal() {
  return useContext(DonationContext);
}
