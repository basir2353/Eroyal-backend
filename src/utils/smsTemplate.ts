export type OrderSmsTemplateData = {
  customerName: string;
  orderNumber: string;
  total: string;
  phone: string;
  paymentMethod: string;
  siteName: string;
};

export const DEFAULT_ORDER_SMS_TEMPLATE =
  "Thank you for your order, {customerName}! Your order {orderNumber} for Rs{total} has been received. - E Royal Mango";

export const SMS_TEMPLATE_PLACEHOLDERS = [
  "{customerName}",
  "{orderNumber}",
  "{total}",
  "{phone}",
  "{paymentMethod}",
  "{siteName}",
] as const;

export function renderOrderSmsTemplate(template: string, data: OrderSmsTemplateData) {
  return template
    .replace(/\{customerName\}/g, data.customerName)
    .replace(/\{orderNumber\}/g, data.orderNumber)
    .replace(/\{total\}/g, data.total)
    .replace(/\{phone\}/g, data.phone)
    .replace(/\{paymentMethod\}/g, data.paymentMethod)
    .replace(/\{siteName\}/g, data.siteName)
    .trim();
}

export function formatPaymentMethodLabel(method: string) {
  if (method === "cash_on_delivery") return "Cash on delivery";
  if (method === "direct_bank_transfer") return "Bank transfer";
  return method.replace(/_/g, " ");
}

export function normalizePhoneNumber(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";

  if (digits.startsWith("+")) {
    return `+${digits.slice(1).replace(/\D/g, "")}`;
  }

  const numbers = digits.replace(/\D/g, "");
  if (numbers.startsWith("92")) return `+${numbers}`;
  if (numbers.startsWith("0")) return `+92${numbers.slice(1)}`;
  if (numbers.length === 10) return `+92${numbers}`;
  return `+${numbers}`;
}
