# Tickets

Feature tickets (`## Ticket N — <Title>`) and bug tickets (`## Bug N — <Title>`) share one numbering sequence. Entries are appended at the end, each preceded by a `---` line, and each ends with an `**Acceptance criteria:**` list.

Written by the `make-ticket` skill, turned into GitHub issues by `sync-tickets`, implemented by `work-ticket`.

---

## Ticket 1 — Finish recording the Amplify hosting details

Plan step 4. Hosting stays on AWS Amplify — do **not** create S3 buckets or CloudFront distributions for the site. This ticket only gathers the facts later tickets depend on; it writes no infrastructure.

Context: CDK is bootstrapped in the Gossett-Claude account, region us-east-2 (CDKToolkit stack, bootstrap version 34). Every AWS command uses `--profile Gossett-Claude`.

Already known (from the Amplify console overview, 2026-11-21):
- Region: us-east-2 — matches the bootstrapped region
- App ID: `d3ksz8q52usvuz`
- Branch: `master` (production branch, the only connected branch)
- Custom domain: `https://briangossett.org`
- Default Amplify address, derived from the app ID and branch: `https://master.d3ksz8q52usvuz.amplifyapp.com` — confirm it loads

Still to look up in the Amplify console (tell the user exactly where each one is):
- **Rewrites and redirects**: the current rules (needed by Ticket 13)
- **Environment variables**: any that already exist
- **Build settings**: the build spec and the Node version the build uses. The app now needs Node 22.12+ (Vite 8, Vitest 5; `.nvmrc` pins 26.13.1), so the build must run `nvm use` or set a newer Node, or the first deploy after the dependency upgrade will fail
- **Custom domains**: whether `www.briangossett.org` is also set up, and which one redirects to the other

Record all of it in the repo (a short "Hosting" section in `README.md` or `infra/README.md`).

**Acceptance criteria:**
- The user has a checklist of the remaining items and where to find each in the Amplify console
- Region, app ID, branch, both addresses, current rewrite rules, environment variables and build Node version are recorded in the repo
- If the Amplify build's Node version is older than 22.12, the user is told what to change before merging to master
---

## Ticket 2 — Data stack: single DynamoDB table

Plan step 5. Add a `DataStack` in `infra/lib/` and instantiate it from `infra/bin/app.ts`.

Table:
- Partition key `PK`, sort key `SK` (strings)
- One global secondary index `GSI1` with keys `GSI1PK`, `GSI1SK`
- Provisioned capacity: 5 reads, 5 writes
- Point-in-time recovery on
- Removal policy RETAIN (the table survives a stack delete)

Item layout (document it in a comment or `infra/README.md` so the API ticket uses the same keys):
- Under `PK = USER#<userId>`: `PROFILE`, `GOAL#`, `TASK#`, `DAILY#`, `DONE#<date>#<itemId>`, `STREAK#`, `LEDGER#`, `REWARD#`, `REDEEM#`, `DECK#`, `PROG#<deckId>`
- Under `PK = HH#<householdId>`: `MEMBER#`, `SCHED#`

Export the table name/ARN for the API stack. Show the user the `cdk diff` and the exact deploy command before deploying, and wait for a go.

Files: `infra/lib/data-stack.ts`, `infra/bin/app.ts`.

**Acceptance criteria:**
- `cdk synth` shows one table with PK/SK, GSI1 (GSI1PK/GSI1SK), provisioned 5/5, PITR enabled, DeletionPolicy Retain
- A CDK assertions test (or synth snapshot check) covers those properties
- Deployed only after the user approves the shown command; the table exists in the account afterwards
- The key layout above is written down in the repo

---

## Ticket 3 — Auth stack: Cognito with Google sign-in

Plan step 6. Add an `AuthStack` in `infra/lib/`.

- Cognito user pool with **Google as the only sign-in** (no username/password sign-up)
- A Cognito hosted sign-in domain
- App client: authorization code flow with PKCE, **no client secret**
- Callback (and sign-out) URLs: `https://briangossett.org/todo` (the custom domain people actually use), `https://master.d3ksz8q52usvuz.amplifyapp.com/todo`, and `http://localhost:5173/todo` for local dev

