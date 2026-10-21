# HRM PLUS — Setup & Deployment Guide

> **Author:** Pranta Roy &nbsp;·&nbsp; **Student ID:** 1711232  
> **Paper:** Programming Project (COMPX576)  
> **Programme:** Master of Information Technology, University of Waikato, New Zealand

How to get HRM PLUS running from nothing: from a `git clone`, or from a source-code **ZIP** you were
given, on your own computer (with Docker or with the Node terminal) and on AWS.

Written for two readers:

- **Non-technical readers** — follow the numbered steps exactly and copy the commands as shown. Every
  step says what you should see when it worked.
- **Developers** — the same steps are complete and exact; the "Developer notes" boxes give the detail.

> If you only want to look at the system quickly, do **Path 1 (Docker)** below. It needs no database
> installation and no code knowledge.

---

## Contents

1. [Choose your path](#1-choose-your-path)
2. [Words used in this guide](#2-words-used-in-this-guide)
3. [Step 0 — Get the code](#3-step-0--get-the-code) (git clone **or** ZIP)
4. [Step 1 — Install the tools](#4-step-1--install-the-tools)
5. [Path 1 — Run everything with Docker](#5-path-1--run-everything-with-docker)
6. [Path 2 — Run with the Node terminal (for developers)](#6-path-2--run-with-the-node-terminal-for-developers)
7. [Path 3 — Put it online on AWS](#7-path-3--put-it-online-on-aws)
8. [Logging in for the first time](#8-logging-in-for-the-first-time)
9. [Updating to the latest version (git pull)](#9-updating-to-the-latest-version-git-pull)
10. [Stopping, resetting and backing up](#10-stopping-resetting-and-backing-up)
11. [Troubleshooting](#11-troubleshooting)
12. [Before real use: security checklist](#12-before-real-use-security-checklist)
13. [For authors: how to make the source ZIP](#13-for-authors-how-to-make-the-source-zip)

---

## 1. Choose your path

| I want to… | Use | Time | Skill needed |
|---|---|---|---|
| **See the system working on my computer** | **Path 1 — Docker** | 15–30 min (mostly waiting) | None |
| **Change the code / run the tests** | **Path 2 — Node terminal** | 30–45 min | Basic terminal use |
| **Put it on the internet for others** | **Path 3 — AWS** | 45–60 min | Basic terminal use + an AWS account |

Starting from a **ZIP file**? Do Step 0 → Step 1, then pick a path. Nothing else changes.

### What gets started

| Part | What it is | Address (on your own computer) |
|---|---|---|
| Tenant portal | The app a company's staff use every day | <http://localhost:5173> |
| SaaS site + super-admin | Public landing page, signup, and the platform owner's admin area | <http://localhost:5174> |
| API | The server behind both websites | <http://localhost:4000> (health check: `/health`) |
| Worker | Background jobs (PDF payslips, AI marking, reminders) | no address |
| MySQL | The databases | port `3307` (Docker) |
| Redis | The job queue | port `6379` |

---

## 2. Words used in this guide

| Word | Plain meaning |
|---|---|
| **Terminal** | A window where you type commands. Windows: press the Windows key, type `PowerShell`, press Enter. Mac: press `Cmd + Space`, type `Terminal`, press Enter. Linux: `Ctrl + Alt + T`. |
| **Command** | A line you type in the terminal, then press Enter. Copy it exactly. Lines starting with `#` are notes — do not type them. |
| **Git** | The tool that downloads and updates the code from GitHub. |
| **Docker** | A program that runs the whole system in ready-made boxes ("containers"), so you do not install databases yourself. |
| **Node.js / npm** | What runs the code when you are not using Docker. `npm` installs the code's libraries ("dependencies"). |
| **Dependencies** | Libraries the code needs. `npm install` downloads them into a folder called `node_modules`. |
| **`.env` file** | A settings file (passwords, addresses). Each project folder has a `.env.example` template; you copy it to `.env`. |
| **Port** | A numbered door on your computer, e.g. `5173`. Two programs cannot use the same port. |
| **MySQL / Redis** | The database and the job queue the system needs. |
| **Tenant** | One company using the platform. Each company gets its own database. |

---

## 3. Step 0 — Get the code

Pick **one**: 3A if you use Git, 3B if you were given a ZIP.

### 3A. From GitHub (git clone / git pull)

First time:

```bash
git clone https://github.com/PrantaRoy/hrm_plus.git
cd hrm_plus
```

Already have the folder and want the newest version:

```bash
cd hrm_plus
git pull
```

You are in the right place when `ls` (Mac/Linux) or `dir` (Windows) shows `package.json`,
`docker-compose.yml` and a folder called `apps`.

### 3B. From a source-code ZIP

1. Save the ZIP somewhere easy, e.g. your Desktop or `Documents`.
2. **Unzip it** (Windows: right-click → *Extract All*; Mac: double-click).
3. Open a terminal **inside the unzipped folder**:
   - **Windows:** open the folder in File Explorer, click the address bar, type `powershell`, press Enter.
   - **Mac:** open Terminal, type `cd ` (with a space), drag the folder onto the Terminal window, press Enter.
   - **Linux:** right-click in the folder → *Open in Terminal*.
4. Check you are in the right place: you should see `package.json`, `docker-compose.yml` and `apps`.

```bash
ls            # Mac/Linux  (Windows: dir)
```

> **Developer notes — what is (and is not) in the ZIP.** A correct source ZIP contains the code, the
> `.env.example` files, `docker-compose.yml`, `docs/` and `deploy/`. It deliberately does **not**
> contain `node_modules/`, any `.env` file, `apps/backend/generated/` (created by Prisma), `dist/`,
> or uploaded files. All of those are created by the steps below, so the first run needs an internet
> connection. If the ZIP *does* contain `node_modules/`, delete that folder first
> (`rm -rf node_modules apps/*/node_modules` on Mac/Linux) so dependencies are installed fresh for your
> operating system.

---

## 4. Step 1 — Install the tools

| Tool | Path 1 (Docker) | Path 2 (Node) | Path 3 (AWS, on your laptop) | Get it |
|---|:-:|:-:|:-:|---|
| **Docker Desktop** (includes Compose) | **Yes** | Recommended (runs MySQL + Redis for you) | No (installed on the server) | <https://www.docker.com/products/docker-desktop/> |
| **Node.js 20 or newer** (LTS) | No | **Yes** | No | <https://nodejs.org> |
| **Git** | Only for 3A | Only for 3A | Yes | <https://git-scm.com/downloads> |

Check each tool by typing the command and pressing Enter. You should see a version number, not an error.

```bash
docker --version          # Docker version 24 or newer
docker compose version    # Docker Compose version v2 or newer
node -v                   # v20.x or higher (Path 2 only)
npm -v                    # any recent version (Path 2 only)
git --version             # any recent version
```

**Windows notes**

- Docker Desktop needs *WSL 2* — the installer offers to set it up; accept and restart if asked.
- Start Docker Desktop and wait until it says **"Docker Desktop is running"** before using any `docker` command.
- For **Path 2**, use *Git Bash* (installed with Git) or *WSL* rather than plain PowerShell, because the
  `npm run dev` command uses `&`. In PowerShell you can use the "four terminals" method in §6.5.
- In PowerShell, replace `cp` with `copy` if `cp` is not recognised, e.g. `copy .env.example .env`.

**Make sure these ports are free:** `5173`, `5174`, `4000`, `3307`, `6379`. If a program already uses
one, stop that program, or see [Troubleshooting](#11-troubleshooting).

---

## 5. Path 1 — Run everything with Docker

Everything (database, queue, API, worker, both websites) runs in containers. Nothing is installed
except Docker.

### Steps

Open your terminal in the project folder (Step 0), then:

**1. Create the settings file**

```bash
cp .env.example .env
```

This copies the template. The defaults work on your own computer. (Windows PowerShell: `copy .env.example .env`.)

**2. Start the system**

```bash
docker compose up --build
```

The **first run takes about 5–15 minutes** (it downloads and builds everything). Later runs take under
a minute. Many lines of text will scroll by — that is normal.

**3. Wait until it is ready.** You will see lines like these near the end:

```
hrm_plus-migrate-1   | ... Demo seed complete — credentials match README 'Demo login details'.
hrm_plus-migrate-1 exited with code 0
hrm_plus-backend-1   | ... HRM PLUS backend listening on port 4000
```

`migrate ... exited with code 0` is **good** (it is a one-time setup step that finishes).

**4. Open the websites** in your browser:

- Tenant portal: <http://localhost:5173>
- SaaS site + admin: <http://localhost:5174>

**5. Log in** with the demo accounts in [§8](#8-logging-in-for-the-first-time).

### Run it in the background (optional)

Add `-d` so the terminal stays free, then check the status:

```bash
docker compose up -d --build
docker compose ps          # every service should say "running" or "healthy"
```

### Everyday commands

| Task | Command |
|---|---|
| Start (after the first time) | `docker compose up -d` |
| Stop (keeps your data) | `docker compose stop` |
| See what is running | `docker compose ps` |
| Watch the API/worker logs | `docker compose logs -f backend worker` |
| Stop and **delete everything**, including data | `docker compose down -v` |

> **Developer notes.**
> - Services: `mysql` (8.4), `redis` (7), `migrate` (one-shot: control-DB migrations + demo seed),
>   `backend` (API :4000), `worker` (BullMQ), `frontend` (nginx :5173), `saas-frontend` (nginx :5174).
> - `VITE_*` values in `.env` are **baked into the website files when they are built**. If you change
>   any of them, rebuild: `docker compose up -d --build`.
> - MySQL is published to `127.0.0.1:3307` (so a DB tool can connect: user `root`, password from
>   `MYSQL_ROOT_PASSWORD`). Redis is published to `127.0.0.1:6379`. Both are bound to localhost only.
> - Data lives in the Docker volumes `mysql-data`, `redis-data` and `uploads`.
> - Set `SEED_DEMO=false` in `.env` if you do not want the demo company and accounts created.
> - Email: with `SMTP_HOST` empty the API uses a free test inbox (Ethereal). Sent emails are not delivered
>   to real people; find the preview link with `docker compose logs backend | grep -i preview`.

---

## 6. Path 2 — Run with the Node terminal (for developers)

You run the API and websites **on your computer** with Node.js, so code changes reload instantly. The
database and queue can come from Docker (easiest, §6.1A) or be installed on your machine (§6.1B).

### 6.1 Get MySQL and Redis

**Option A — recommended: use Docker only for MySQL and Redis**

```bash
cp .env.example .env
docker compose up -d mysql redis
docker compose ps        # mysql and redis should show "healthy"
```

MySQL is now at `127.0.0.1:3307` (user `root`, password `hrmplusdev`) and Redis at `127.0.0.1:6379`.

**Option B — install them directly**

| OS | MySQL 8 + Redis 7 |
|---|---|
| Mac (Homebrew) | `brew install mysql redis && brew services start mysql && brew services start redis` |
| Ubuntu/Debian | `sudo apt install mysql-server redis-server` then `sudo systemctl enable --now mysql redis-server` |
| Windows | Use Option A (Docker), or WSL with the Ubuntu line |

With Option B, MySQL runs on port `3306`. Note the `root` password you set (a fresh Homebrew install has
none). You need it in the next step.

### 6.2 Create the settings files

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/saas-frontend/.env.example apps/saas-frontend/.env
```

Now open **`apps/backend/.env`** in any text editor and set the database lines to match how you started
MySQL.

**Option A (Docker MySQL/Redis)** — replace these lines with:

```ini
CONTROL_DATABASE_URL="mysql://root:hrmplusdev@127.0.0.1:3307/hrm_control"
TENANT_MIGRATION_DATABASE_URL="mysql://root:hrmplusdev@127.0.0.1:3307/hrm_tenant_template"
TENANT_DB_HOST="127.0.0.1"
TENANT_DB_PORT="3307"
TENANT_DB_USER="root"
TENANT_DB_PASSWORD="hrmplusdev"
REDIS_URL="redis://127.0.0.1:6379"
```

**Option B (installed MySQL)** — keep host/port as they are, and add your `root` password. If the
password is `mypass`:

```ini
CONTROL_DATABASE_URL="mysql://root:mypass@localhost:3306/hrm_control"
TENANT_MIGRATION_DATABASE_URL="mysql://root:mypass@localhost:3306/hrm_tenant_template"
TENANT_DB_PASSWORD="mypass"
```

> If your password has symbols such as `@ : / #`, either change it to letters and numbers, or
> URL-encode it inside the two `mysql://` lines (`@` becomes `%40`). `TENANT_DB_PASSWORD` is **not**
> encoded. A mismatched password is the most common setup error (see Troubleshooting).

Leave the two front-end `.env` files as they are.

### 6.3 Install dependencies and set up the database

One command does it all (install libraries → build shared code → generate database client → create
the control database → add the demo data):

```bash
npm run setup
```

This takes 3–10 minutes the first time (it also downloads a browser used for PDFs). When it finishes
you should see `Demo seed complete`. Then create the folder the logo upload needs:

```bash
mkdir -p apps/backend/uploads/logos      # Windows PowerShell: mkdir apps\backend\uploads\logos
```

> **Developer notes — what `npm run setup` runs, step by step** (run these yourself if you prefer):
>
> ```bash
> npm install                                          # all workspaces' dependencies
> npm run build --workspace=packages/shared            # shared types → packages/shared/dist (required)
> npm run prisma:generate --workspace=apps/backend     # generates apps/backend/generated/{control,tenant}
> npm run migrate:control:deploy --workspace=apps/backend   # control DB: tenant registry, packages...
> npm run db:seed                                      # demo SaaS admin, "acme" tenant, sample data
> ```
>
> Tenant databases are **not** migrated by hand: each company's database is created and migrated
> automatically when the company is provisioned (the seed does this for `acme`).
> `npm run migrate:control` (without `:deploy`) is the interactive variant used when *authoring* a
> new migration.

### 6.4 Start everything (Mac / Linux / Git Bash / WSL)

```bash
npm run dev
```

This starts the API, the worker and both websites together. Leave the terminal open. Stop with
`Ctrl + C`.

### 6.5 Start everything in four terminals (works everywhere, incl. PowerShell)

Open four terminals in the project folder and run one command in each:

```bash
npm run dev:backend          # terminal 1 — API on :4000
npm run dev:worker           # terminal 2 — background jobs
npm run dev:frontend         # terminal 3 — tenant portal on :5173
npm run dev:saas-frontend    # terminal 4 — SaaS site on :5174
```

### 6.6 Check that it works

| Check | Expected |
|---|---|
| <http://localhost:4000/health> | `{"status":"ok"}` |
| <http://localhost:5173> | Tenant portal login page |
| <http://localhost:5174> | HRM PLUS landing page |

Then log in with the demo accounts in [§8](#8-logging-in-for-the-first-time).

### 6.7 Everyday developer commands

| Task | Command |
|---|---|
| Run all tests (needs MySQL; creates and drops temporary `hrm_test_*` databases) | `npm test` |
| Run only the fast unit tests (no database) | `npm run test:unit` |
| Type-check all apps | `npm run typecheck` |
| Lint all apps | `npm run lint` |
| Production build of everything | `npm run build` |
| Re-seed the demo data (safe to repeat; resets the demo passwords) | `npm run db:seed` |
| Create another platform super-admin | `npm run create-saas-admin -- --email you@example.com --password <password>` |
| Create another company directly | `npm run provision-tenant -- --name "My Co" --slug myco --admin-password <password>` |
| Run recurring-task generation once by hand | `npm run recurring-tasks:run --workspace=apps/backend` |

---

## 7. Path 3 — Put it online on AWS

This runs the same Docker stack on one cloud server (an AWS EC2 instance). The complete click-by-click
runbook, including costs, firewall rules, updating and tear-down, is in
**[DEPLOY_AWS.md](DEPLOY_AWS.md)**. In short:

1. Create an Ubuntu 22.04/24.04 `t3.medium` server with the bootstrap script `deploy/aws/user-data.sh`
   (installs Docker) and open ports 22, 4000, 5173, 5174.
2. Attach an Elastic IP so the address never changes.
3. Connect with SSH, then:

```bash
git clone https://github.com/PrantaRoy/hrm_plus.git
cd hrm_plus
cp .env.example .env
deploy/aws/set-public-ip.sh <your-elastic-ip>     # point the websites at the server's address
nano .env                                         # set real secrets (see §12)
docker compose up -d --build
```

4. Open `http://<your-elastic-ip>:5173` and `http://<your-elastic-ip>:5174`.

---

## 8. Logging in for the first time

Demo accounts exist when `SEED_DEMO=true` (the default for Docker and for `npm run setup`). The
passwords below are public — **change them or turn the demo off before real use** (§12).

| Who | Where | Details |
|---|---|---|
| **Platform super-admin** (owner of the whole platform) | <http://localhost:5174/admin/login> | Email `saas@hrmplus.test` · Password `1234abcd` |
| **Demo company Admin** ("Acme Ltd") | <http://localhost:5173/login> | Organisation `acme` · Email `acme@hrmplus.test` · Password `1234abcd` |

### A five-minute tour

1. **Super-admin:** sign in at `/admin/login` → open **Packages** (two sample packages exist).
2. **Act as a new company:** open <http://localhost:5174>, choose a package, fill in the signup form
   (pick any unused organisation name, e.g. `testco`) and submit. The application is now *Pending*.
3. **Super-admin:** open **Applications**, open the new one, click **Approve**. The system now creates the
   company's own database, adds the six roles and an Admin user.
4. **New company Admin:** sign in at <http://localhost:5173/login> with the organisation name you chose,
   the contact email from the form, and the temporary password `12345678`. You are asked to set a
   new password straight away.
5. **Explore:** add a department, add an employee, check in from the dashboard, apply for leave, create a
   job under **Jobs**.

The full story of what happens behind each step is in [SYSTEM_WORKFLOW.md](SYSTEM_WORKFLOW.md).

---

## 9. Updating to the latest version (git pull)

Always **stop, pull, rebuild, start**. Your data is kept.

**Docker (Path 1 or AWS):**

```bash
cd hrm_plus
git pull
docker compose up -d --build        # rebuilds changed parts; the migrate step applies new database changes
docker compose ps
```

**Node terminal (Path 2):**

```bash
cd hrm_plus
git pull
npm install                                                # new/changed libraries
npm run build --workspace=packages/shared                  # rebuild shared code
npm run prisma:generate --workspace=apps/backend           # refresh the database client
npm run migrate:control:deploy --workspace=apps/backend    # apply new control-DB changes
npm run dev
```

> **Developer notes.** New *tenant* database changes are applied to each company's database
> through `prisma/tenant/migrations`. Newly provisioned companies get the latest schema automatically.
> `git pull` stops with a message if you have uncommitted changes — commit or `git stash` them first.

**If you only have a new ZIP:** unzip it into a **new** folder, copy your old `.env` file(s) across, and
follow Path 1 or Path 2 again. To keep the Docker data, run `docker compose up -d --build` from the
**same project folder name** (Docker names the data volumes after the folder).

---

## 10. Stopping, resetting and backing up

| Goal | Docker | Node terminal |
|---|---|---|
| Stop, keep data | `docker compose stop` | `Ctrl + C` in the terminal(s); `docker compose stop mysql redis` if you used Docker for them |
| Start again | `docker compose up -d` | `npm run dev` |
| **Delete everything and start fresh** | `docker compose down -v` then `docker compose up -d --build` | `docker compose down -v`, then `npm run setup` |
| Reset only the demo logins | — | `npm run db:seed` |

**Back up the databases (Docker):**

```bash
docker compose exec mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases' > backup.sql
```

Uploaded files (photos, documents, payslips) live in the `uploads` Docker volume (or the folder
`apps/backend/uploads` in Path 2). Back those up too if they matter.

---

## 11. Troubleshooting

Find your message, apply the fix, run the command again.

| What you see | What it means | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` / `docker: command not found` | Docker Desktop is not running or not installed | Start **Docker Desktop**, wait until it says running, retry. |
| `port is already allocated` / `EADDRINUSE` | Another program uses `5173`, `5174`, `4000`, `3307` or `6379` | Stop that program, **or** change the host port (`MYSQL_HOST_PORT` / `REDIS_HOST_PORT` in `.env`). For a website port, stop whatever uses it. |
| `Access denied for user 'root'@...` | The password in `apps/backend/.env` does not match MySQL's | Fix the three password lines in §6.2. For Docker MySQL the password is `MYSQL_ROOT_PASSWORD` (default `hrmplusdev`). |
| `Can't reach database server at ...` | MySQL is not running, or wrong host/port | `docker compose ps` (Path 1/2A) or start your MySQL (2B). Docker MySQL is on **3307**, installed MySQL on **3306**. |
| `Cannot find module '.../generated/tenant'` or `@prisma/client did not initialize` | Database client not generated | `npm run prisma:generate --workspace=apps/backend` |
| `Cannot find module '@hrm-plus/shared'` | Shared code not built | `npm run build --workspace=packages/shared` |
| `Unsupported engine` / strange syntax errors on `npm install` | Node is older than 20 | Install Node 20+ and reopen the terminal (`node -v`). |
| Website loads but **login/API calls fail** (red errors in the browser, CORS) | The website was built pointing at the wrong API address | Check `VITE_API_BASE_URL` / `CORS_ORIGIN` in `.env`; then rebuild: `docker compose up -d --build`. On AWS run `deploy/aws/set-public-ip.sh <ip>` first. |
| Blank page after login on AWS | Same as above (address baked at build time) | `deploy/aws/set-public-ip.sh <ip>` then `docker compose up -d --build frontend saas-frontend`. |
| `ENOENT ... uploads/logos` when uploading a logo | The folder is missing (Path 2 only) | `mkdir -p apps/backend/uploads/logos` |
| Payslip PDF never appears | The worker is not running, or the browser for PDFs failed to install | Make sure the worker runs (`docker compose ps`, or `npm run dev:worker`). Re-run `npm install` without `PUPPETEER_SKIP_DOWNLOAD`. |
| "Generate with AI" fails | No AI key set | Add a key in the app under **Settings → AI**, or set `GROQ_API_KEY` (or another provider key) in `.env`. |
| Emails do not arrive | Test inbox is used when `SMTP_HOST` is empty | Find the preview link in the logs (`docker compose logs backend \| grep -i preview`), or set real `SMTP_*` values. |
| The `migrate` container shows an error | Database not ready or password mismatch | `docker compose logs migrate`; fix the cause, then `docker compose up -d`. A failed **demo seed** only warns and never blocks the API. |
| `npm test` hangs or fails to connect | Tests need a reachable MySQL with the `.env` password | Fix the password lines (§6.2), then run `npm test`. |
| `permission denied` on `deploy/aws/*.sh` | Script is not executable | `chmod +x deploy/aws/*.sh` |
| Everything is broken and you want a clean slate | — | Docker: `docker compose down -v` then `docker compose up -d --build`. Node: `docker compose down -v`, delete `node_modules`, then `npm run setup`. |

Still stuck? Copy the **first error line** from `docker compose logs backend` (or your terminal) when
asking for help.

---

## 12. Before real use: security checklist

The defaults are for learning and demos only.

- [ ] In `.env`, set strong, different values for `MYSQL_ROOT_PASSWORD`, `JWT_ACCESS_SECRET`,
      `JWT_REFRESH_SECRET`, `JWT_SAAS_ACCESS_SECRET` and `SETTINGS_ENCRYPTION_KEY` (at least 32
      characters). Use letters and numbers only for the MySQL password.
- [ ] Set `SEED_DEMO=false` so the public demo passwords (`1234abcd`) are not created. If they already
      exist, change those passwords or `docker compose down -v` and start again.
- [ ] Put **HTTPS** in front of the site (the AWS demo is plain HTTP). Use a domain and a TLS
      certificate (for example a load balancer, Caddy or nginx with Let's Encrypt).
- [ ] Never open ports `3307`/`3306` or `6379` to the internet (the Docker setup already keeps them on
      `127.0.0.1`).
- [ ] Restrict the SSH port (22) to your own IP address.
- [ ] Configure real SMTP (`SMTP_*`) so people receive their emails.
- [ ] Keep `.env` files **out of Git and out of ZIP files** (they are listed in `.gitignore`).
- [ ] Back up the database and uploads regularly (§10).

---


