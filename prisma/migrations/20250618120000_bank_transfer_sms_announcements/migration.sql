-- Bank transfer receipts, SMS notifications, announcement bar, payment account fields

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReceiptUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReceiptUploadedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderSmsSentAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderSmsError" TEXT;

-- AlterTable
ALTER TABLE "website_settings" ADD COLUMN IF NOT EXISTS "announcementBarEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "website_settings" ADD COLUMN IF NOT EXISTS "announcementMessages" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "easyPaisaAccount" TEXT;
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "jazzCashAccount" TEXT;
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "bankAccountTitle" TEXT;
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "payment_settings" ADD COLUMN IF NOT EXISTS "bankIban" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "sms_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL DEFAULT 'sms',
    "orderPlacedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderPlacedTemplate" TEXT NOT NULL DEFAULT 'Thank you for your order, {customerName}! Your order {orderNumber} for Rs{total} has been received. - E Royal Mango',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_settings_pkey" PRIMARY KEY ("id")
);
