# Standing up the Dockerised Magento target (backlog #1)

This is the bring-up runbook for the local/CI Magento instance the full suite runs
against. It exists because, as the live smoke test established, the order-placing
and checkout assertions need a clean, resettable store — a shared public demo
cannot provide deterministic cart state.

> **Read this before assuming Docker is a quick win.** The earlier handover notes
> framed item #1 as "pin a known-good image and go." That is not accurate, and the
> research below is the correction. There is **no official pull-and-run Magento
> image with Luma sample data**. A working store is produced by *installing*
> Magento into a volume at run time, which:
>
> - requires **Adobe Commerce Marketplace authentication keys** (a free account,
>   but a real secret that must be supplied locally and as CI secrets);
> - pulls the full Magento codebase via Composer and deploys sample data, taking
>   **~20–40 minutes** on a first bring-up;
> - needs **≥6 GB of RAM** allocated to Docker.
>
> This is the genuine cost of the green-CI-badge claim. It is worth doing, but it
> is a session of real work, not a config tweak.
>
> **That cost has since been paid once and snapshotted:** the install was baked
> into two public GHCR images, so the usual local bring-up is now a pull, not an
> install — see "The fast path" below. The keys/RAM/time warnings above apply
> only to the from-scratch route.

> **Validated end-to-end on 2026-06-03.** The sequence below is no longer
> theoretical — it brought up a working store (Magento 2.4.8, 2040 Luma products,
> HTTP 200 on `http://localhost:8080`) on a Windows + Docker Desktop host. The
> steps and version pins here reflect what actually worked, including four snags
> the first draft did not anticipate (flagged inline).

## What `docker-compose.yml` does and does not do

