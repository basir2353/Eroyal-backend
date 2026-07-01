-- Backfill default announcement messages when production rows were created empty.

UPDATE "website_settings"
SET
  "announcementBarEnabled" = COALESCE("announcementBarEnabled", true),
  "announcementMessages" = '[
    {"id":"cod","text":"💵 CASH ON DELIVERY — PAY AT YOUR DOORSTEP, ZERO RISK","isActive":true,"sortOrder":0},
    {"id":"fresh-mangoes","text":"🥭 FRESH EXPORT-QUALITY MANGOES — ORDER NOW","isActive":true,"sortOrder":1},
    {"id":"bank-transfer","text":"🏦 DIRECT BANK TRANSFER AVAILABLE — UPLOAD YOUR RECEIPT AFTER PAYMENT","isActive":true,"sortOrder":2}
  ]'::jsonb
WHERE "announcementMessages" IS NULL
   OR "announcementMessages" = '[]'::jsonb
   OR jsonb_array_length("announcementMessages") = 0;
