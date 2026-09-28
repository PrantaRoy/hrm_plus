# HRM PLUS

AI-enabled, multi-tenant SaaS HR & workforce management platform (COMPX576 capstone).

This repository implements the Weeks 1-2 foundation (multi-tenant architecture, auth/RBAC, CI), the **Employee Directory** feature module, and the **SaaS control plane**: a public landing/signup page, a super-admin portal (packages, application review/approval, company management), and the tenant-side approval-gated login flow.

## Stack

- Backend: Express + TypeScript, Prisma, MySQL
- Frontend: React + TypeScript, Vite, Tailwind (two apps — see below)
- Multi-tenancy: one MySQL database per tenant, with a control-plane database holding the tenant registry, packages, and applications
- Email: nodemailer (SMTP, or an auto-created Ethereal test inbox for local dev)

## Repository layout

```
apps/backend        Express API — tenant-scoped /api/* routes + SaaS control-plane /saas/* routes
apps/frontend        React app — the logged-in tenant employee portal
apps/saas-frontend   React app — public landing/signup + super-admin dashboard
packages/shared      TypeScript types shared between all three apps
docker-compose.yml   Full containerised stack (see "Run with Docker")
```

## Local development setup

Prerequisites: Node.js 20+, a running MySQL server (via Homebrew: `brew services start mysql`).

```bash
npm install

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/saas-frontend/.env.example apps/saas-frontend/.env

# Create the control-plane database schema
npm run migrate:control

# Seed the fixed demo credentials below (SaaS super-admin + "Acme Ltd" tenant + admin user)
# Safe to re-run any time — it always resets these credentials back to the values below
# instead of leaving behind a random or stale password.
npm run db:seed

# Run all three apps
npm run dev
```

To create your own SaaS admin or tenant with different credentials instead of (or in addition to) the demo ones:

```bash
npm run create-saas-admin -- --email you@hrmplus.test --password <password>
npm run provision-tenant -- --name "Acme Ltd" --slug acme --admin-password <password>
```

`create-saas-admin` and `provision-tenant --slug <existing>` fail if the target already exists, since they're meant for provisioning something new — use `npm run db:seed` (optionally overriding `SEED_SAAS_ADMIN_EMAIL` / `SEED_SAAS_ADMIN_PASSWORD` / `SEED_TENANT_ADMIN_EMAIL` / `SEED_TENANT_ADMIN_PASSWORD`) whenever you just want the demo login to reliably work again.

- Backend: http://localhost:4000
- Tenant employee portal: http://localhost:5173
- SaaS landing/signup + super-admin portal: http://localhost:5174

## Run with Docker

Prerequisite: Docker with Compose v2. Nothing else (no Node, MySQL or Redis) is needed on the host.

```bash
cp .env.example .env      # defaults work locally; change every secret for a real deployment
docker compose up --build
```

This starts MySQL, Redis, the API, the BullMQ worker and both frontends (nginx), and a one-shot `migrate` service that applies the control-DB migrations and seeds the demo data (`SEED_DEMO=true`). The ports and demo logins are the same as in local development (API `:4000`, tenant portal `:5173`, SaaS portal `:5174`; MySQL is on host port `3307`).

- Logs: `docker compose logs -f backend worker`
- Stop: `docker compose down` (data and uploads live in the `mysql-data`, `redis-data` and `uploads` volumes); add `-v` to wipe everything.
- The `VITE_*` values in `.env` are baked into the frontend bundles at build time — after changing them run `docker compose up --build`.
- For a real domain, change `PUBLIC_TENANT_BASE_DOMAIN`, `VITE_PUBLIC_TENANT_BASE_DOMAIN`, `CORS_ORIGIN`, `FRONTEND_BASE_URL` and the `VITE_*_API_BASE_URL` values together, and set `SEED_DEMO=false`.

## Demo login details

Credentials for the currently-seeded local dev database (see `apps/backend/.env` for how these map to real values — passwords below are the actual working ones, not placeholders).

### SaaS super-admin portal — http://localhost:5174/admin/login

| Field | Value |
|---|---|
| Email | `saas@hrmplus.test` |
| Password | `1234abcd` |

Manages packages, reviews/approves tenant applications, and can activate/deactivate any company.

### Demo tenant "Acme Ltd" — http://localhost:5173/login

| Field | Value |
|---|---|
| Organisation slug | `acme` |
| Email | `acme@hrmplus.test` |
| Password | `1234abcd` |
| Role | Admin |

This is an `Admin` login for the Employee Directory (create/search/edit employees and departments).

### Demo packages (seeded for the SaaS landing page)

| Name | Price | Validity |
|---|---|---|
| Starter | Free | Unlimited |
| Growth | $49.99 | 30 days |

### Creating a new tenant end-to-end (no CLI shortcut)

1. Go to http://localhost:5174/, pick a package, and submit the signup form (any unique subdomain slug).
2. Log into the super-admin portal above, open **Applications**, and approve the new one.
3. The new tenant's `Admin` login is: email = the contact email you entered on the signup form, password = `12345678` (you'll be forced to change it on first login) — subdomain = whatever slug you chose.

### Postman collection

`postman/HRM_PLUS.postman_collection.json` has all of the above pre-filled as collection variables (`saasAdminEmail`, `tenantEmail`, `tenantPassword`, etc.) — see `postman/README.md` for import instructions.

## The SaaS flow

1. A super-admin logs into `/admin/login` on the saas-frontend and creates one or more **packages** (name, price — 0 for free — and validity in days, or unlimited).
2. A prospect visits the public landing page, picks a package, and submits the signup form (company details + a unique subdomain prefix). This creates a `Pending` application and emails them a confirmation.
3. The super-admin reviews pending applications, can edit details, and **approves** or **rejects** them. Approval provisions a real tenant database, seeds roles, creates an `Admin` user (email = the applicant's contact email, password `12345678`, flagged to require a password change), and emails the login details.
4. The applicant logs into the tenant app (`apps/frontend`) using their subdomain slug + email + the default password, and is forced to set a new password before reaching the dashboard.
5. The super-admin's **Companies** list shows every tenant with its package, start/end date, and an activate/deactivate toggle — deactivating a tenant blocks all access to that subdomain immediately.

## Testing

```bash
npm test --workspace=apps/backend
```

Runs Jest + Supertest integration tests against real ephemeral tenant databases: login flow, employee CRUD, multi-tenant data isolation, SaaS admin auth, package CRUD, application submission/uniqueness/review, and the full approval → provisioning → forced-password-change flow.

## Multi-tenancy model

Each tenant gets its own MySQL database. A separate control-plane database (`hrm_control`) stores the tenant registry, packages, and applications. Every tenant-scoped API request must include an `X-Tenant-Slug` header (or, in production, a subdomain) so the backend can resolve which tenant database to use before authenticating the request. The SaaS control-plane routes (`/saas/*`) use a separately-secreted JWT so a tenant login token can never be used against the super-admin API.
