# Admin API Token Guide — Magento 2.4.x

**Audience:** Engineers and AI agents wiring API-driven test setup against the Dockerised
Magento store (backlog #3). **Purpose:** explain, from first principles, what a Magento admin
API token *is*, the two ways to get one, the mandatory-2FA gotcha that blocks both on 2.4.x,
and exactly how to mint and use a token for the "API setup, UI assertion" pattern (ADR-0003).

> **TL;DR.** `POST /rest/V1/integration/admin/token` with admin username+password returns a
> bearer token; send it as `Authorization: Bearer <token>` on REST calls. On Magento 2.4.x this
> is blocked by compulsory admin 2FA until you disable the 2FA modules (test target only). All
> commands below are verified against this repo's store.

---

## 1. Why a token at all? (the pattern it serves)

This suite follows **API setup, UI assertion** (ADR-0003): test *preconditions* — "a product
named X priced at Y exists" — are established/verified through Magento's REST API, while the
*behaviour under test* (guest checkout) is driven through the UI. API setup is faster, less
brittle, and doesn't itself depend on the UI it's meant to support.

Magento's REST API is authenticated. Almost every useful admin-scoped call (catalog, orders,
customers) requires a **token** proving you act as an authorised admin. So before #3 can replace
the UI-fallback Background step, we need a working admin token. Hence this guide.

---

## 2. The two kinds of token

| | **Admin bearer token** | **Integration access token** |
|---|---|---|
| Endpoint / source | `POST /rest/V1/integration/admin/token` | Admin UI → System → Integrations |
| Auth input | admin username + password | created/activated in the UI |
| Lifetime | **expires** (default **4h**, configurable) | does not expire until revoked |
| Best for | **automated test runs** (mint fresh at startup) | CI secrets / long-lived service creds |
| Revocation | expires on its own | revoke the integration |

**For this suite → bearer token.** #3's whole point is that the suite mints its own short-lived
token from credentials in env vars at startup. An integration token is the right tool only if/when
CI (#4) needs a token baked into a secret. (Note: creating an integration *also* requires admin-UI
login, which 2FA gates too — see §4 — so on 2.4.x neither route works until 2FA is handled.)

---

## 3. The store's admin credentials

Set during `setup:install` (see `docs/docker-magento-setup.md` step 4):

```
username: admin
password: Password123!
```

These are **local, disposable test-target credentials** — safe to commit to docs and to use in a
`.env.example`. They are *not* production secrets. A real token, by contrast, must never be
committed (treat it like a password).

---

## 4. The 2.4.x gotcha: mandatory admin 2FA

On a fresh Magento **2.4.x** install, two modules are enabled by default:

- `Magento_TwoFactorAuth`
- `Magento_AdminAdobeImsTwoFactorAuth`

They make admin two-factor authentication **compulsory**. Until 2FA is configured for the admin,
*both* of these fail:

- `POST /rest/V1/integration/admin/token`
- the admin UI login at `/admin`

…with HTTP 400 and:

```json
{ "message": "Please ask an administrator with sufficient access to configure 2FA first" }
```

This is expected behaviour, not a misconfiguration. For real deployments you would configure an
authenticator (Google Authenticator, Duo, etc.). For an **automated test target** that defeats the
purpose — you can't feed a rotating TOTP code into a headless test run — so the standard, documented
approach is to **disable the 2FA modules**:

```bash
# TEST TARGET ONLY — never on a public/production store.
docker compose exec -T phpfpm sh -c 'cd /var/www/html && \
  php bin/magento module:disable Magento_TwoFactorAuth Magento_AdminAdobeImsTwoFactorAuth && \
  php bin/magento cache:flush'
```

Reversible at any time with `module:enable Magento_TwoFactorAuth Magento_AdminAdobeImsTwoFactorAuth`
followed by `php bin/magento setup:upgrade`. This step is recorded in the bring-up runbook as
step 6c (`docs/docker-magento-setup.md`).

> **Why this is safe here and not elsewhere:** the store is single-user, local-only, ephemeral, and
> exists solely to be tested against. Disabling 2FA on any internet-reachable or shared instance
> would expose admin login to credential-stuffing — don't.

