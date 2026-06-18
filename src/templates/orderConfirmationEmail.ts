export type OrderConfirmationItem = {
  name: string;
  quantity: number;
  lineTotal: number;
  weight?: string | null;
};

export type OrderConfirmationTemplateData = {
  customerName: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  items: OrderConfirmationItem[];
  totalAmount: number;
  orderStatus: string;
  storefrontUrl: string;
};

function formatCurrency(amount: number) {
  return `Rs${Math.round(amount).toLocaleString("en-PK")}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildOrderConfirmationSubject(data: OrderConfirmationTemplateData) {
  return `Order Confirmed — ${data.orderNumber} | E Royal Mango`;
}

export function buildOrderConfirmationHtml(data: OrderConfirmationTemplateData) {
  const safeName = escapeHtml(data.customerName);
  const safeOrderId = escapeHtml(data.orderId);
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeDate = escapeHtml(data.orderDate);
  const safeStatus = escapeHtml(formatStatus(data.orderStatus));
  const safeTotal = escapeHtml(formatCurrency(data.totalAmount));
  const safeUrl = escapeHtml(data.storefrontUrl);

  const itemRows = data.items
    .map((item) => {
      const label = item.weight ? `${item.name} (${item.weight})` : item.name;
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #eee;color:#333;font-size:14px;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:14px 16px;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;font-weight:600;">
            ${escapeHtml(formatCurrency(item.lineTotal))}
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4a148c 0%,#6a1b9a 45%,#f9a825 100%);padding:32px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.82);">
                E Royal Mango
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;line-height:1.3;">
                Thank You For Your Order
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.7;">
                Dear <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                We have received your order and our team is preparing your premium mangoes with royal care.
                Below are your order details for your records.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border:1px solid #eee;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;width:140px;">Order ID</td>
                        <td style="padding:6px 0;color:#222;font-size:14px;font-weight:600;">${safeOrderId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Order Number</td>
                        <td style="padding:6px 0;color:#222;font-size:14px;font-weight:600;">${safeOrderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Order Date</td>
                        <td style="padding:6px 0;color:#222;font-size:14px;">${safeDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Order Status</td>
                        <td style="padding:6px 0;color:#6a1b9a;font-size:14px;font-weight:600;">${safeStatus}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Total Amount</td>
                        <td style="padding:6px 0;color:#222;font-size:18px;font-weight:700;">${safeTotal}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 14px;color:#222;font-size:18px;font-weight:600;">Order Items</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eee;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#f3f3f3;">
                    <th align="left" style="padding:12px 16px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Product</th>
                    <th align="center" style="padding:12px 16px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Qty</th>
                    <th align="right" style="padding:12px 16px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                If you have any questions about your order, simply reply to this email or contact our support team.
                We appreciate your trust in E Royal Mango.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:999px;background:#6a1b9a;">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.04em;">
                      Continue Shopping
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0 0 8px;color:#888;font-size:12px;line-height:1.6;">
                Premium export-quality mangoes from Multan, Pakistan
              </p>
              <p style="margin:0;color:#aaa;font-size:11px;">
                © ${new Date().getFullYear()} E Royal Mango. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildOrderConfirmationText(data: OrderConfirmationTemplateData) {
  const lines = [
    `Dear ${data.customerName},`,
    "",
    "Thank you for your order with E Royal Mango.",
    "",
    `Order ID: ${data.orderId}`,
    `Order Number: ${data.orderNumber}`,
    `Order Date: ${data.orderDate}`,
    `Order Status: ${formatStatus(data.orderStatus)}`,
    "",
    "Items:",
    ...data.items.map((item) => {
      const label = item.weight ? `${item.name} (${item.weight})` : item.name;
      return `- ${label} x${item.quantity} — ${formatCurrency(item.lineTotal)}`;
    }),
    "",
    `Total Amount: ${formatCurrency(data.totalAmount)}`,
    "",
    "We appreciate your trust in E Royal Mango.",
    data.storefrontUrl,
  ];
  return lines.join("\n");
}
