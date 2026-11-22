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

**Decided 2026-11-21:** an S3 bucket for the PDFs is acceptable, and cost should be kept down. Still open: whether the PDFs are public or only for signed-in users (short-lived links from the API). Add the bucket to the existing CDK app in `infra/`, not Amplify Storage (which would add a second backend toolchain and its own Cognito resources).

**Original open question:** where the PDFs should live. Hosting stays on Amplify and the to-do plan rules out creating S3 or CloudFront for the site, and 874 MB should not be committed to git. The user must choose an approach (for example: confirm that a storage bucket just for the PDFs is acceptable, shrink/trim the PDFs to the pages actually used, or keep Score Analysis local-only and hide it in production). First confirm on `https://briangossett.org/study/exam/scores` that the PDFs really are missing.

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

---

## Ticket 18 — Learn mode for flashcard decks

A new study mode that takes a deck from unknown to learned in short rounds, modelled on how Quizlet's Learn works (reviewed 2026-11-21). Build our own wording, design and code; do not copy Quizlet's text, artwork or branding.

How it works:
- The deck (filtered by the selected category) is worked through in **rounds of 7 terms**
- Each term must be answered correctly **twice** to count as learned: first as **multiple choice**, then as a **typed answer**. A term that has passed multiple choice moves to typed answers in a later round
- A **correct** answer shows brief positive feedback and moves on by itself
- A **wrong** answer shows the correct answer and waits for the user to continue. The question **comes back later in the same round**, marked as a retry, with its options reshuffled. A wrong answer does not move the term forward
- A "Don't know" control counts as a wrong answer
- Each round ends with a **recap**: the terms covered in the round and overall progress (correct answers out of terms × 2)
- When every term is learned, show a finish screen with an option to start over
- Number keys choose a multiple-choice option; Enter submits and continues

Reuse what exists: distractors from `getDistractors` in `MultipleChoiceMode.tsx` (same category first), answer checking from `TypeInMode.tsx` (ignores case and punctuation). Move both into shared utilities rather than copying them.

Progress is per deck (Ticket 10): store each term's stage (0, 1 or 2 correct) in the deck's progress so Learn resumes where it stopped and syncs to the account. A term that reaches 2 is also marked mastered; a wrong answer is also recorded as missed, so the other modes and the Study page stats agree.

Route `/study/:deckId/learn`, inside `DeckGate`. Add Learn to the mode list on the Study page.

Files: `src/Pages/StudyPage/LearnMode.tsx`, `src/Pages/StudyPage/index.tsx`, `src/Pages/ProfileRouting/index.tsx`, `src/hooks/progressStore.ts`, `src/hooks/useStudySession.ts`, a pure `src/utils/learn.ts` for the round logic, tests in `src/test/`.

**Acceptance criteria:**
- Learn appears on the Study page and opens at `/study/<deckId>/learn`
- A round contains at most 7 terms, and a term's first question is multiple choice and its second is typed
- A wrong answer shows the correct answer, waits for the user, and the same term is asked again before the round ends
- A term counts as learned only after two correct answers, and overall progress reads as correct answers out of terms × 2
- Each round ends with a recap of its terms; finishing the deck shows a finish screen
- Leaving and reopening Learn resumes from the saved stages, and when signed in the stages are saved to the account
- A deck with fewer than 4 terms still works (fewer options, no crash)
- The round logic is covered by unit tests, and the mode by a component test

---

## Ticket 19 — Test mode with mixed question types and a results review

A practice test for a deck, modelled on how Quizlet's Test works (reviewed 2026-11-21). Our own wording, design and code.

- **Setup screen:** number of questions (up to the number of terms in the selected category), whether to answer with the term or the definition, and which question types to include: true/false, multiple choice, matching, written. At least one type must be on
- **The test is one scrolling page**, questions grouped by type in that order, each numbered "n of total"
  - True/false: a definition paired with a term that is either its own or another's
  - Multiple choice: four options, distractors from the same category first
  - Matching: a small group of terms and definitions to pair up
  - Written: a text box, checked the same way as Type the Term
