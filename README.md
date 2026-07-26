# HRM PLUS

AI-enabled, multi-tenant SaaS HR & workforce management platform (COMPX576 capstone).

This repository currently implements the Weeks 1-2 foundation (multi-tenant architecture, auth/RBAC, CI) plus the first feature module: the **Employee Directory**.

## Stack

- Backend: Express + TypeScript, Prisma, MySQL
- Frontend: React + TypeScript, Vite, Tailwind
- Multi-tenancy: one MySQL database per tenant, with a control-plane database holding the tenant registry

## Repository layout

```
apps/backend    Express API (see apps/backend/README below for details)
apps/frontend   React app
packages/shared TypeScript types shared between backend and frontend
docker-compose.yml   Containerised stack for later deployment/dev
```

## Local development setup

Prerequisites: Node.js 20+, a running MySQL server (via Homebrew: `brew services start mysql`).

```bash
npm install

# Backend env
cp apps/backend/.env.example apps/backend/.env
# Frontend env
cp apps/frontend/.env.example apps/frontend/.env

# Create the control-plane database schema
npm run migrate:control

# Provision a demo tenant (creates its database, runs tenant migrations, seeds roles + an Admin login)
npm run provision-tenant -- --name "Acme Ltd" --slug acme
# ^ prints the seeded admin email/password — use these plus tenant slug "acme" to log in

# Run both apps
npm run dev
```

Backend runs on http://localhost:4000, frontend on http://localhost:5173.

## Testing

```bash
npm test --workspace=apps/backend
```

Runs Jest + Supertest integration tests against real ephemeral tenant databases (login flow, employee CRUD, and multi-tenant data isolation).

## Multi-tenancy model

Each tenant gets its own MySQL database. A separate control-plane database (`hrm_control`) stores the tenant registry (name, slug, database name). Every API request must include an `X-Tenant-Slug` header (or, in production, a subdomain) so the backend can resolve which tenant database to use before authenticating the request.
