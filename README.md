# Sila Lite — frontend

Sila is a sovereign AI-agent marketplace: teams discover, build, vet and hire AI
agents, and everything runs on your own infrastructure. **Sila Lite** runs
before the GPU servers arrive: the whole platform works, and chat says the AI
is waiting for its GPU servers.

This repository is the **website** (TypeScript). The API is in
**[sila-lite-backend](https://github.com/Mojahid-Souti/sila-lite-backend)**.
Both deploy on one hostname: `/` goes to this website and `/v1` to the API.

| Part | What it is |
|---|---|
| `apps/web` | The website: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui |
| `package.json`, `pnpm-*.yaml` | The pnpm workspace (Node 24, pnpm 11) |
| `infra/openshift` + `kustomization.yaml` | The OpenShift deployment |
| `.github/workflows/ci.yml` | Lint, type-check and tests, then builds and publishes the image |

## Image

GitHub Actions builds the image on every push and publishes it to GitHub's
container registry. OpenShift pulls it; nothing is compiled on the cluster.

| Image | Built from |
|---|---|
| `ghcr.io/mojahid-souti/sila-lite-web` | `apps/web/Dockerfile` (stage `runner`) |

Tags: `latest` and `sha-<commit>` on every push to `main`; `X.Y.Z` when a
`vX.Y.Z` git tag is pushed. The OpenShift deployment pins its version in
`kustomization.yaml` (`images:`).

**The public address is baked into the image.** Next.js writes the API address
into the website when it is built. The workflow uses the repository variable
`PUBLIC_URL` (Settings → Secrets and variables → Actions → Variables), and
`https://sila.omantel.om` when it is not set. A different hostname means
setting the variable and building again.

## Run it locally

With the backend running locally (its API on `http://localhost:8001`):

```bash
docker build -f apps/web/Dockerfile --target runner \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8001 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=http://localhost:8001 \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=not-exposed-in-lite \
  -t sila-lite-web:local .
docker run --rm -p 3002:3002 sila-lite-web:local
```

Open `http://localhost:3002`. For development, run
`pnpm install && pnpm --filter sila-web dev` with `NEXT_PUBLIC_API_URL` set.

## Deploy to OpenShift

Deploy the backend first (its README covers the project, quota and secrets).
Then, in the same project:

1. Check `infra/openshift/config.yaml`: `PUBLIC_HOST` must match the backend's.
2. Apply, then check:

   ```bash
   oc apply -k .            # needs oc 4.10 or newer
   oc get pods              # sila-web Running
   curl -I https://<PUBLIC_HOST>/login
   ```

Open the site, sign up with an address in the allowed domain and send a chat
message. The reply should say the AI is waiting for its GPU servers.

## Licence

MIT. See `LICENSE`.
