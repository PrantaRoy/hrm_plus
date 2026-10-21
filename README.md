# HRM PLUS

> **Author:** Pranta Roy &nbsp;·&nbsp; **Student ID:** 1711232  
> **Paper:** Programming Project (COMPX576)  
> **Programme:** Master of Information Technology, University of Waikato, New Zealand

AI-enabled, multi-tenant SaaS **HR and workforce management** platform (COMPX576 capstone project).

Companies sign up on a public website, the platform owner approves them, and each company gets its own
private workspace for recruitment, attendance, leave, rosters, payroll, documents, assets, meetings and
projects — with AI help for assessments and performance reports.

## Start here

| I want to… | Read |
|---|---|
| **Run it on my computer, deploy it, or use a source ZIP** (step by step, beginner friendly) | **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** |
| **Put it on AWS** (empty account → running server → updates) | [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md) |
| **Understand how it works** (roles, flows, diagrams) | [docs/SYSTEM_WORKFLOW.md](docs/SYSTEM_WORKFLOW.md) |

## 60-second quick start (Docker)

Needs only [Docker Desktop](https://www.docker.com/products/docker-desktop/) and Git.

```bash
git clone https://github.com/PrantaRoy/hrm_plus.git
cd hrm_plus
cp .env.example .env
docker compose up --build
```

First run takes 5–15 minutes. Then open:

- Tenant portal: <http://localhost:5173>
- SaaS site + super-admin: <http://localhost:5174>

## Demo logins

Created automatically when `SEED_DEMO=true` (the default). **Public passwords — never use them for real data.**

| Who | Where | Details |
|---|---|---|
| Platform super-admin | <http://localhost:5174/admin/login> | `saas@hrmplus.test` / `1234abcd` |
| Demo company Admin ("Acme Ltd") | <http://localhost:5173/login> | organisation `acme` · `acme@hrmplus.test` / `1234abcd` |

Sample packages: **Starter** (free, unlimited) and **Growth** ($49.99, 30 days).

## Tech stack

- **Back end:** Node.js 20, Express, TypeScript, Prisma, MySQL 8, Redis + BullMQ (background worker)
- **Front end:** React 18, Vite, Tailwind CSS (two apps)
- **AI:** pluggable provider — Groq, Gemini, OpenAI or Anthropic, chosen per company
- **Ops:** Docker Compose (7 services), GitHub Actions CI, AWS EC2
- **Multi-tenancy:** one MySQL database per company plus a control database for the platform

## Repository layout

```
apps/backend         Express API (/api/* tenant routes, /saas/* platform routes) + background worker
apps/frontend        Tenant portal — the daily app for a company's staff
apps/saas-frontend   Public landing/signup site + super-admin portal
packages/shared      TypeScript types shared by all apps (build it before running the API)
packages/ui          Shared design-system components
deploy/aws           EC2 bootstrap and address-setting scripts
docs                 Guides: deployment, AWS, system workflow
postman              Postman collection for the API
docker-compose.yml   Full containerised stack
```

## For developers (Node terminal)

```bash
git clone https://github.com/PrantaRoy/hrm_plus.git && cd hrm_plus
cp .env.example .env && docker compose up -d mysql redis            # databases in Docker
cp apps/backend/.env.example apps/backend/.env                        # then edit the DB lines
cp apps/frontend/.env.example apps/frontend/.env
cp apps/saas-frontend/.env.example apps/saas-frontend/.env
npm run setup                                                         # install, build shared, migrate, seed
npm run dev                                                           # API + worker + both websites
```

Exactly which lines to edit in `apps/backend/.env`, Windows notes and troubleshooting are in the
[deployment guide](docs/DEPLOYMENT_GUIDE.md#6-path-2--run-with-the-node-terminal-for-developers).

| Task | Command |
|---|---|
| All tests (needs MySQL) | `npm test` |
| Fast unit tests (no database) | `npm run test:unit` |
| Type-check / lint / build | `npm run typecheck` · `npm run lint` · `npm run build` |
| Re-seed demo data | `npm run db:seed` |
| New super-admin | `npm run create-saas-admin -- --email you@example.com --password <password>` |
| New company | `npm run provision-tenant -- --name "Acme Ltd" --slug acme --admin-password <password>` |

## The SaaS flow in five steps

1. A super-admin creates **packages** (price, validity) in `/admin/login`.
2. A prospect picks a package on the public site and submits the signup form → a *Pending* application and a confirmation email.
3. The super-admin reviews and **approves** it.
4. Approval creates the company's own database, roles and an Admin user (temporary password `12345678`, changed at first login) and emails the details.
5. The super-admin's **Companies** list can activate/deactivate any company; deactivating blocks access immediately.

## Testing

```bash
npm test                 # 496 test cases: unit + integration against real temporary MySQL databases
```

Covers login, role checks, tenant isolation, attendance restrictions, employees, projects and tasks,
meetings, AI KPI reports, the SaaS control plane and the approval → provisioning flow. GitHub Actions runs the
same suite plus type-check, lint and the production builds on every push.

## Multi-tenancy in one paragraph

Each tenant gets its own MySQL database; the platform data (tenants, packages, applications) lives in a
separate control database. Every tenant request carries an `X-Tenant-Slug` header (or a subdomain in
production) so the API resolves the right database *before* authenticating. The platform API (`/saas/*`)
uses a different JWT secret, so a company token can never act as the platform owner.

## Postman

`postman/HRM_PLUS.postman_collection.json` has the API pre-filled with the demo logins — see
`postman/README.md` for import instructions.
