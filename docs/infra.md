# CommunityConnect — Infrastructure Reference

Last updated: 2026-07-13

## Overview

CommunityConnect backend runs on **Google Cloud Run**, fronted by a **Global External HTTPS Load Balancer** for the custom domain `api.ladmatrimony.in`. Frontend (`www.ladmatrimony.in`) is hosted separately on Vercel.

Project: `gen-lang-client-0063884169`
Region: `asia-south1`

---

## Resource Names (exact — do not typo these)

| Resource | Name |
|---|---|
| Cloud Run service | `communityconnect-backend` (⚠️ **no hyphens**) |
| Artifact Registry image | `asia-south1-docker.pkg.dev/gen-lang-client-0063884169/community-backend/backend` |
| Serverless NEG | `community-connect-backend-neg` |
| Backend service | `community-connect-backend-service` |
| URL map | `community-connect-url-map` |
| HTTP target proxy | `community-connect-http-proxy` |
| HTTPS target proxy | `community-connect-https-proxy` |
| HTTP forwarding rule | `community-connect-forwarding-rule` (port 80) |
| HTTPS forwarding rule | `community-connect-https-frontend` (port 443) |
| SSL certificate | `community-connect-ssl-cert` (managed, domain: `api.ladmatrimony.in`) |

> ⚠️ **Naming gotcha:** The Cloud Run service is `communityconnect-backend` (no hyphens), but every other LB-related resource uses `community-connect-*` (hyphenated). This mismatch caused a 2-hour outage on 2026-07-12/13 when the NEG was created pointing at a nonexistent `community-connect-backend` service. Always verify the NEG's `cloudRun.service` field matches the actual `gcloud run services list` output before debugging further up the stack.

---

## Cloud Run Configuration

- **Service:** `communityconnect-backend`
- **Region:** `asia-south1`
- **Ingress:** `internal-and-cloud-load-balancing` — direct `.run.app` URLs are **intentionally blocked** from external access (returns a 404-style response, not 403). Only traffic through the GLB or internal VPC is accepted. This is expected behavior, not a bug — don't waste time debugging direct `.run.app` 404s.
- **IAM invoker:** `allUsers` has `roles/run.invoker` (required even with ingress lockdown, since LB traffic still needs invoker permission)
- **CPU:** 1 vCPU (downgraded from higher tier, 2026-07-13)
- **Max scale:** 20
- **Deploys via:** GitHub Actions (`github-actions-deployer@gen-lang-client-0063884169.iam.gserviceaccount.com`)
- **Service URLs (internal/LB-only):**
  - `https://communityconnect-backend-19569463087.asia-south1.run.app`
  - `https://communityconnect-backend-dewmwdkz7q-el.a.run.app`

---

## Load Balancer Chain

```
Client (browser)
  → api.ladmatrimony.in (A record → LB IP)
  → HTTPS forwarding rule (community-connect-https-frontend, :443)
  → Target HTTPS proxy (community-connect-https-proxy)
    — SSL cert: community-connect-ssl-cert (managed, status: ACTIVE)
  → URL map (community-connect-url-map)
    — host rule: api.ladmatrimony.in
  → Backend service (community-connect-backend-service)
    — load balancing scheme: EXTERNAL_MANAGED
  → Serverless NEG (community-connect-backend-neg, region asia-south1)
    — must point to: communityconnect-backend (no hyphens!)
  → Cloud Run service (communityconnect-backend)
```

Serverless NEGs do **not** use traditional health checks — if `backend-services describe` ever shows a `healthChecks` entry attached, that's misconfigured and should be removed.

---

## CORS Configuration (FastAPI)

`allow_origins` must list the **frontend** domain(s), not the API's own domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.ladmatrimony.in", "https://ladmatrimony.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Known past bug: `allow_origin` (singular, typo) vs `allow_origins` (correct, plural kwarg).

---

## Useful Diagnostic Commands

**List actual Cloud Run services (verify names before anything else):**
```bash
gcloud run services list --region=asia-south1
```

**Check NEG points to the correct service:**
```bash
gcloud compute network-endpoint-groups describe community-connect-backend-neg --region=asia-south1
```

**Check backend service config + attached NEG:**
```bash
gcloud compute backend-services describe community-connect-backend-service --global
```

**Check URL map routing:**
```bash
gcloud compute url-maps describe community-connect-url-map --global
```

**Check SSL cert status:**
```bash
gcloud compute ssl-certificates describe community-connect-ssl-cert --global --format="get(managed.status)"
```

**Check Cloud Run IAM (should show allUsers / roles/run.invoker):**
```bash
gcloud run services get-iam-policy communityconnect-backend --region=asia-south1
```

**Check ingress setting:**
```bash
gcloud run services describe communityconnect-backend --region=asia-south1 --format="value(metadata.annotations)"
```

**Tail live logs while testing:**
```bash
gcloud run services logs tail communityconnect-backend --region=asia-south1
```

**Test preflight through the LB (real-world browser simulation):**
```bash
curl -i -X OPTIONS https://api.ladmatrimony.in/api/v1/auth/login \
  -H "Origin: https://www.ladmatrimony.in" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

---

## Incident Log

### 2026-07-12/13 — LB 404 / CORS failure on `/api/v1/auth/login`

**Symptom:** Browser CORS error on login; OPTIONS preflight through `api.ladmatrimony.in` returned 404.

**Root causes (two, stacked):**
1. Serverless NEG (`community-connect-backend-neg`) was created pointing at `community-connect-backend`, which never existed — the real service is `communityconnect-backend` (no hyphens). LB had no valid backend to route to.
2. Direct `.run.app` tests used during debugging also returned 404 — but this was a **red herring** caused by the `internal-and-cloud-load-balancing` ingress setting (added earlier for security), which blocks direct external access by design. This looked identical to a routing failure and cost significant debugging time before being identified as expected behavior.

**Fix:**
- Detached the incorrect NEG from the backend service (`remove-backend`)
- Deleted and recreated the NEG with the correct `--cloud-run-service=communityconnect-backend`
- Re-attached to `community-connect-backend-service` (`add-backend`)

**Lesson:** Run `gcloud run services list` and `network-endpoint-groups describe` early in any LB/Cloud Run routing issue to rule out name mismatches before going further up the stack (URL map, proxies, DNS, CORS).

---

## Notes / Deferred Items

- DPDP Act compliance considerations — discussed, not yet fully implemented
- Grafana monitoring — deferred
- Read replicas (Cloud SQL) — deferred
- Consider adding a health check route (`/api/v1/health`) to Cloud Run startup probe config for faster failure detection in future incidents
