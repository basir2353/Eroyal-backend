export type PaymentCompleteTemplateData = {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  paymentDate: string;
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

export function buildPaymentCompleteSubject(data: PaymentCompleteTemplateData) {
  return `Payment Completed — ${data.orderNumber} | E Royal Mango`;
}

export function buildPaymentCompleteHtml(data: PaymentCompleteTemplateData) {
  const safeName = escapeHtml(data.customerName);
  const safeOrderNumber = escapeHtml(data.orderNumber);
  const safeDate = escapeHtml(data.paymentDate);
  const safeTotal = escapeHtml(formatCurrency(data.totalAmount));
  const safeUrl = escapeHtml(data.storefrontUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Completed</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2e7d32 0%,#43a047 45%,#ffc107 100%);padding:32px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.9);">
                E Royal Mango
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:600;line-height:1.3;">
                Your Payment Has Been Completed
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.7;">
                Dear <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Good news! We have verified your bank transfer payment and your order is now confirmed.
                Our team will process your order and contact you regarding delivery.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3fbf4;border:1px solid #c8e6c9;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;width:140px;">Order Number</td>
                        <td style="padding:6px 0;color:#222;font-size:14px;font-weight:600;">${safeOrderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Payment Status</td>
                        <td style="padding:6px 0;color:#2e7d32;font-size:14px;font-weight:600;">Completed</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Verified On</td>
                        <td style="padding:6px 0;color:#222;font-size:14px;">${safeDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#777;font-size:13px;">Amount Paid</td>
                        <td style="padding:6px 0;color:#222;font-size:18px;font-weight:700;">${safeTotal}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Thank you for choosing E Royal Mango. If you have any questions, simply reply to this email.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:999px;background:#43a047;">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.04em;">
                      Visit Our Store
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

export function buildPaymentCompleteText(data: PaymentCompleteTemplateData) {
  return [
    `Dear ${data.customerName},`,
    "",
    "Your payment has been completed.",
    "",
    "We have verified your bank transfer payment and your order is now confirmed.",
    "Our team will process your order and contact you regarding delivery.",
    "",
    `Order Number: ${data.orderNumber}`,
    "Payment Status: Completed",
    `Verified On: ${data.paymentDate}`,
    `Amount Paid: ${formatCurrency(data.totalAmount)}`,
    "",
    "Thank you for choosing E Royal Mango.",
    data.storefrontUrl,
  ].join("\n");
}
