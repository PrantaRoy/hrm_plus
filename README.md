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
