# =============================================================================
# SLU OrgDesk - containerization and GCP deployment guide
# =============================================================================

Two images, two Cloud Run services, one browser origin.

```
                      ┌─────────────────────── Cloud Run: orgdesk-web ─────────┐
   Browser ──HTTPS──► │  Apache + mod_php (PHP 8.3 + mongodb extension)       │
                      │    /                        index.php                 │
                      │    /public/**               static frontend           │
                      │    /php-server/routes/*.php PHP JSON API              │
                      │    /uploads/**              .htaccess -> redirect.php  │
                      │    /api/**  ──reverse proxy──┐                        │
                      └──────────────────────────────│────────────────────────┘
                                                     │ http (X-Internal-Auth)
                      ┌──────────────────────────────▼── Cloud Run: orgdesk-api ┐
                      │  Node.js 20 / Express                                   │
                      │    /api/users /api/organizations /api/stats             │
                      │    /api/upload_logo   (multer -> public/images/orgs)    │
                      │    /uploads/**        (guarded)                         │
                      └─────────────────────────────────────────────────────────┘
                                       │                       │
                        Cloud Storage buckets          MongoDB Atlas (external)
                        (uploads, org logos)           via MONGO_URI secret
```

**Why one origin matters.** The app keeps two server-side sessions: PHP's
`PHPSESSID` and Express's `connect.sid`. Proxying `/api/*` through Apache keeps
both cookies first-party, which avoids `SameSite=None`/third-party-cookie
restrictions and removes the old hardcoded `:5000` dependency in
`public/admin/script/config.js`.

---

## 1. Files added

| Path | Purpose |
|---|---|
| `Dockerfile.web` | Apache + mod_php image, compiles the `mongodb` PECL extension |
| `Dockerfile.node` | Multi-stage Node 20 image for the Express API |
| `docker-compose.yml` | Local two-container topology with shared upload volumes |
| `docker/web-entrypoint.sh` | Binds Apache to `$PORT`, renders the vhost, fixes volume ownership |
| `docker/node-entrypoint.sh` | Fixes volume ownership, drops privileges to `node` |
| `docker/apache/orgdesk.conf.template` | Virtual host incl. the `/api/*` proxy and HTTPS detection |
| `docker/php/php-custom.ini` | Upload limits (50 MB), session lifetime, stderr logging |
| `deploy/cloudbuild.yaml` | Builds and pushes both images |
| `deploy/deploy.sh` | End-to-end Cloud Run provisioning and deployment |
| `.dockerignore`, `.gcloudignore` | Keep build contexts small and secrets out |
| `.env.example` | Template for all runtime configuration |

## 2. Code changes made for containers

These were required: the previous source hardcoded credentials and a port that
cannot exist on Cloud Run.

| File | Change |
|---|---|
| `php-server/database/dbAccess.php` | Atlas URI and database name read from `MONGO_URI` / `MONGO_DB`; falls back to a project-root `.env` file. Hardcoded credentials removed. |
| `php-server/models/Organization.php` | `require` → `require_once` for `dbAccess.php` (prevents a redeclaration fatal). |
| `node-server/config/database.js` | No hardcoded URI fallback; fails with a clear message when `MONGO_URI` is unset. |
| `node-server/config/env.js` | **New.** Loads `.env` before any module reads `process.env`. |
| `node-server/config/session.js` | Session secret from `SESSION_SECRET`; refuses to start in production without it. Cookie `Secure` from `COOKIE_SECURE`; `proxy: true`. |
| `node-server/middleware/internalAuth.js` | **New.** Enforces the `X-Internal-Auth` shared secret on `/api/*` and `/uploads/*`. |
| `node-server/app.js` | `trust proxy`, env-driven CORS, `/api/*` and `/uploads/*` guarded, proxied requests exempted from the CORS allow-list. |
| `public/admin/script/config.js` | API base is now same-origin (relative) instead of `http://<host>:5000`. |
| `node-server/routes/users.js`<br>`node-server/routes/organizations.js`<br>`node-server/routes/stats.js` | **Authorization fix.** Every read and mutation of user, organization and stats data now requires `authMiddleware`. Previously only `GET /api/users/me` and `GET /api/organizations` were guarded, so `POST /api/users` allowed anonymous account creation — including an admin role, since `role` comes from the request body — and `DELETE /api/users/:id` allowed anonymous deletion. `POST /login` and `POST /logout` remain public. |

