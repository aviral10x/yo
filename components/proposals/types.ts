export type LeadOption = {
  id: string;
  coupleName: string;
  phone: string;
  eventType: string;
  guestCount: number;
  dateRequested: string;
};

export type PackageOption = {
  id: string;
  name: string;
  perPlate: number;
  priceMin: number;
  priceMax: number;
  eventTypes: string[];
};

export type LineItem = {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
};

export type ProposalRow = {
  id: string;
  coupleName: string;
  contact: string;
  leadId?: string;
  eventDate: string;
  packageName: string;
  guestCount: number;
  total: number;
  depositPct: number;
  status: "draft" | "sent" | "hold" | "deposit" | "accepted";
};
