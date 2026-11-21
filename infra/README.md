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

Commands, from `infra/` with the project's Node (`nvm use`):

```bash
npm test                                             # CDK assertion tests
npx cdk diff ProfileData --profile Gossett-Claude    # what a deploy would change
npx cdk deploy ProfileData --profile Gossett-Claude  # deploy
```

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
2. In AWS Secrets Manager (us-east-2), create a secret named `profile/google-oauth` whose value is this JSON:
   ```json
   { "clientId": "<Google client ID>", "clientSecret": "<Google client secret>" }
   ```
   The stack reads both values at deploy time; they are never written to the template or the repo. One secret costs about $0.40 a month.

The stack's outputs (`UserPoolId`, `UserPoolClientId`, `HostedUiDomain`, `GoogleRedirectUri`) are what the app's environment variables are filled from (Ticket 13).

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

- Amplify builds its own `dist`; the `dist/` files committed in git are not used.
- **Node is pinned to 24, not 26.** The app needs Node 22.12 or newer (Vite 8, Vitest 5). Node 26's official binary links `libatomic.so.1`, which the Amplify build image doesn't have, and the build doesn't run as root, so it can't be installed (`yum install` fails). Node 24 and 22 don't need it. Revisit when the Amplify image ships `libatomic` or a newer Node.
- `--skip-default-packages` stops nvm reinstalling Amplify's global tools (Cypress, Hugo, the Amplify CLI…) for the new Node on every build.

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
