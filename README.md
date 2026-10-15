# DineFlow POS

A restaurant POS and order management system: take orders at the terminal, track them through the kitchen, bill with discounts and Cash/UPI, print receipts, and review sales.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Node.js · Express · MongoDB (Mongoose) · JWT

## Features

| Page | Route | Who |
|---|---|---|
| Login | `/login` | everyone |
| Dashboard: revenue, orders, average order value, 7-day chart, recent orders, popular dishes | `/dashboard` | all |
| POS Terminal: search, category filters, cart, dine-in/takeaway, checkout | `/pos` | all |
| Live Orders: Pending → Preparing → Ready → Completed board | `/orders` | all |
| Menu Management: add, edit, deactivate, availability | `/menu` | admin: everything · staff: availability only |
| Billing & Payments: discount, Cash/UPI, printable receipt | `/billing` | all (staff discount limit 10%) |
| Reports: date filters, daily summaries, CSV export | `/reports` | admin |
| Users & Roles | `/users` | admin |

## Project structure

```
client/   Next.js app (app/ pages, components/, lib/ for API client, auth, types)
server/   Express API (src/routes, models, middleware, utils/billing.ts)
```

## Setup

Requirements: Node.js 20+ and a MongoDB database (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. Install
cd server && npm install
cd ../client && npm install

# 2. Configure the server
cd ../server
cp .env.example .env        # then edit .env (see below)

# 3. Load sample data (users, 20 dishes, ~80 orders). This CLEARS the database.
npm run seed

# 4. Run (two terminals)
cd server && npm run dev    # API on http://localhost:5000
cd client && npm run dev    # app on http://localhost:3000
```

The client reads `NEXT_PUBLIC_API_URL` from `client/.env.local` (see `client/.env.local.example`).

> **Windows note:** if your project folder path contains `&`, `npx` and `.bin` shims break. The npm scripts here call `node` directly to avoid that, but renaming the folder is the simplest fix.

### Server environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string (URL-encode special characters in the password) |
| `JWT_SECRET` | Long random string used to sign tokens. **Never commit it.** |
| `JWT_EXPIRES_IN` | Token lifetime, default `8h` |
| `CLIENT_ORIGIN` | Allowed CORS origin, default `http://localhost:3000` |
| `TAX_RATE` | e.g. `0.05` for 5% |
| `TIMEZONE` | Timezone for daily grouping, e.g. `Asia/Kolkata` |
| `RESTAURANT_NAME`, `RESTAURANT_ADDRESS` | Printed on receipts |
| `LOGIN_RATE_LIMIT` | Failed sign-ins per IP per 15 min, default 10 |

Secrets live only in `server/.env` (git-ignored). The frontend only ever sees the API URL.

### Demo accounts (created by the seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@dineflow.com | Admin@123 |
| Staff | staff@dineflow.com | Staff@123 |

Change or remove these (and the demo shortcuts on the login page) before any real deployment.

## Design decisions

- **All money is calculated on the server.** `server/src/utils/billing.ts` is the single source of truth: it re-prices every cart line from the database (client prices are ignored), applies the discount, then charges tax on the discounted amount. The POS cart and the payment screen show the server's *quote*; checkout and payment use the same code, so the preview always matches the charge.
- **Order numbers** come from an atomic counter that self-corrects against the highest existing number.
- **Safe concurrency:** status changes and payments are conditional updates (`status: from`, `paymentStatus: "unpaid"`), so two staff acting on the same order can't double-advance or double-charge; the second gets a clear message.
- **Permissions are enforced on the server** (`requireRole`); the UI hiding links is only a convenience. The auth middleware re-reads the user on every request, so deactivation and role changes take effect immediately.
- **Hardening:** `helmet`, CORS allow-list, zod validation on all input, bcrypt password hashes, generic login errors, login rate limiting, and protection against an admin locking themselves out.
- **Token storage:** the JWT is kept in `localStorage` for simplicity. For production, prefer an httpOnly, SameSite cookie.

## API overview

All routes except `/auth/login` and `/health` need `Authorization: Bearer <token>`.

| Method & path | Role | Description |
|---|---|---|
| `POST /api/auth/login`, `GET /api/auth/me` | – | Sign in / current user |
| `GET /api/dashboard` | all | Today's stats, 7-day sales, popular dishes, recent orders |
| `GET /api/menu`, `GET /api/menu/all` | all | Active items (POS) / all items (management) |
| `POST /api/menu`, `PATCH /api/menu/:id` | admin (staff: `available` only) | Create / update / deactivate |
| `POST /api/orders/quote`, `POST /api/orders` | all | Price a cart / place an order |
| `GET /api/orders`, `PATCH /api/orders/:id/status` | all | Kitchen board / advance status one step |
| `GET /api/billing?status=`, `GET /api/billing/:id` | all | Bills and receipt data |
| `POST /api/billing/:id/quote`, `POST /api/billing/:id/pay` | all (staff discount ≤ 10%) | Preview / take payment |
| `GET /api/reports/sales?from=&to=` | admin | Daily summaries (paid orders only) |
| `GET/POST /api/users`, `PATCH /api/users/:id` | admin | User management |

## Scripts

`server`: `npm run dev` · `npm test` (billing unit tests) · `npm run seed` · `npm run build` · `npm run typecheck`
`client`: `npm run dev` · `npm run build` · `npm run typecheck`

## Possible next steps

API integration tests, WebSocket updates instead of 15-second polling, per-line order notes, table management, httpOnly-cookie auth, and deployment config.

## Output
<img width="1911" height="882" alt="Dashboard" src="https://github.com/user-attachments/assets/7bebab63-accb-4b53-9e00-2996d768e4b2" />
<img width="1893" height="867" alt="Pos_terminal" src="https://github.com/user-attachments/assets/c8d15dde-c6fc-4051-97b9-288f3d63bf65" />
<img width="1582" height="872" alt="Billing" src="https://github.com/user-attachments/assets/e727ad50-ea18-4553-952c-5989e8c4d1d5" />
<img width="1866" height="732" alt="LiveOrders" src="https://github.com/user-attachments/assets/3e813efd-070f-454c-8463-4363aa581a56" />




