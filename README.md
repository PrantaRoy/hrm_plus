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
docker-compose.yml   Containerised stack for later deployment/dev
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

# Create the first SaaS super-admin login
npm run create-saas-admin -- --email you@hrmplus.test --password <password>

# (Optional) provision a demo tenant directly via CLI, bypassing the signup/approval flow
npm run provision-tenant -- --name "Acme Ltd" --slug acme

# Run all three apps
npm run dev
```

- Backend: http://localhost:4000
- Tenant employee portal: http://localhost:5173
- SaaS landing/signup + super-admin portal: http://localhost:5174

## Demo login details

Credentials for the currently-seeded local dev database (see `apps/backend/.env` for how these map to real values — passwords below are the actual working ones, not placeholders).

### SaaS super-admin portal — http://localhost:5174/admin/login

| Field | Value |
|---|---|
| Email | `owner@hrmplus.test` |
| Password | `SuperAdmin123!` |

Created via `npm run create-saas-admin -- --email owner@hrmplus.test --password SuperAdmin123!`. Manages packages, reviews/approves tenant applications, and can activate/deactivate any company.

### Demo tenant "Acme Ltd" — http://localhost:5173/login

| Field | Value |
|---|---|
| Organisation slug | `acme` |
| Email | `admin@acme.hrmplus.test` |
| Password | `PUxoBkUueckZ` |
| Role | Admin |

Provisioned via `npm run provision-tenant -- --name "Acme Ltd" --slug acme`. This is an `Admin` login for the Employee Directory (create/search/edit employees and departments).

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

Confirmed-working credentials right now:

SaaS super-admin: owner@hrmplus.test / SuperAdmin123!
Tenant acme: admin@acme.hrmplus.test / PUxoBkUueckZ