The user creates the Google OAuth client and stores its secret in Secrets Manager themselves. Before deploying, tell the user:
- The redirect URI to register on the Google OAuth client: `https://<cognito-domain>/oauth2/idpresponse`
- The Secrets Manager secret name the stack will read (propose one; the user confirms), and what it should contain

Show the `cdk diff` and deploy command and wait for a go. Deploy only after the user confirms the secret exists.

Files: `infra/lib/auth-stack.ts`, `infra/bin/app.ts`.

**Acceptance criteria:**
- The user is told the exact Google redirect URI and secret name before anything is deployed
- `cdk synth` shows a user pool whose only identity provider is Google, a hosted domain, and an app client with code flow, PKCE and no secret
- Callback URLs include `/todo` on `briangossett.org`, on the Amplify address, and on `http://localhost:5173`
- After deploy, opening the hosted sign-in page offers Google and completes a sign-in

---

## Ticket 4 — API stack: HTTP API, JWT authorizer, Lambda router, /me

Plan step 7, part 1. Add an `ApiStack`: one Node.js 22 Lambda (bundled from `api/src/handler.ts` with `NodejsFunction`) behind an HTTP API with a Cognito JWT authorizer from Ticket 3. Grant it read/write on the table from Ticket 2.

- `userId` **always** comes from the token's `sub` claim — never from the path, query or body
- A small router in `api/src/` that maps route keys to handlers, so Tickets 5 and 6 only add handlers
- `GET /me` returns (and on first call creates) the user's `PROFILE` item
- CORS allows `https://briangossett.org`, the Amplify address and `http://localhost:5173`

Show the `cdk diff` and deploy command and wait for a go.

Files: `infra/lib/api-stack.ts`, `infra/bin/app.ts`, `api/src/handler.ts`, `api/src/router.ts`, `api/src/routes/me.ts`, `api/test/`.

**Acceptance criteria:**
- Any route called with no token returns 401
- `GET /me` with the user's real token returns their profile
- A unit test proves `userId` is taken from the JWT claims and a `userId` in the body or query is ignored
- Unknown routes return 404

---

## Ticket 5 — To-do API routes and points math

Plan step 7, part 2. Add to-do handlers to the router from Ticket 4:

`/goals`, `/today`, `/tasks`, `/tasks/{id}/complete`, `/rewards`, `/rewards/{id}/redeem`, `/summary?period=week|month|year`, `/heatmap`, `/schedules`.

`/tasks/{id}/complete` applies the task's size, the streak and any bonuses, writes `DONE#<date>#<itemId>` and a `LEDGER#` entry, and updates `STREAK#`. `/rewards/{id}/redeem` spends points (`REDEEM#`). `/schedules` reads and writes household `HH#<householdId>` `SCHED#` items for members (`MEMBER#`) only.

All points math lives in the Lambda as pure functions (e.g. `api/src/points.ts`) with unit tests.

**Open — check in before building:** the plan does not define the task sizes, points per size, streak rules (what counts as a streak day, what breaks it, any multiplier) or the bonuses. `work-ticket` must stop and get these rules from the user before writing the points math. Also confirm the request/response shape for `/today`, `/summary` and `/heatmap`.

Files: `api/src/routes/*.ts`, `api/src/points.ts`, `api/test/points.test.ts`, `api/test/routes/*.test.ts`.

**Acceptance criteria:**
- The points, streak and bonus rules are agreed with the user and written in the ticket's PR description
- Unit tests cover the points math: each task size, streak continue/break, each bonus, and redeeming more points than the balance
- Completing a task twice on the same day does not award points twice
- `/summary` accepts only `week`, `month` or `year` and returns 400 otherwise
- A user cannot read or write another user's items, or a household they're not a member of

---

## Ticket 6 — Flashcard API routes

Plan step 7, part 3. Add flashcard handlers to the router from Ticket 4:

- `/decks` — list, create, update and delete the user's decks (`DECK#<deckId>`); a deck is `{ id, name, terms }`, matching the `Deck` type in `src/hooks/useDecks.ts`
- `/progress/{deckId}` — get and save study progress for one deck (`PROG#<deckId>`)
- `/flashcards/import` — accept a batch of decks and store them **keeping their existing IDs** (used by Ticket 9); importing a deck ID that already exists must not create a duplicate

