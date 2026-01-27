export type Supporter = {
  support_coffee_price: string; // e.g. '5.0000'
  support_currency: string; // e.g. 'USD'
  country: string;
  supporter_name: string;
  refunded_at: string | null;
  support_created_on: string; // e.g. '2026-01-27 13:27:06'
  support_coffees: number;
};

export type DonationInfo = {
  totalDonations: number;
  supporters: Supporter[];
};