- Every question can be left blank. Submitting with blanks asks whether to review the skipped questions or submit anyway
- **Results page:** score as a percentage, time taken, counts of correct and incorrect, a list of question numbers marked right or wrong that jumps to each question, and every question shown again with the user's answer and the correct answer
- "Take a new test" returns to setup with the same settings

Wrong answers are recorded as missed and correct ones as mastered in the deck's progress, the same as the other modes.

The existing Multiple Choice mode stays as it is.

Route `/study/:deckId/test`, inside `DeckGate`. Add Test to the mode list on the Study page.

Files: `src/Pages/StudyPage/TestMode.tsx`, a pure `src/utils/testBuilder.ts` for generating and grading questions, `src/Pages/StudyPage/index.tsx`, `src/Pages/ProfileRouting/index.tsx`, tests in `src/test/`.

**Acceptance criteria:**
- Test appears on the Study page and opens at `/study/<deckId>/test` on a setup screen
- The setup screen refuses to start with no question type selected, and limits the question count to the terms available
- A test with all four types on contains each type, grouped in order, with no term used twice
- Submitting with unanswered questions asks before grading
- The results page shows the score, time, and each question with the user's answer and the correct answer
- True/false statements are true about half the time, and a false statement never pairs a term with its own definition
- Question generation and grading are covered by unit tests

---

## Ticket 20 — Flashcard options: front side, starred terms, and re-studying missed cards

Three additions to Flashcards, from the comparison with Quizlet (2026-11-21):

