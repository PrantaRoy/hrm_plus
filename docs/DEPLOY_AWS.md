# Deploy to AWS (single EC2 instance, no domain)

Runbook for a short-lived academic/demo deployment: one EC2 instance running the full
`docker compose` stack from this repo (MySQL, Redis, API, worker, both frontends). No RDS,
no ElastiCache, no ALB, no Route 53 — all of that is unnecessary cost/complexity for a private,
few-day demo. See the repo's "Run with Docker" README section for what the stack itself does;
this doc is only about getting a box to run it on.

Cost: roughly $4–8 for 7 days on a `t3.small`/`t3.medium` (see the estimate your convenor-facing
notes/chat already have) — stop the instance between sessions to pay only for hours actually used.

## 1. Launch the instance

Console or CLI, your choice. Either way:
- **AMI:** Ubuntu 22.04 or 24.04 LTS (x86_64).
- **Instance type:** `t3.medium` recommended (4 GB RAM — MySQL + Redis + Node + headless Chromium
  all run on one box). `t3.small` (2 GB) works but is tighter; `deploy/aws/user-data.sh` adds a
  swapfile as headroom either way.
- **Storage:** 30 GB gp3 is plenty.
- **User data:** paste in `deploy/aws/user-data.sh` (console: "Advanced details" → "User data").
  It installs Docker + Compose and a swapfile; it does not touch the app.
- **Key pair:** create/select one you can SSH in with.
- **Security group inbound rules:**

  | Port | Source | Purpose |
  |---|---|---|
  | 22 | your IP only | SSH |
  | 4000 | your IP (or `0.0.0.0/0` if others need it, e.g. your convenor) | API |
  | 5173 | same as above | Tenant portal |
  | 5174 | same as above | SaaS admin portal |

  Do **not** open 3306/6379 — `docker-compose.yml` already keeps MySQL bound to the
  instance's `localhost` only and never publishes Redis.

- **Elastic IP:** allocate one and associate it with the instance. Free while attached to a
  running instance; keeps the URLs you bake into the frontend stable across stop/start (a plain
  public IP changes on every stop/start, which would silently break the baked-in frontend URLs
  until you rebuild).

## 2. SSH in and get the app onto the box

```bash
ssh ubuntu@<elastic-ip>
# bootstrap can take ~30-60s after first boot; confirm it finished:
cat /var/log/hrmplus-bootstrap-done

git clone <your-repo-url> hrm_plus   # or: scp -r the repo up if it isn't pushed anywhere
cd hrm_plus
```

## 3. Configure and start

```bash
cp .env.example .env
deploy/aws/set-public-ip.sh <elastic-ip>   # rewrites the VITE_*/CORS_ORIGIN URLs to the IP
# then open .env and set real values for: MYSQL_ROOT_PASSWORD, JWT_*_SECRET,
# SETTINGS_ENCRYPTION_KEY (min 32 chars) — do not deploy with the .env.example defaults

docker compose up -d --build
docker compose ps                 # wait for mysql/redis/backend/frontend/saas-frontend healthy
docker compose logs -f migrate    # confirm migrations + demo seed succeeded
```

Visit:
- Tenant portal: `http://<elastic-ip>:5173` (demo login: `acme@hrmplus.test` / `1234abcd`)
- SaaS admin: `http://<elastic-ip>:5174` (demo login: `saas@hrmplus.test` / `1234abcd`)
- API health: `http://<elastic-ip>:4000/health`

No domain is used, so `PUBLIC_TENANT_BASE_DOMAIN` / `VITE_PUBLIC_TENANT_BASE_DOMAIN` stay at their
defaults and tenant subdomain routing is not in play — the app falls back to
`VITE_DEFAULT_TENANT_SLUG` (the `acme` demo tenant), which is exactly what a single-tenant demo
needs.

## 4. Changing the URL later

Because `VITE_*` values are baked into the frontend bundle at build time, any change to the
instance's IP (e.g. you didn't use an Elastic IP and it changed) needs:

```bash
deploy/aws/set-public-ip.sh <new-ip>
docker compose up -d --build frontend saas-frontend
```

## 5. Tearing down

To stop paying for compute without losing data (DB/uploads live in Docker volumes on the
instance's EBS volume):

```bash
docker compose stop        # or: stop the instance in the EC2 console
```

To fully delete everything when the demo is over:

```bash
docker compose down -v     # wipes the mysql-data/redis-data/uploads volumes too
```
Then terminate the instance and release the Elastic IP (an unassociated Elastic IP is billed).

## Caveats
- Plain HTTP, no TLS — fine for a private demo link, not for anything public-facing.
- The demo seed uses known passwords (`1234abcd`) — set `SEED_DEMO=false` in `.env` if the link
  could reach anyone beyond your convenor.
- This is a single box with no redundancy — acceptable for a 7-day demo, not for production.
