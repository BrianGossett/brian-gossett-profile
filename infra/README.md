# Infrastructure

AWS CDK (TypeScript) for the backend that sits beside the React app. The site itself is hosted on AWS Amplify — CDK does not create S3 buckets or CloudFront distributions for it.

- Every AWS command uses `--profile Gossett-Claude`.
- CDK is bootstrapped in us-east-2 (`CDKToolkit` stack, bootstrap version 34).
- Run `cdk bootstrap` from the repo root, not from `infra/`: while the app has no stacks, running it here exits early with "This app contains no stacks".

## Stacks

| Stack | What it holds |
|---|---|
| `ProfileData` | The DynamoDB table (`lib/data-stack.ts`) |
| `ProfileAuth` | The Cognito user pool, Google sign-in, hosted sign-in domain and web client (`lib/auth-stack.ts`) |
| `ProfileApi` | The HTTP API, its Cognito authorizer and the one Lambda (`lib/api-stack.ts`, code in `../api/`) |

Commands, from `infra/` with the project's Node (`nvm use`):

```bash
npm test                                             # CDK assertion tests
npx cdk diff ProfileData --profile Gossett-Claude    # what a deploy would change
npx cdk deploy ProfileData --profile Gossett-Claude  # deploy
scripts/deploy-auth.sh                               # deploy ProfileAuth (see Auth below)
```

### Deployed values

Deployed to us-east-2 on 2026-11-21. None of these are secret; the browser app needs them (they are committed in `.env.production` and `.env.development`).

| | |
|---|---|
| API URL | `https://crxtyxul9k.execute-api.us-east-2.amazonaws.com` |
| Cognito user pool ID | `us-east-2_VW2SULktv` |
| Cognito web client ID | `1ttktvjg759cklsk37cgn3g243` |
| Hosted sign-in domain | `https://briangossett.auth.us-east-2.amazoncognito.com` |
| Table name | `ProfileData-TableCD117FA1-SQQBF2JB6PJJ` |

Checked after deploy: every route returns 401 with no token or a bad token; CORS preflights are answered for the site origins only; the hosted sign-in redirects to Google and rejects a redirect address that isn't registered. A real Google sign-in from the app on localhost worked on 2026-11-21, and `GET /me` with that token returned the profile.

## Data: one DynamoDB table

- Keys: partition key `PK`, sort key `SK` (strings)
- One index, `GSI1`, with keys `GSI1PK` and `GSI1SK`
- Provisioned capacity: 5 reads and 5 writes on the table, and 5 and 5 on `GSI1`
- Point-in-time recovery is on
- Retained: deleting the stack leaves the table and its data in place
- The table name is generated; read it from the stack's `TableName` output

### Key layout

A user's items share the partition key `USER#<userId>`, where `userId` is the Cognito `sub` from the sign-in token:

| `SK` | Item |
|---|---|
| `PROFILE` | The user's profile |
| `GOAL#…` | A goal |
| `TASK#…` | A task |
| `DAILY#…` | A daily item |
| `DONE#<date>#<itemId>` | A completion of a task or daily item on a date |
| `STREAK#…` | Streak state |
| `LEDGER#…` | A points ledger entry |
| `REWARD#…` | A reward |
| `REDEEM#…` | A reward redemption |
| `DECK#…` | A custom flashcard deck |
| `PROG#<deckId>` | Study progress for one deck |

A household's items share the partition key `HH#<householdId>`:

| `SK` | Item |
|---|---|
| `MEMBER#…` | A household member |
| `SCHED#…` | A schedule |

What goes after each `#`, each item's attributes, and what `GSI1PK`/`GSI1SK` hold are decided by the API tickets (4–6) and should be added here as they are built.

## Auth: Cognito with Google sign-in

