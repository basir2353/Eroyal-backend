export type DefaultAnnouncementMessage = {
  id: string;
  text: string;
  isActive: boolean;
  sortOrder: number;
};

export const DEFAULT_ANNOUNCEMENT_MESSAGES: DefaultAnnouncementMessage[] = [
  {
    id: "cod",
    text: "💵 CASH ON DELIVERY — PAY AT YOUR DOORSTEP, ZERO RISK",
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "fresh-mangoes",
    text: "🥭 FRESH EXPORT-QUALITY MANGOES — ORDER NOW",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bank-transfer",
    text: "🏦 DIRECT BANK TRANSFER AVAILABLE — UPLOAD YOUR RECEIPT AFTER PAYMENT",
    isActive: true,
    sortOrder: 2,
  },
];

export function defaultAnnouncementTexts(): string[] {
  return DEFAULT_ANNOUNCEMENT_MESSAGES.filter((item) => item.isActive).map(
    (item) => item.text,
  );
}