The built-in `default` (Music Theory) deck is not stored per user; only custom decks are.

Files: `api/src/routes/decks.ts`, `api/src/routes/progress.ts`, `api/src/routes/import.ts`, `api/test/`.

**Acceptance criteria:**
- Deck create/read/update/delete round-trips the same `{ id, name, terms }` shape the app uses
- Import keeps the IDs it is given, and re-importing the same decks is a no-op rather than a duplicate
- Progress is stored and returned per deck ID
- All three routes return 401 without a token and only ever touch the caller's own `USER#<userId>` items

---

## Ticket 7 — Sign-in in the React app

Plan step 8, part 1 — done before the flashcard tickets because they need a signed-in user.

Add Cognito Hosted UI sign-in (authorization code + PKCE, no client secret) to the existing app:
- A small auth module (e.g. `src/auth/`) that starts sign-in, handles the `/todo` callback, stores and refreshes tokens, and signs out
- An auth hook/context the rest of the app can use (`isSignedIn`, `user`, `getToken`)
- An API client (e.g. `src/api/client.ts`) that adds the bearer token, reading the API URL and Cognito settings from `import.meta.env` (`VITE_...` variables — Ticket 13 lists them for Amplify)
- A sign-in/sign-out control in the existing header, in the existing theme (`src/Theme.ts`, `src/Components/Container`)

Because Cognito callbacks only allow `/todo`, a sign-in started from Study should return the user to the page they started on after the callback.

**Acceptance criteria:**
- Signing in with Google from localhost lands back in the app signed in, and the header shows the signed-in state
- Signing in from a Study page returns to that Study page
- The API client sends the token, and `GET /me` succeeds from the app
- Sign-out clears tokens; the app still works fully signed out
- Unit tests cover the PKCE helper and the token storage/refresh logic

---

## Ticket 8 — Back useDecks with the API when signed in

Flashcards step, part 1. Make `useDecks` and `useDeckById` (`src/hooks/useDecks.ts`) use the API from Ticket 6 when the user is signed in.

Constraints from the current code:
- **Keep the hook's functions the same**: `useDecks()` returns `{ customDecks, createDeck, updateDeck, deleteDeck }`, and `createDeck(name, terms)` returns the new `Deck` synchronously. Update local state and local storage immediately, then sync to the API in the background.
- Keep the local storage key `study-custom-decks`: it is the only store for signed-out visitors and the offline cache for signed-in users
- `useDeckById(deckId)` reads from the same source, so all study modes (`FlashcardMode`, `MultipleChoiceMode`, `TypeInMode`, `MatchingMode`) and the Study page keep working unchanged
- `DEFAULT_DECK` stays built-in and is never sent to the API

Files: `src/hooks/useDecks.ts`, `src/test/useDecks.test.ts`.

**Acceptance criteria:**
- Signed out: behavior is unchanged and all existing `useDecks` tests still pass
- Signed in: decks load from the API, and create/update/delete are saved to the API and to `study-custom-decks`
- Offline or on an API error, signed-in users still see their cached decks and the error doesn't crash the page
- `useDecks` tests are updated to cover the signed-in path with a mocked API client

---

## Ticket 9 — One-time import of local decks into the account

Flashcards step, part 2. The first time a user signs in, upload the decks already in `study-custom-decks` to `/flashcards/import` (Ticket 6), **keeping their IDs** so existing links like `/study/<deckId>/flashcards` keep working.

- Runs once per account per browser; remember that it ran (e.g. a local flag keyed by user ID)
- Safe to retry if it fails partway (the import route is idempotent)
- Tell the user when decks were imported (the Study page already has a toast)

Files: `src/hooks/useDecks.ts` (or a small `src/hooks/useDeckImport.ts`), tests in `src/test/`.

**Acceptance criteria:**
- After the first sign-in, every local custom deck exists in the account with the same ID
- Signing in again in the same browser does not import again
- A failed import is retried on the next sign-in, and never creates duplicate decks
- Tests cover the first run, the no-repeat check and the retry