> **Breaking change for local (non-Docker) development:** credentials are no
> longer in the source. Create a project-root `.env` (copy `.env.example`) before
> running the app under WAMP/XAMPP.

---

## 3. Run locally with Docker Compose

```bash
cp .env.example .env
# edit .env:
#   MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
#   SESSION_SECRET=$(openssl rand -hex 48)
docker compose up --build
```

Open <http://localhost:8080>. The API is also published on
<http://localhost:5000> for direct debugging, but the frontend always goes
through port 8080.

Useful commands:

```bash
docker compose logs -f web        # Apache + PHP errors (stderr)
docker compose logs -f api        # Express logs
docker compose exec web bash      # shell inside the web container
docker compose exec api sh        # shell inside the API container
docker compose down               # stop (keeps the upload volumes)
docker compose down -v            # stop and delete the upload volumes
```

`uploads/` and `public/images/orgs/` are named volumes shared by both
containers, mirroring how the buckets are mounted on Cloud Run.

---

## 4. Deploy to Cloud Run

### 4.1 Prerequisites

* A GCP project with billing enabled.
* `gcloud auth login` and `gcloud config set project <PROJECT_ID>`.
* Permission to create Cloud Run services, Secret Manager secrets, buckets, and
  Artifact Registry repositories.
* MongoDB Atlas **Network Access** set to allow `0.0.0.0/0`.

> **Why `0.0.0.0/0` on Atlas?** Cloud Run egress IPs are dynamic by default. The
> clean alternatives are a Serverless VPC Access connector with a Cloud NAT
> static IP (then allow-list just that IP), or Atlas Private Service Connect. For
> a single-project student system, `0.0.0.0/0` plus a strong database user
> password is the pragmatic choice. Do not reuse that database user elsewhere.

### 4.2 One-shot deploy

```bash
export MONGO_URI='mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority'
bash deploy/deploy.sh
```

The script is idempotent and will:

1. enable the required APIs
2. create the Artifact Registry repository
3. create two Cloud Storage buckets and mount them into both services
4. create three secrets (`orgdesk-mongo-uri`, `orgdesk-session-secret`,
   `orgdesk-internal-auth-token`) — the latter two as fresh random values
5. build both images with Cloud Build (no local Docker needed)
6. deploy `orgdesk-api`, then `orgdesk-web` pointed at it via `NODE_API_URL`
7. register the web URL in the API's CORS allow-list

Overridable variables: `PROJECT_ID`, `REGION` (default `asia-southeast1`),
`AR_REPO`, `WEB_SERVICE`, `API_SERVICE`, `MAX_INSTANCES`, `UPLOADS_BUCKET`,
`LOGOS_BUCKET`, `MONGO_DB`, `TAG`.

### 4.3 Manual equivalent