- **Choose the front side:** term first (today's behavior) or definition first
- **Star terms:** a star on each card. A "starred only" option studies just those. Stars are per deck and saved with the deck's progress, so they sync to the account
- **Re-study missed cards:** at the end of a pass, offer "Study the N cards you missed", which runs another pass over only those, repeating until none are missed

Keep the existing keyboard shortcuts, and add one for starring.

Files: `src/Pages/StudyPage/FlashcardMode.tsx`, `src/hooks/progressStore.ts` (starred term IDs), `src/hooks/useStudySession.ts`, tests in `src/test/`.

**Acceptance criteria:**
- The front side can be switched between term and definition, and the choice is remembered
- A card can be starred and unstarred; stars persist per deck and survive a reload
- "Starred only" studies only starred terms, and is unavailable when nothing is starred
- After a pass with missed cards, the user can study just those cards, and the option disappears once none are missed
- Existing flashcard behavior and shortcuts still work
- A component test covers starring, the front-side option and the missed-cards pass

---

## Ticket 21 — Timer and best time for Matching

Matching counts wrong attempts but isn't timed. Add, as in Quizlet's Match (reviewed 2026-11-21):

- A running timer for each round, starting on the first tile clicked
- A time penalty for each wrong match, shown as it's added
- The round's final time on the round-complete screen
- The best time for the deck, saved with the deck's progress, with a "new best" note when beaten

**Open — check in before building:** how many seconds a wrong match adds, and whether the best time is per round of 8 or for a whole game.

Files: `src/Pages/StudyPage/MatchingMode.tsx`, `src/hooks/progressStore.ts`, tests in `src/test/`.

**Acceptance criteria:**
- The timer starts on the first click, not on page load, and stops when the last pair is matched
- A wrong match adds the agreed penalty and the added time is visible
- The round-complete screen shows the time and the best time for the deck
- The best time persists across reloads and syncs with the deck's progress
- Timer and penalty logic are covered by unit tests

---

## Ticket 22 — Android app from the React app

Package the site as an installable Android app, cheaply. Depends on Ticket 12 (the PWA: manifest, icons, service worker).

Recommended approach: a **Trusted Web Activity**. It is a thin Android shell that opens the live site full-screen in Chrome's engine, so there is one codebase and every web deploy updates the app. Google's Bubblewrap tool (or PWABuilder) generates the Android project from the PWA manifest. Sign-in keeps working because the Cognito and Google pages open in the same browser engine. The alternative, Capacitor, bundles the site into a WebView; Google blocks its sign-in inside WebViews, so it would need extra native sign-in work.

Work:
- Generate the Android project from the manifest, with an app name, package ID, icons and splash screen
- Publish `/.well-known/assetlinks.json` on `briangossett.org` with the signing key's fingerprint, so the app opens without a browser address bar. The Amplify rewrite rule (Ticket 13) must serve this file as a file, not `index.html`
- Build a signed APK (for installing directly) and an AAB (for the Play Store)
- Keep the signing key out of git; document where it is kept and how to rebuild

**Open — check in before building:**
- Install directly from an APK file (free), or publish on Google Play (a one-time developer registration fee, and a review process)?
- The app name and package ID (for example `org.briangossett.app`)
- Whether the app should open on `/todo` or the home page

Files: a new `android/` folder (or a separate repo), `public/.well-known/assetlinks.json`, `infra/README.md` (build and signing notes).

**Acceptance criteria:**
- The user has chosen direct install or Google Play, and the app name and package ID
- The app installs on an Android phone and opens the site full-screen, with no browser address bar
- Signing in with Google works inside the app
- `https://briangossett.org/.well-known/assetlinks.json` is served as JSON
- The signing key is not in git, and the rebuild steps are documented

---

## Ticket 23 — Pokémon type matchups as a built-in deck

Add the type-matchup questions from the owner's "Type Matchup Trainer" artifact as a second built-in flashcard deck, so every study mode can use them.

- All 18 types, Gen 6 onward, from the trainer's chart
- One card per type per question, where the answer isn't empty:
  - What is X super effective against?
  - Which types resist X attacks?
  - What is X weak to?
  - What does X resist?
  - What is X immune to?
- The question is the card's definition (what the modes show) and the list of types is its term (what the user answers). Categories are the five question kinds, so multiple-choice options are other lists of the same kind
- Card IDs are fixed, so saved progress stays attached if the data is regenerated
- **Typed answers that are lists** are checked as a set: every type, nothing extra, any order, separated by commas or spaces. A one-letter typo in a type name is forgiven
- The deck is built in (not stored per user), listed on the Study page beside Music Theory, and can be duplicated like the default deck. Its progress saves per deck like any other

Files: `src/data/pokemonTypes.ts`, `src/hooks/useDecks.ts` (built-in decks), `src/Pages/StudyPage/index.tsx`, `src/Pages/StudyPage/DeckGate.tsx`, `src/utils/studyQuestions.ts` (list answers), tests in `src/test/`.

**Acceptance criteria:**
- The deck appears on the Study page and opens in every study mode
- The data matches the trainer's chart: spot checks for Fire, Ghost, Steel and Fairy, and no card has an empty answer
- A typed list answer is correct in any order, wrong if a type is missing or extra, and tolerant of a one-letter typo
- Single-term answers in other decks are checked exactly as before
- The built-in deck is never sent to the API as a deck, and its progress still syncs
- Unit tests cover the generated cards and the list-answer checking

---

## Ticket 24 — Learn mode: buckets, retype to continue, session size and trickiest cards

Keep Learn's rules from Ticket 18 (rounds of 7, two correct answers per term, missed terms return in the same round) and add the best parts of the owner's "Type Matchup Trainer" Learn engine:

- **Buckets:** show how many terms are Unstarted, Familiar (one correct answer) and Mastered (two), as counts and a three-colour bar, in place of the single progress bar
- **Retype to continue:** after a wrong typed answer, show the correct answer and require the user to type it correctly before moving on
- **Session size:** a short setup step offering 10, 20 or all of the terms not yet learned
- **Misses in the recap:** each term in the round recap shows how many times it was missed in that round, or that it was clean
- **Trickiest cards:** the finish screen lists the terms missed most, with their answers
- **Live preview for list answers** (Ticket 23): as the user types, show which items were recognised

**Open — check in before building:** whether a wrong typed answer should also drop the term back to multiple choice, as the trainer does. Ticket 18 keeps the term at its current stage.

Files: `src/Pages/StudyPage/LearnMode.tsx`, `src/utils/learn.ts`, tests in `src/test/`.

**Acceptance criteria:**
- The bucket counts always add up to the number of terms in the session and match the saved stages
- After a wrong typed answer the user cannot continue until the correct answer is typed
- A session of 10 covers only 10 not-yet-learned terms; "all" covers every one
- The round recap shows a miss count per term
- The finish screen lists the most-missed terms, or says there were no misses
- Unit tests cover the bucket counts, session selection and miss tracking; the component test covers retype-to-continue