---

## Ticket 10 — Save study progress per deck to the account

Flashcards step, part 3. Save `useStudySession` progress per deck to `/progress/{deckId}` (Ticket 6) when signed in.

Current state: `src/hooks/useStudySession.ts` keeps one session for all decks in `sessionStorage` (`music-theory-study-session`) with `mastered`, `missed`, `missedCounts`, `streak`, `lastMode`, `lastCategory`, `lastDeckId`, `termCounts` and `positions`.

**Open — check in before building:** confirm which fields are per deck (likely `mastered`, `missed`, `missedCounts`, `positions`) and which stay app-wide preferences (likely `lastMode`, `lastCategory`, `lastDeckId`, `termCounts`), and whether signed-out visitors keep the current `sessionStorage` behavior.

Keep `useStudySession`'s returned functions the same so the study modes don't change.

Files: `src/hooks/useStudySession.ts`, tests in `src/test/`.

**Acceptance criteria:**
- Signed in: progress made on a deck on one device shows up on another device for that deck
- Progress on one deck doesn't affect another deck
- Signed out: behavior is unchanged
- Saves are batched or debounced, not one request per card flip
- Tests cover loading, saving and switching decks

---

## Ticket 11 — /todo pages in the React app

Plan step 8, part 2. Add `/todo` routes to `src/Pages/ProfileRouting/index.tsx` with a to-do UI in the existing theme, using the API from Ticket 5 and sign-in from Ticket 7.

`/todo` is also the Cognito callback path (Ticket 3), so it must handle the callback and then show the to-do app.

Screens follow the API routes: today, tasks (create, complete), goals, rewards (redeem), summary (week/month/year), heatmap and household schedules.

**Open — check in before building:** the layout and which screens are separate routes vs. tabs on one page. Brainstorm the UI with the user first, or ask for a mockup.

Files: `src/Pages/TodoPage/`, `src/Pages/ProfileRouting/index.tsx`, nav in `src/Components/Container`.

**Acceptance criteria:**
- `/todo` signed out shows a sign-in prompt; signed in shows today's tasks
- Completing a task updates points and streak from the API response
- Pages use the existing `colors`/theme and work at phone width
- The Cognito callback on `/todo` signs the user in and then shows the to-do app

---

## Ticket 12 — Installable PWA with vite-plugin-pwa

Plan step 8, part 3. Add `vite-plugin-pwa` so the app installs on a phone.

- Web app manifest with name, icons (192 and 512 px, plus maskable), theme and background colors from `src/Theme.ts`, and `start_url` `/todo`
- Service worker that caches the app shell; **never** cache API responses that contain user data or auth tokens
- Exclude the score PDFs (`/scores/`) from precaching — they total about 874 MB

Files: `vite.config.ts`, `public/` icons, `index.html`.

**Acceptance criteria:**
- `npm run build` produces a manifest and a service worker
- Chrome's install prompt appears for the built site, and the installed app opens to `/todo`
- The service worker precache contains no `/scores/` PDFs and no API URLs
- The Cognito sign-in redirect still works from the installed app

---

## Ticket 13 — Amplify rewrite rule and environment variables

Plan step 9. Make sure the Amplify rewrite rule sends page paths (including `/todo`, `/study/...` and the Cognito callback with its `?code=` query) to `index.html`, while real files (JS, CSS, images, manifest, service worker, PDFs) are still served directly.

- Compare the current rule (recorded in Ticket 1) with what's needed and give the user the exact rule to set
- List every `VITE_...` environment variable the app now reads (API URL, Cognito domain, client ID, redirect URIs), with the value for each from the deployed stacks' outputs

The user adds the rule and variables in the Amplify console and merges.

**Acceptance criteria:**
- Loading `/todo` and `/study/default/flashcards` directly on the Amplify address returns the app, not a 404
- The manifest, service worker and static assets are still served as files
- The user has a complete list of environment variables with their values
- After the user sets them and merges, signing in on `https://briangossett.org` works

---

## Bug 14 — Empty MODEL ANSWER box on questions without a model answer

**Description**