`docker-compose.yml` (pinned to Mark Shust's docker-magento **v53.0.0** images)
brings up the **infrastructure**: nginx, PHP-FPM 8.4, MariaDB 11.4, Valkey/Redis,
OpenSearch 3, RabbitMQ — each with a healthcheck so `up --wait` blocks until ready.
The `app` (nginx) service also bind-mounts `docker/nginx/default.conf`, which
overrides the upstream vhost so the storefront is served over **plain HTTP on
:8080** (the stock image redirects `:8000` → HTTPS:8443 with a self-signed cert —
see snag 3 below).

It does **not** install Magento. After the services are healthy the `appdata`
volume is still empty; the install step below populates it.

## Prerequisites (one-off — from-scratch install route only)

1. **Docker Desktop running**, with ≥6 GB RAM allocated (Settings → Resources).
2. **Magento Marketplace auth keys.** Create a free account at
   <https://commercemarketplace.adobe.com>, then *Access Keys* → generate a
   Magento 2 key pair. The **public key** is the Composer username, the **private
   key** is the Composer password. Keep these out of git.

## The fast path — pull the pre-baked images (no Marketplace keys needed)

Since the CI images went public, the from-scratch install below is **optional**
for local work. The same overlay CI uses brings up the complete, ready-to-test
store — Luma sample data, qty-counter config, 2FA disabled, the decline-payment
module installed, test admin credentials baked in:

```bash
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --wait
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/   # expect 200
BASE_URL=http://localhost:8080 npm test                           # full suite
```

First start takes ~5–10 min (image pull + DB restore + OpenSearch boot); no
secrets are required — both GHCR packages are public. Tear down with
`docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v` for a
clean slate, or leave the volumes in place to restart instantly.

Use the install sequence below only when you need to *change* what is baked into
the images (Magento version, sample data, a config step) — and then re-run
`bake.yml` so CI picks the change up.

## Bring-up sequence (local, from scratch) — validated 2026-06-03

> **Windows / Git-Bash note (snag 1).** A bare Unix path argument like
> `/var/www/html` passed to `docker compose exec` is rewritten by MSYS path
> conversion into `C:/Program Files/Git/var/www/html`, so `create-project` lands
> the source in the wrong place. Prefix the whole command with
> `MSYS_NO_PATHCONV=1`, or wrap the inner command in `sh -c '…'` (absolute paths
> inside a quoted script are not converted). On macOS/Linux this does not apply.

```bash
# 1. Start the infrastructure and wait for every service healthcheck to pass
docker compose up -d --wait

# 2. Place the Marketplace keys as a project-root auth.json (gitignored).
#    NB (snag 2): the GLOBAL composer auth alone is not enough — sampledata:deploy
#    spawns a child `composer` process scoped to the project that only reads the
#    project-root auth.json. Put it in BOTH the composer home and the project root.
#    auth.json shape:
#      { "http-basic": { "repo.magento.com":
#          { "username": "<PUBLIC_KEY>", "password": "<PRIVATE_KEY>" } } }
docker compose cp auth.json phpfpm:/var/www/.config/composer/auth.json

# 3. Download Magento 2.4.8 (the GA that supports PHP 8.4 — 2.4.7 fails the
#    platform check against the v53 PHP-8.4 image) into the appdata volume.
MSYS_NO_PATHCONV=1 docker compose exec -T phpfpm sh -c \
  'composer create-project --repository-url=https://repo.magento.com/ \
   "magento/project-community-edition=2.4.8" /var/www/html'
# Then copy the same auth.json to the project root for sampledata (snag 2):
docker compose exec -T phpfpm sh -c \
  'cp /var/www/.config/composer/auth.json /var/www/html/auth.json'

# 4. Install Magento (DB/Redis/OpenSearch/RabbitMQ wiring; HTTP on :8080).
MSYS_NO_PATHCONV=1 docker compose exec -T phpfpm sh -c 'cd /var/www/html && php bin/magento setup:install \
  --base-url=http://localhost:8080/ \
  --db-host=db --db-name=magento --db-user=magento --db-password=magento \
  --admin-firstname=Test --admin-lastname=Admin --admin-email=admin@example.com \
  --admin-user=admin --admin-password=Password123! \
  --language=en_US --currency=USD --timezone=America/New_York \
  --search-engine=opensearch --opensearch-host=opensearch --opensearch-port=9200 \
  --cache-backend=redis --cache-backend-redis-server=redis --cache-backend-redis-db=0 \
  --page-cache=redis --page-cache-redis-server=redis --page-cache-redis-db=1 \
  --session-save=redis --session-save-redis-host=redis --session-save-redis-db=2 \
  --amqp-host=rabbitmq --amqp-port=5672 --amqp-user=magento --amqp-password=magento \
  --use-rewrites=1 --cleanup-database --no-interaction'

# 5. Generate the nginx app config (snag 4): a manual install ships only
#    nginx.conf.sample. Our vhost (docker/nginx/default.conf) includes
#    /var/www/html/nginx.conf, which must be created from the sample, then reload.
docker compose exec -T phpfpm sh -c 'cp /var/www/html/nginx.conf.sample /var/www/html/nginx.conf'
docker compose exec -T app sh -c 'nginx -t && nginx -s reload'

# 6. Deploy Luma sample data, apply it, reindex, flush cache
MSYS_NO_PATHCONV=1 docker compose exec -T phpfpm sh -c 'cd /var/www/html && \
  php bin/magento sampledata:deploy && \
  php bin/magento setup:upgrade --no-interaction && \
  php bin/magento indexer:reindex && \
  php bin/magento cache:flush'

# 6b. Make the header cart counter show total item QUANTITY (not distinct-item
#     count), so "cart should contain N items" matches the feature semantics
#     (e.g. quantity 3 -> counter shows 3). Required for the cart-quantity scenario.
docker compose exec -T phpfpm sh -c 'cd /var/www/html && \
  php bin/magento config:set checkout/cart_link/use_qty 1 && php bin/magento cache:flush'

# 6c. Disable mandatory admin 2FA so the REST admin-token endpoint works.
#     TEST TARGET ONLY — Magento 2.4.x ships compulsory admin two-factor auth
#     (Magento_TwoFactorAuth + Magento_AdminAdobeImsTwoFactorAuth). Until 2FA is
#     configured, BOTH the admin UI login AND POST /rest/V1/integration/admin/token
#     return "Please ask an administrator with sufficient access to configure 2FA
#     first" — which blocks API-driven test setup (backlog #3). On this disposable,
#     local-only store we disable the modules; NEVER do this on a public/production
#     instance. Reverse with `module:enable` + `setup:upgrade`. See
#     docs/admin-api-token-guide.md for the full rationale and token walkthrough.
docker compose exec -T phpfpm sh -c 'cd /var/www/html && \
  php bin/magento module:disable Magento_TwoFactorAuth Magento_AdminAdobeImsTwoFactorAuth && \
  php bin/magento cache:flush'

# 6d. Install the in-repo test-fixture modules. REQUIRED for a full-suite run:
#     - Portfolio_DeclinePayment (ADR-0005): the always-declining payment method
#       payment-failure.feature needs — without it the suite times out waiting
#       for label[for="declinepayment"].
#     - Portfolio_CartSeed (ADR-0006): the adopt endpoint the API-seeded cart
#       Backgrounds need — without it the seeding step 404s at
#       /cartseed/cart/adopt.
#     (Mirrors the same step in .github/workflows/bake.yml.)
docker compose exec -T phpfpm sh -c 'mkdir -p /var/www/html/app/code'
docker compose cp app/code/Portfolio phpfpm:/var/www/html/app/code/Portfolio
docker compose exec -T phpfpm sh -c 'cd /var/www/html && \
  php bin/magento module:enable Portfolio_DeclinePayment Portfolio_CartSeed && \
  php bin/magento setup:upgrade --no-interaction && \
  php bin/magento config:set payment/declinepayment/active 1 && \
  php bin/magento config:set cartseed/general/active 1 && \
  php bin/magento cache:flush'

# 7. Sanity check, then run the suite
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/   # expect 200
BASE_URL=http://localhost:8080 npm run test:smoke                 # read-only subset
BASE_URL=http://localhost:8080 npm test                           # full suite (places orders)
```

Tear down with `docker compose down -v` (the `-v` drops the volumes, so the next
bring-up is clean — which is the whole point of using Docker over the shared demo).

## The four snags, and which are now solved in-repo

1. **Git-Bash path mangling** — operational; use `MSYS_NO_PATHCONV=1` (above).
2. **Sample-data auth 401** — child composer needs project-root `auth.json` (above).
3. **HTTPS redirect** — *solved in-repo*: `docker/nginx/default.conf` (mounted by
   `docker-compose.yml`) serves plain HTTP on :8000 == host :8080, no SSL.
4. **Missing `nginx.conf`** — operational; copy from `.sample` and reload (step 5).

## Still open

Nothing — the three items this section originally tracked are all closed:

- **CI auth keys.** ✅ The Marketplace keys live as secrets on the `bake` GitHub
  environment and are used only by `bake.yml`. `ci.yml` needs no Magento secrets —
  it pulls the public pre-baked images (see the CI strategy section below).
- **CI runtime.** ✅ Solved by the pre-baked GHCR images: CI pulls the installed
  store (~3–5 min) instead of running the ~30–40 min install.
- **Test-isolation defect (backlog #10).** ✅ Fixed in `src/hooks/browser.hooks.ts`:
  the `Before` hook resets cookies and local/session storage per scenario (a Magento
  guest cart is keyed on the session cookie), and `AddToCart`'s success-message wait
  was raised past Serenity's 5 s default with `Wait.upTo(15 s)`.

## Once the store is up — the items it unblocked

All complete (see `docs/backlog.md` for evidence):

- **#10** cart-count / subtotal assertions — deterministic on the clean store. ✅
- The multi-step KO.js checkout flow and `CheckoutPage.placeOrderButton` —
  validated end-to-end (`@placesOrder` 4/4). ✅
- **#3** API-driven Background via `MagentoApiClient`. ✅
- **#2** `payment-failure.feature` — active via the `Portfolio_DeclinePayment`
  module (ADR-0005); `@deferred` removed. ✅
- **#4** Serenity living documentation published from a green run. ✅

---

## CI strategy — pre-baked GHCR images (backlog #4)

A from-scratch install takes ~30–40 minutes: too slow for every push. The
solution is two pre-baked images that snapshot the installed store state and are
stored in GHCR. CI pulls them (~3–5 min) instead of running the install sequence,
keeping the total pipeline under 25 minutes.

### The two images

| Image | Based on | Contains |
|---|---|---|
| `ghcr.io/gbrooks1970/magento-checkout-automation/magento-store-app:2.4.8-b<run_number>` | `markoshust/magento-php:8.4-fpm-2` | Full `/var/www/html` tree: Magento source, vendor, generated classes, `env.php`, 2FA disabled (step 6c), qty-counter set (step 6b) |
| `ghcr.io/gbrooks1970/magento-checkout-automation/magento-store-db:2.4.8-b<run_number>` | `mariadb:11.4` | `magento-db.sql.gz` in `/docker-entrypoint-initdb.d/` — MariaDB auto-restores on first start |

Each bake run tags both images uniquely with its workflow run number
(`:2.4.8-b<run_number>`); the tag currently in force is whatever
`docker-compose.ci.yml` references.

### How seeding works in CI

Docker has a built-in behaviour: when a named volume is first created and the
container image has content at the mount point, Docker copies the image's
content into the volume. So `docker compose up` with an empty `appdata` volume
auto-populates it from `magento-store-app`'s `/var/www/html` without any extra
step. MariaDB's Docker entrypoint does the equivalent for the database: it
restores `magento-db.sql.gz` from `/docker-entrypoint-initdb.d/` before
accepting connections, so by the time the healthcheck passes the full schema and
Luma data are present.

### Building the images (one-time)

Images are built by `.github/workflows/bake.yml` (manual trigger). It:
1. Runs `docker compose up -d --wait` on the Actions runner
2. Executes the full install sequence above (steps 2–6c) — ~40 min
3. Tars `/var/www/html` from the running `phpfpm` container; builds `store-app`
4. Dumps the database; builds `store-db`
5. Pushes both to GHCR under the unique `:2.4.8-b<run_number>` tag and prints
   their digests in the run summary (see "Tag policy" below)

Required secrets on the `bake` GitHub environment:
`MAGENTO_PUBLIC_KEY` / `MAGENTO_PRIVATE_KEY` (Adobe Commerce Marketplace keys).
`ci.yml` needs neither — it uses the hardcoded test-target admin defaults.

After `bake.yml` completes, set both packages to **public** in GitHub (profile →
Packages → Package settings → Change visibility) so `ci.yml` can pull without
authentication.

### Rebuild the images when

- The Magento version pin changes
- A `bin/magento config:set` or `module:disable` step is added or changed
- The `sampledata:deploy` content changes (e.g. you add a custom fixture)

### Tag policy — unique tags, promotion by PR (R-06b, 2026-06-12)

Bakes used to overwrite a single static `:2.4.8` tag in place, which meant a
re-bake silently changed what every subsequent CI run tested. The policy is
now:

- **Every bake pushes a unique tag**: `:2.4.8-b<run_number>` (the bake
  workflow's run number). No bake ever overwrites a published tag.
- **`bake.yml` prints the pushed images' digests in its run summary** —
  provenance on record. CI consumes the tag, never the digest hex
  (digest-pinning the overlay was considered and rejected: opaque diffs, and
  it defends against a tag-reuse threat that does not exist in a
  single-maintainer registry).
- **Adopting a new bake is a one-line-per-service PR** updating the two
  `image:` references in `docker-compose.ci.yml`. That overlay is the single
  source of truth: `ci.yml`'s preflight and pull steps parse the image
  references out of it, so nothing else needs editing.
- **The bare `:2.4.8` tag is no longer published.** The last images pushed
  under it remain in GHCR as a historical artefact; nothing references them.
