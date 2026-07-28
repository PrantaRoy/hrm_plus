# HRM PLUS — Postman Collection

`HRM_PLUS.postman_collection.json` covers every API endpoint implemented so far, organized into four folders matching the two frontends and how their traffic is split between public and protected:

- **Saas Backend** — protected super-admin endpoints (auth, packages, application review/approval, company management, stats). Needs a saas-admin access token.
- **Saas Frontend** — public, unauthenticated endpoints the landing/signup pages call directly (list packages, submit an application).
- **Tenant Frontend** — the tenant login flow (check-email, login, me, change password).
- **Tenant Backend** — protected tenant-data endpoints (employees, departments). Needs a tenant access token.

## Import

Postman → **Import** → select `HRM_PLUS.postman_collection.json`. No separate environment file needed — all variables (base URL, demo credentials, and the ids/tokens captured automatically as you go) live on the collection itself.

## Demo credentials already filled in

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:4000` |
| `saasAdminEmail` / `saasAdminPassword` | `owner@hrmplus.test` / `SuperAdmin123!` |
| `tenantSlug` | `acme` |
| `tenantEmail` / `tenantPassword` | `admin@acme.hrmplus.test` / `PUxoBkUueckZ` |

These match the seeded local dev database — see the root `README.md` → "Demo login details" for the full list, including how to create a brand new tenant through the actual signup/approval flow instead of the CLI.

## Recommended run order

The collection is self-chaining — login/create requests save tokens and ids (`saasAccessToken`, `tenantAccessToken`, `packageId`, `applicationId`, `generatedTenantSlug`, `saasTenantId`, etc.) into collection variables as you go, so later requests don't need manual copy-pasting. A few requests depend on ones in a *different* folder having run first:

1. **Saas Backend → Auth → Saas Admin Login** (needed for every other Saas Backend request)
2. **Saas Backend → Packages (Admin) → Create Package** (creates the package used for signup)
3. **Saas Frontend → List Public Packages**, then **Submit Application** (creates a `Pending` application against that package)
4. Back in **Saas Backend → Applications (Admin)**: List / Get / Update / Approve (or Reject) — these act on the application from step 3
5. **Saas Backend → Tenants (Admin) → List Tenants**, then Update / Toggle Status — these only ever act on the tenant Approve Application just created (matched by slug, never "whichever tenant happens to be first"), so they can't accidentally touch a pre-existing demo tenant like `acme`
6. **Tenant Frontend** and **Tenant Backend** are independent of all of the above — they exercise the pre-existing `acme` demo tenant directly and can be run any time

Each request's description notes when it depends on something else having run first.

## A couple of intentional design choices worth knowing about

- **Delete Package** targets a disposable "scratch" package created by the request right before it (**Create Scratch Package**), not the package used for signup — so it always cleanly succeeds (204) without breaking the signup flow above it.
- **Tenant Frontend → Change Password** is immediately followed by **Revert Password**. Change Password genuinely changes the real password on whatever tenant `{{tenantSlug}}` points at (by default, the persistent `acme` demo tenant) — Revert Password restores it, so running this folder repeatedly doesn't drift the demo credentials out of sync with what's documented in the main README.
