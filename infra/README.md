# Infrastructure

AWS CDK (TypeScript) for the backend that sits beside the React app. The site itself is hosted on AWS Amplify — CDK does not create S3 buckets or CloudFront distributions for it.

- Every AWS command uses `--profile Gossett-Claude`.
- CDK is bootstrapped in us-east-2 (`CDKToolkit` stack, bootstrap version 34).
- Run `cdk bootstrap` from the repo root, not from `infra/`: while the app has no stacks, running it here exits early with "This app contains no stacks".

## Hosting (AWS Amplify)

Recorded 2026-11-21 from the Amplify console and `aws amplify get-app` / `list-branches` / `list-domain-associations`.

| | |
|---|---|
| App | `brian-gossett-profile`, app ID `d3ksz8q52usvuz` |
| Region | us-east-2 (same as the CDK bootstrap) |
| Repository | `BrianGossett/brian-gossett-profile` |
| Branch | `master` — production, auto-build on push, the only connected branch. No PR previews, no auto branch creation |
| Custom domain | `https://briangossett.org` and `https://www.briangossett.org`, both serve `master` directly (neither redirects to the other) |
| Amplify address | `https://master.d3ksz8q52usvuz.amplifyapp.com` |
| Environment variables | none, at app or branch level |
| Last deploy | job 3, 2026-06-08, commit `ec73dd6`, succeeded |

All three addresses returned 200 on 2026-11-21. The domain association reports `AVAILABLE`; the apex subdomain entry shows `verified: false` even though the apex loads — worth a look under Custom domains.

### Build settings

Set in the Amplify console (there is no `amplify.yml` in the repo). Updated 2026-11-21 to pick up the Node version from `.nvmrc`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - if [ -f .nvmrc ]; then nvm install && nvm use; fi
        - node -v
        - npm -v
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*
```

- Amplify builds its own `dist`; the `dist/` files committed in git are not used.
- The app needs Node 22.12 or newer (Vite 8, Vitest 5); `.nvmrc` pins 26.13.1. The `if` keeps builds of commits without an `.nvmrc` working on the image's default Node.
- **Not yet verified on Amplify:** no build has run since the edit. On the first build after `.nvmrc` reaches master, check the log for `v26.13.1` from `node -v`. If the build image can't run Node 26, change `.nvmrc` to the latest Node 22 or 24.

### Rewrites and redirects

One rule:

| Source | Target | Type |
|---|---|---|
| `/<*>` | `/index.html` | `404-200` |

Observed on the live site (2026-11-21):

- `/` and real files (`/favicon.svg`) → 200.
- Page paths (`/study`, `/study/default/flashcards`, `/todo`) → 301 to the same path with a trailing slash, then the app's `index.html` with HTTP status **404**. The app loads in a browser, and a query string such as `?code=…&state=…` survives the redirect, but the status is wrong.
- A missing file (`/scores/<name>.pdf`) → `index.html` with status 404, so the PDF viewer receives HTML. The score PDFs are not deployed (`public/scores/` is gitignored) — see Ticket 15.

Ticket 13 should replace the rule with the standard single-page-app rewrite (type `200`) that sends only extension-less paths to `/index.html`, so page paths return 200 without a redirect and missing files return a real 404.