```bash
PROJECT_ID=my-project
REGION=asia-southeast1
REGISTRY=${REGION}-docker.pkg.dev/${PROJECT_ID}/orgdesk

gcloud builds submit . --config deploy/cloudbuild.yaml \
  --substitutions=_REGION=${REGION},_AR_REPO=orgdesk,_TAG=$(git rev-parse --short HEAD)

gcloud run deploy orgdesk-api \
  --image ${REGISTRY}/orgdesk-api:latest \
  --region ${REGION} --port 8080 --allow-unauthenticated \
  --execution-environment gen2 \
  --add-volume name=uploads,type=cloud-storage,bucket=${PROJECT_ID}-orgdesk-uploads \
  --add-volume-mount volume=uploads,mount-path=/app/uploads \
  --add-volume name=logos,type=cloud-storage,bucket=${PROJECT_ID}-orgdesk-logos \
  --add-volume-mount volume=logos,mount-path=/app/public/images/orgs \
  --set-env-vars NODE_ENV=production,COOKIE_SECURE=true \
  --set-secrets MONGO_URI=orgdesk-mongo-uri:latest,SESSION_SECRET=orgdesk-session-secret:latest,INTERNAL_AUTH_TOKEN=orgdesk-internal-auth-token:latest

API_URL=$(gcloud run services describe orgdesk-api --region ${REGION} --format='value(status.url)')

gcloud run deploy orgdesk-web \
  --image ${REGISTRY}/orgdesk-web:latest \
  --region ${REGION} --port 8080 --allow-unauthenticated \
  --execution-environment gen2 --session-affinity \
  --add-volume name=uploads,type=cloud-storage,bucket=${PROJECT_ID}-orgdesk-uploads \
  --add-volume-mount volume=uploads,mount-path=/var/www/html/uploads \
  --add-volume name=logos,type=cloud-storage,bucket=${PROJECT_ID}-orgdesk-logos \
  --add-volume-mount volume=logos,mount-path=/var/www/html/public/images/orgs \
  --set-env-vars NODE_API_URL=${API_URL},PHP_SESSION_COOKIE_SECURE=1 \
  --set-secrets INTERNAL_AUTH_TOKEN=orgdesk-internal-auth-token:latest
```

`--execution-environment gen2` is **required** for Cloud Storage volume mounts.

---

## 5. Configuration reference

| Variable | Service | Required | Notes |
|---|---|---|---|
| `MONGO_URI` | api, web | yes | Atlas SRV string. Both halves query Atlas directly, so **both** services need it. Inject from Secret Manager. |
| `MONGO_DB` | api, php | no | Defaults to `Web-Tech`. |
| `SESSION_SECRET` | api | yes in production | `openssl rand -hex 48`. Changing it logs everyone out. |
| `COOKIE_SECURE` | api | no | Defaults to `true` when `NODE_ENV=production`. Set `false` for local HTTP. |
| `INTERNAL_AUTH_TOKEN` | api, web | recommended | Shared secret for `X-Internal-Auth`. Empty disables the check. |
| `NODE_API_URL` | web | yes | API base URL the Apache proxy forwards `/api/*` to. |
| `PHP_SESSION_COOKIE_SECURE` | web | no | `1` on HTTPS deployments. |
| `PORT` | both | injected | Cloud Run sets `8080`; Apache rewrites `ports.conf` to match. |
| `CORS_ORIGINS` | api | no | Extra allowed origins for direct (non-proxied) calls. |
| `TRUST_PROXY` | api | no | Number of proxy hops to trust. Defaults to `1`. |
| `APACHE_RUN_AS_ROOT` | web | no | `1` runs Apache workers as root. See §6.1. |
| `RUN_AS_ROOT` | api | no | `1` keeps the Node process as root. See §6.1. |

---

## 6. Operational notes and caveats

### 6.1 Upload persistence and file ownership

Cloud Run's container filesystem is ephemeral, so the two directories the
application writes to are backed by Cloud Storage buckets mounted as volumes:

| Container path | Written by |
|---|---|
| `/var/www/html/uploads`, `/app/uploads` | `FileUploadService.php` (submissions) |
| `/var/www/html/public/images/orgs`, `/app/public/images/orgs` | `middleware/upload.js` (org logos) |

Object-storage mounts expose read-only ownership metadata, so the entrypoints'
`chown` is a no-op there and the Apache/Node workers (`www-data`, `node`) may not
be able to create files. If uploads fail with a permission error, set
`APACHE_RUN_AS_ROOT=1` (web) and/or `RUN_AS_ROOT=1` (api) so the process runs as
the mount owner:

```bash
gcloud run services update orgdesk-web --region $REGION \
  --update-env-vars APACHE_RUN_AS_ROOT=1
```

Verify with:

```bash
gcloud run services logs read orgdesk-web --region $REGION --limit 50
```