- One user pool on the Lite plan (the cheapest; Cognito's free allowance covers a personal app)
- **Google is the only way to sign in.** No passwords and no self sign-up. Anyone with a Google account who signs in gets a user in the pool; restricting it to specific people would need a pre-sign-up check (not built)
- Hosted sign-in domain: `https://briangossett.auth.us-east-2.amazoncognito.com`
- One web client: authorization code flow, no client secret. The browser app must use PKCE (Cognito accepts PKCE from a public client but cannot be set to require it)
- Sign-in and sign-out return to `/todo` on each origin in `siteOrigins` (`bin/app.ts`): `briangossett.org`, `www.briangossett.org`, the Amplify address, and `http://localhost:5173`
- The user pool is retained if the stack is deleted

### One-time setup before the first deploy

1. In Google Cloud Console, create an OAuth client of type **Web application** with:
   - Authorized redirect URI: `https://briangossett.auth.us-east-2.amazoncognito.com/oauth2/idpresponse`
   - Authorized JavaScript origin: `https://briangossett.auth.us-east-2.amazoncognito.com`
2. In the Amplify console, under Hosting > Secrets, add two secrets for **All branches**, pasting the bare values with no quotes:
   - `client_id` — the Google client ID
   - `client_secret` — the Google client secret

   Amplify stores these as encrypted Parameter Store values (`/amplify/shared/d3ksz8q52usvuz/…`), which is free. Secrets Manager would cost about $0.40 a month per secret.

### Deploying

CloudFormation can't read encrypted Parameter Store values for Cognito, so the stack takes the Google client ID and secret as deploy parameters (the secret is `NoEcho`, so CloudFormation never shows it). `scripts/deploy-auth.sh` reads both from Parameter Store and passes them in:

```bash
scripts/deploy-auth.sh --check   # validate the stored values; deploys nothing
scripts/deploy-auth.sh           # deploy ProfileAuth
```

Use the script for the first deploy and whenever the Google client changes. Any other deploy (including `cdk deploy ProfileApi`, which depends on this stack) reuses the values CloudFormation already has.

The stack's outputs (`UserPoolId`, `UserPoolClientId`, `HostedUiDomain`, `GoogleRedirectUri`) are where the values in `.env.production` come from.

## API: one Lambda behind an HTTP API

- One Node.js 22 Lambda (ARM, 256 MB), bundled from `api/src/handler.ts`. The AWS SDK is left out of the bundle because the Lambda runtime provides it
- An HTTP API with a Cognito JWT authorizer on every route. A request with no valid token gets 401 from API Gateway and never reaches the Lambda
- One catch-all route (`/{proxy+}`) sends every path to the Lambda, whose own router (`api/src/router.ts`) answers 404 for paths it doesn't know. To add an endpoint, add a route in `api/src/routes/` — no infrastructure change
- **The user ID is always the token's `sub` claim** (`api/src/auth.ts`). Handlers get it as `ctx.userId`; nothing reads a user ID from the path, query or body
- The app sends the Cognito **ID token** in the `Authorization` header (it carries the email and name that `GET /me` stores on first call)
- CORS allows only the origins in `siteOrigins` (`bin/app.ts`)
- The Lambda can read and write the table and nothing else. Its logs are deleted after a month

| Route | What it does |
|---|---|
| `GET /me` | Returns the caller's profile (`USER#<userId>` / `PROFILE`), creating it from the token on first call |

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

The build spec is `amplify.yml` at the repo root, which overrides whatever is saved in the Amplify console. It switches to the Node version in `.nvmrc`, prints `node -v` and `npm -v`, then runs `npm ci` and `npm run build` and publishes `dist`.

- Amplify builds its own `dist`; `dist/` is not tracked in git.
- **Node is pinned to 24, not 26.** The app needs Node 22.12 or newer (Vite 8, Vitest 5). Node 26's official binary links `libatomic.so.1`, which the Amplify build image doesn't have, and the build doesn't run as root, so it can't be installed (`yum install` fails). Node 24 and 22 don't need it. Revisit when the Amplify image ships `libatomic` or a newer Node.
- `--skip-default-packages` stops nvm reinstalling Amplify's global tools (Cypress, Hugo, the Amplify CLI…) for the new Node on every build.

### Rewrites and redirects

One rule, kept in `infra/amplify-rewrites.json` and applied with:

```bash
aws amplify update-app --app-id d3ksz8q52usvuz --custom-rules file://infra/amplify-rewrites.json --profile Gossett-Claude --region us-east-2
```

| Source | Target | Type |
|---|---|---|
| Any path with no file extension, or with one that isn't a known file type | `/index.html` | `200` (rewrite) |

- Page paths (`/todo`, `/todo/rewards`, `/study/default/flashcards`, and the sign-in return `/todo?code=…`) get the app with status 200 and no redirect.
- Real files (JS, CSS, images, `manifest.webmanifest`, `sw.js`, PDFs) are served as files, and a missing one is a real 404.
- When the build starts emitting a new kind of file, add its extension to the list in the rule.

Until 2026-11-21 the rule was `/<*>` → `/index.html` with type `404-200`, which answered page paths with a 301 to a trailing slash and then the app with status 404.

### Settings for the built site

The app reads `VITE_API_URL`, `VITE_COGNITO_DOMAIN` and `VITE_COGNITO_CLIENT_ID`. They are public values, committed in `.env.production` (and `.env.development` for local work), so Amplify needs no environment variables. Sign-in returns to `/todo` on whichever origin served the page; the allowed origins are `siteOrigins` in `bin/app.ts`.
