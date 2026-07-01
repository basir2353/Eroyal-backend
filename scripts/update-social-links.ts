import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const socialLinks = [
  { platform: "facebook", url: "https://www.facebook.com/share/1JxSFsbRoM/" },
  {
    platform: "instagram",
    url: "https://www.instagram.com/eroyalmango?utm_source=qr&igsh=MTV0bDE4MDc3ZnEzaA==",
  },
  {
    platform: "whatsapp",
    url: "https://whatsapp.com/channel/0029Vb7vuPXFHWq07oF9Yf3N",
  },
];

const result = await prisma.websiteSettings.updateMany({
  data: { socialLinks },
});

console.log(`Updated ${result.count} website settings row(s).`);
await prisma.$disconnect();
