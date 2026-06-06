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

## Prerequisites (one-off)

1. **Docker Desktop running**, with ≥6 GB RAM allocated (Settings → Resources).
2. **Magento Marketplace auth keys.** Create a free account at
   <https://commercemarketplace.adobe.com>, then *Access Keys* → generate a
   Magento 2 key pair. The **public key** is the Composer username, the **private
   key** is the Composer password. Keep these out of git.

## Bring-up sequence (local) — validated 2026-06-03

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

- **CI auth keys.** Add the two Marketplace keys as repository secrets
  (`MAGENTO_PUBLIC_KEY` / `MAGENTO_PRIVATE_KEY`) and inject them at the auth step.
  `.github/workflows/ci.yml` carries the placeholders; flesh out its install step
  from steps 3–6 above.
- **CI runtime.** A from-scratch install is ~30 min. Cache the Composer/Magento
  layers or pre-bake an installed image before running this on every push.
- **Test-isolation defect (feeds backlog #10).** The first green-store run revealed
  that guest-cart state **accumulates across scenarios** (cart count read 3 where 2
  expected, 8 where 1 expected) — a real test-isolation bug, NOT the "shared-demo
  contamination" the v3/v4 notes assumed. Plus `AddToCart`'s success-message wait
  uses Serenity's 5 s default (not the 30 s Cucumber `setDefaultTimeout`) and times
  out on a cold first add. Both must be fixed for a green run; see backlog #10.

## Once the store is up — the items it unblocks

- **#10** cart-count / subtotal assertions (deterministic on a clean store).
- The multi-step KO.js checkout flow and `CheckoutPage.placeOrderButton`
  (only ever fixed by reasoning; never run on the shared demo).
- **#3** API-driven Background via `MagentoApiClient` (needs admin API access).
- **#2** the `@deferred` `payment-failure.feature` (needs a test payment gateway).
- **#4** publishing the Serenity living documentation from a genuinely green run.
