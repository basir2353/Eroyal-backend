# E Royal Mango — Backend API

Express + Prisma API for the storefront and admin panel.

## Local development

```bash
# From repo root
npm run db:generate
npm run dev:api
```

API: `http://localhost:4000` · Health: `GET /health`

## Production

Deployed on **Railway**. See [DEPLOYMENT.md](../DEPLOYMENT.md) in the monorepo root for full setup (Postgres, env vars, Vercel URLs for CORS).

```bash
npm run build       # prisma generate + tsc
npm run start       # node dist/index.js
```

Railway runs `npx prisma migrate deploy` before start (see `railway.toml`).

### After deploying schema changes

```bash
npx prisma migrate deploy   # production (Railway does this on redeploy)
npm run seed                # payment accounts, announcements, SMS defaults
```

Optional Twilio env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_FROM`.