In Exam Prep, the grading screens show a green "MODEL ANSWER" box for every score-analysis question, but only one question per score has a model answer. For the others the box is empty.

**Repro steps**

1. Open `/study/exam/comprehensive` (Full Deck Exam) or `/study/exam/simulation` (Exam Simulation)
2. Answer the score-analysis questions and go on to grading
3. Look at any question other than "Identify the composer, era, approximate date, and work…"

**Expected vs. Actual**

Expected: questions with no model answer don't show an empty model-answer box (the Score Analysis page already hides it). Actual: an empty box titled "MODEL ANSWER" is shown next to the user's answer.

**Root cause hypothesis**

Hypothesis, not confirmed: `modelAnswer` is optional in `src/data/scores.ts` (70 of 281 questions have one, by design), and `ComprehensiveQuiz.tsx` and `ExamSimulation.tsx` render the box unconditionally, while `ScoreAnalysis.tsx` guards it with `q.modelAnswer &&`.

**Affected files/routes**

`src/Pages/ExamPrepPage/ComprehensiveQuiz.tsx` (~line 225), `src/Pages/ExamPrepPage/ExamSimulation.tsx` (~line 374); routes `/study/exam/comprehensive` and `/study/exam/simulation`.

**Acceptance criteria:**
- Grading a question with no model answer shows no empty MODEL ANSWER box in Full Deck Exam or Exam Simulation
- Questions that have a model answer still show it
- The user's answer box uses the full width when there's no model answer
- A component test covers a question with and without a model answer

---

## Ticket 15 — Get the score PDFs to production

The Exam Prep PDF viewer loads scores from `/scores/<file>.pdf` (`pdfPath` in `src/data/scores.ts`), but `public/scores/` (78 PDFs, about 874 MB) is in `.gitignore`, so Amplify never receives the files and the viewer likely fails on the live site.

**Open — check in before building:** where the PDFs should live. Hosting stays on Amplify and the to-do plan rules out creating S3 or CloudFront for the site, and 874 MB should not be committed to git. The user must choose an approach (for example: confirm that a storage bucket just for the PDFs is acceptable, shrink/trim the PDFs to the pages actually used, or keep Score Analysis local-only and hide it in production). First confirm on `https://briangossett.org/study/exam/scores` that the PDFs really are missing.

Files: `src/data/scores.ts`, `src/Pages/ExamPrepPage/shared/PdfViewer.tsx`, `.gitignore`.

**Acceptance criteria:**
- It is confirmed whether score PDFs load on the live site today
- The user has chosen where the PDFs live
- On the live site, Score Analysis shows the PDF for every score, or the feature is clearly disabled where PDFs aren't available
- No PDFs are added to git history

---

## Ticket 16 — Stop tracking dist/ in git

`dist/` is in `.gitignore`, but four files are still committed (`dist/index.html`, `dist/favicon.svg`, `dist/vite.svg`, `dist/assets/Me-CBuShOXu.jpg`), so every `npm run build` shows `dist/index.html` as modified. Amplify builds the site itself and doesn't need them.

First confirm in the Amplify build settings (Ticket 1) that the build runs `npm run build` and publishes `dist` from the build, not from the committed files. Then `git rm -r --cached dist`.

**Acceptance criteria:**
- `git ls-files dist` prints nothing
- Running `npm run build` leaves `git status` clean
- The local `dist/` folder is not deleted, only untracked
- The Amplify build is confirmed to produce its own `dist`

---

## Ticket 17 — Fix the useEffect dependency warning in MultipleChoiceMode

`npm run lint` reports one warning: `src/Pages/StudyPage/MultipleChoiceMode.tsx:63` — the keyboard-shortcut `useEffect` is missing the dependencies `advance` and `pick`. With a stale closure, a key press could act on an earlier question's state.

Fix it properly (stable handlers or correct dependencies) rather than silencing the rule, and check the keyboard shortcuts still work.

**Acceptance criteria:**
- `npm run lint` reports 0 errors and 0 warnings
- Keyboard shortcuts in Multiple Choice pick an answer and advance on the current question, verified in the browser across several questions
- A test covers answering and advancing by keyboard for at least two questions in a row