---

## 5. Minting and using a bearer token

After 2FA is disabled, the token mints cleanly. Two equivalent forms:

### PowerShell (Windows host)

```powershell
$body  = @{ username = 'admin'; password = 'Password123!' } | ConvertTo-Json
$token = Invoke-RestMethod -Uri 'http://localhost:8080/rest/V1/integration/admin/token' `
  -Method Post -ContentType 'application/json' -Body $body
$env:MAGENTO_ADMIN_TOKEN = $token            # hand off to the suite via env var

# Use it:
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Headers $headers `
  -Uri 'http://localhost:8080/rest/V1/products?searchCriteria[pageSize]=1'
```

### bash / curl

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/rest/V1/integration/admin/token \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Password123!"}' | tr -d '"')

curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8080/rest/V1/products?searchCriteria[pageSize]=1'
```

The token is a ~150-char JWT (it starts `eyJ…`, which is base64 `{"…`). It is a **secret** —
keep it in an env var; never echo it into logs, commits, or the Serenity report.

### The lookup the Background step actually needs

To verify "a product named *X* exists" — a `like` filter on `name`:

```
GET /rest/V1/products
  ?searchCriteria[filterGroups][0][filters][0][field]=name
  &searchCriteria[filterGroups][0][filters][0][value]=%Hoodie%
  &searchCriteria[filterGroups][0][filters][0][conditionType]=like
  &searchCriteria[pageSize]=1
```

The response's `items[0].name` and `items[0].price` are what `verifyProductIsAvailable(name, price)`
asserts against.

---

## 6. Verified evidence (2026-06-06, this store)

| Call | Result |
|---|---|
| Mint token | ✅ 151-char JWT (`eyJraW…`) |
| `GET /V1/products?pageSize=1` with bearer | ✅ HTTP 200, `total_count` = **2040** (full Luma catalog) |
| `name like %Hoodie%` | ✅ 198 matches; first = *Chaz Kangeroo Hoodie-XS-Black*, price 52 |

The token expiry was the default 4 hours — long enough for any single test run; the suite simply
mints a fresh one each startup.

---

## 7. How this wires into the suite (backlog #3)

Once the token path works, #3 replaces the UI fallback:

1. **Env vars** — provide `MAGENTO_ADMIN_USERNAME` / `MAGENTO_ADMIN_PASSWORD` (preferred: the
   suite mints its own short-lived token at startup) or a pre-minted `MAGENTO_ADMIN_TOKEN`.
   Document them in the README and CI env (#3 success criteria).
2. **`MagentoApiClient`** (`src/api/MagentoApiClient.ts`) — implement
   `verifyProductIsAvailable(name, price)` using the `name like` query above; have the client
   obtain the bearer token (call the token endpoint, or read `MAGENTO_ADMIN_TOKEN`).
3. **Actor ability** — add `CallAnApi.at(BASE_URL)` to the cast in `src/hooks/browser.hooks.ts`.
4. **Background step** — change `src/step-definitions/background.steps.ts` from UI navigation to
   `MagentoApi.verifyProductIsAvailable(name, price)`.
5. **ADR-0003** — record the concrete endpoints and response shapes used.

The result is the headline portfolio signal: preconditions established via API, behaviour asserted
via UI, no UI fallback in the Background.

---

## 8. Security checklist

- ✅ 2FA disabled **only** on this local, disposable test target — documented in the runbook (step 6c).
- ✅ Admin *credentials* are test-only (`admin` / `Password123!`) — safe in docs / `.env.example`.
- ❌ Never commit a real **token** — env vars only; treat as a password.
- ❌ Never disable 2FA on a public, shared, or production store.
- ↩️ Re-enable any time: `module:enable Magento_TwoFactorAuth Magento_AdminAdobeImsTwoFactorAuth && php bin/magento setup:upgrade`.

---

*Written 2026-06-06 to unblock backlog #3. Verified against the Dockerised Magento 2.4.8 store
(`http://localhost:8080`). See `docs/docker-magento-setup.md` (step 6c) and ADR-0003.*