If volume-mounted writes prove unreliable for your workload, the durable fix is
to upload straight to Cloud Storage from the application (`google/cloud-storage`
in PHP, `@google-cloud/storage` in Node) and store bucket object paths instead of
local paths.

### 6.2 Sessions and instance count

PHP stores sessions in local files and Express currently uses the default
in-memory store. With more than one instance a user can be bounced between
instances and appear logged out. `deploy.sh` therefore deploys with
`--max-instances=1` plus `--session-affinity` on the web service.

To scale out, move both session stores off the instance:

* PHP: install the Redis or MongoDB session handler and point
  `session.save_handler` at Memorystore.
* Express: replace the default store with `connect-mongo` (already a dependency
  in `node-server/package.json`) or `connect-redis`.

Then raise `MAX_INSTANCES`.

### 6.3 Security model

* The API service is publicly reachable by URL, but `/api/*` and `/uploads/*`
  return `403` unless the request carries the `X-Internal-Auth` secret that the
  Apache proxy injects. Only `/health` and the static fallback are open.
* Both images run without baked-in secrets; `.env` files are excluded by
  `.dockerignore` and `.gcloudignore`.
* Apache runs as `www-data`; the Node process drops to `node` via `gosu`.
* `/uploads/**` is protected by `uploads/.htaccess` -> `redirect.php`, so
  submitted documents are not publicly downloadable.

### 6.4 Costs

Both services scale to zero (`--min-instances=0`). Expect Cloud Run request
charges, Artifact Registry storage for the two images, and a few GB of Cloud
Storage. The mongodb PECL build makes the first web image build a few minutes
long; subsequent builds reuse the Cloud Build cache only if you enable it.

### 6.5 Rollback

Images are tagged with both `latest` and the git short SHA. Redeploy a previous
revision without rebuilding:

```bash
gcloud run services update-traffic orgdesk-web --region $REGION --to-revisions <REVISION>=100
gcloud run revisions list --service orgdesk-web --region $REGION
```

### 6.6 Alternative: a single Compute Engine VM

If you later want the simplest possible deployment and durable local-disk
uploads without Cloud Storage, run the same Compose file on one VM:

```bash
gcloud compute instances create orgdesk \
  --zone asia-southeast1-b --machine-type e2-medium \
  --image-family cos-stable --image-project cos-cloud \
  --tags http-server,https-server

gcloud compute firewall-rules create orgdesk-web --allow tcp:8080 --target-tags http-server
```

Then `docker compose up -d --build` on the VM. Port 8080 stays as-is (no `$PORT`
rewriting is needed because `PORT` is only injected by Cloud Run), and the named
volumes persist on the boot disk. Add a Caddy or nginx container in front for
TLS.

---

## 7. Importing existing data

`mongoexport` JSON is loaded by `deploy/import-json.js`, which runs inside the api
container where mongoose and `MONGO_URI` are already available.

```bash
# 1. copy the importer and your export into the container
docker compose cp deploy/import-json.js api:/tmp/import-json.js
docker compose cp ./my-export          api:/tmp/export

# 2. preview
docker compose exec -T api node /tmp/import-json.js /tmp/export --dry-run

# 3. import (add --drop to replace the contents of each collection first)
docker compose exec -T api node /tmp/import-json.js /tmp/export
```

Collection names are inferred from the file name, case-insensitively and ignoring
a trailing `s`, so `users.json`, `Users.json` and `User.json` all target the
`User` collection. Both the PHP and Node models agree on these exact names:

| File name matches | Collection |
|---|---|
| `user`, `users` | `User` |
| `organization`, `organizations` | `Organizations` |
| `submission`, `submissions` | `Submissions` |

Documents are inserted verbatim through the driver, **not** through the mongoose
models. That matters: mongoose would silently drop fields that are absent from its
schema, which would corrupt records for the PHP half of the application. Extended
JSON (`$oid`, `$date`) is handled, as is both one-document-per-line output and
`--jsonArray`.

On Cloud Run, run the same script from a Cloud Shell or a one-off job with the
`MONGO_URI` secret injected, since Cloud Run services are not interactive.
