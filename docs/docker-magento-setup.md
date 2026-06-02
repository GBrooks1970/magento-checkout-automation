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

## What `docker-compose.yml` does and does not do

`docker-compose.yml` (pinned to Mark Shust's docker-magento **v53.0.0** images)
brings up the **infrastructure**: nginx, PHP-FPM 8.4, MariaDB 11.4, Valkey/Redis,
OpenSearch 3, RabbitMQ — each with a healthcheck so `up --wait` blocks until ready.

It does **not** install Magento. After the services are healthy the `appdata`
volume is still empty; the install step below populates it.

## Prerequisites (one-off)

1. **Docker Desktop running**, with ≥6 GB RAM allocated (Settings → Resources).
2. **Magento Marketplace auth keys.** Create a free account at
   <https://commercemarketplace.adobe.com>, then *Access Keys* → generate a
   Magento 2 key pair. The **public key** is the Composer username, the **private
   key** is the Composer password. Keep these out of git.

## Bring-up sequence (local)

```bash
# 1. Start the infrastructure and wait for every service healthcheck to pass
docker compose up -d --wait

# 2. Authenticate Composer for the Magento repo (uses your Marketplace keys)
docker compose exec phpfpm composer config --global \
  http-basic.repo.magento.com <PUBLIC_KEY> <PRIVATE_KEY>

# 3. Download the Magento source WITH Luma sample data into the appdata volume
docker compose exec phpfpm composer create-project \
  --repository-url=https://repo.magento.com/ \
  magento/project-community-edition=2.4.7-p3 /var/www/html

# 4. Install Magento (DB/Redis/OpenSearch/RabbitMQ wiring; HTTP on :8080).
#    Mirrors upstream bin/setup-install, adapted to plain HTTP + localhost:8080.
docker compose exec phpfpm bin/magento setup:install \
  --base-url=http://localhost:8080/ \
  --db-host=db --db-name=magento --db-user=magento --db-password=magento \
  --admin-firstname=Test --admin-lastname=Admin \
  --admin-email=admin@example.com \
  --admin-user=admin --admin-password=Password123! \
  --language=en_US --currency=USD --timezone=America/New_York \
  --search-engine=opensearch --opensearch-host=opensearch --opensearch-port=9200 \
  --cache-backend=redis --cache-backend-redis-server=redis --cache-backend-redis-db=0 \
  --page-cache=redis --page-cache-redis-server=redis --page-cache-redis-db=1 \
  --session-save=redis --session-save-redis-host=redis --session-save-redis-db=2 \
  --amqp-host=rabbitmq --amqp-port=5672 --amqp-user=magento --amqp-password=magento \
  --use-rewrites=1 --cleanup-database --no-interaction

# 5. Deploy Luma sample data (the products/categories the features assume)
docker compose exec phpfpm bin/magento sampledata:deploy
docker compose exec phpfpm bin/magento setup:upgrade --no-interaction

# 6. Make catalogue/price/search changes visible on the storefront.
#    Without these, create-then-assert flakes — this is why CI runs them too.
docker compose exec phpfpm bin/magento indexer:reindex
docker compose exec phpfpm bin/magento cache:flush

# 7. Run the full suite against the local store
BASE_URL=http://localhost:8080 npm test
```

Tear down with `docker compose down -v` (the `-v` drops the volumes, so the next
bring-up is clean — which is the whole point of using Docker over the shared demo).

## Open decisions / validation risks

None of the below has been validated on a live daemon yet; confirm on first
bring-up and fold the findings back into this doc and the backlog.

- **HTTP vs HTTPS / port.** Upstream serves HTTPS on 8443 with a self-signed cert
  and an `nginx` config that may redirect `:8000` → HTTPS. The features and
  `BASE_URL` assume plain `http://localhost:8080`. If nginx forces a redirect,
  either install with `--base-url-secure` + trust the self-signed cert, or adjust
  the nginx vhost. **This is the most likely first-bring-up snag.**
- **Magento version pin.** `2.4.7-p3` is indicative; confirm it is the version the
  v53 images target and that `sampledata:deploy` resolves against it.
- **CI auth keys.** The two Marketplace keys must be added as repository secrets
  (e.g. `MAGENTO_PUBLIC_KEY` / `MAGENTO_PRIVATE_KEY`) and injected at the Composer
  config step. `.github/workflows/ci.yml` currently has a skeleton bring-up that
  predates this runbook — reconcile it with steps 1–7 once they pass locally.
- **CI runtime.** A from-scratch install per run is ~30 min. Consider caching the
  Composer/Magento layers or pre-baking an installed image to keep CI tractable
  before wiring this into every push.

## Once the store is up — the items it unblocks

- **#10** cart-count / subtotal assertions (deterministic on a clean store).
- The multi-step KO.js checkout flow and `CheckoutPage.placeOrderButton`
  (only ever fixed by reasoning; never run on the shared demo).
- **#3** API-driven Background via `MagentoApiClient` (needs admin API access).
- **#2** the `@deferred` `payment-failure.feature` (needs a test payment gateway).
- **#4** publishing the Serenity living documentation from a genuinely green run.
