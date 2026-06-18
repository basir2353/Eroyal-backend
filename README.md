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

Deployed on **Railway**. See [DEPLOYMENT.md](../DEPLOYMENT.md) for full setup (Postgres, env vars, Vercel URLs for CORS).

```bash
npm run build:api    # prisma generate + tsc
npm run start:api    # migrate deploy + start server
```
