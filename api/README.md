# API

One Node.js 22 Lambda behind an HTTP API (see `../infra/README.md`). Every route needs a Cognito ID token in the `Authorization` header. The user is always the token's `sub`; nothing reads a user ID from the path, query or body.

```bash
npm test          # unit tests, against an in-memory table
npx tsc --noEmit  # type-check
```

## Points rules

Agreed 2026-11-21. All of the math is in `src/points.ts`, as pure functions.

| | Small | Medium | Large |
|---|---|---|---|
| Completing a task or a daily | 1 | 2 | 3 |
| Streak bonus | 5 | 10 | 15 |

- A **task** is done once. A **daily** is a task that comes back every day.
- **Each daily has its own streak.** It grows by one for each day in a row the daily is completed and starts over after a missed day.
- Every **7th day in a row** earns a weekly streak bonus, and every **30th day in a row** a monthly streak bonus, on top of the base points. Both use the streak bonus row above, by the daily's size.
- A daily can be completed once per day and a task once ever. A second attempt returns 409 and awards nothing.
- There are no other bonuses yet.
- **Rewards** cost whatever the user sets. Redeeming is refused (409) when the balance is lower than the cost.
- **Goals** are named groups for tasks and dailies. They earn no points.
- A **day** is the user's local day, by the `timezone` on their profile (default `America/Chicago`).

## Routes

| Route | What it does |
|---|---|
| `GET /me` | The caller's profile: `points` (balance), `timezone`, `householdId`. Created on first call |
| `PATCH /me` | Change `timezone` |
| `GET /today` | Today's dailies (with `doneToday` and `streak`), open tasks, `balance`, `earnedToday` |
| `GET /tasks` | All tasks and dailies |
| `POST /tasks` | Create. Body: `title`, `size`, optional `repeat` (`none` or `daily`), `goalId`, `dueDate` |
| `PATCH /tasks/{id}`, `DELETE /tasks/{id}` | Edit or delete |
| `POST /tasks/{id}/complete` | Complete for today. Returns `points`, `awards`, `streak`, `balance` |
| `GET /goals`, `POST /goals`, `PATCH /goals/{id}`, `DELETE /goals/{id}` | Goals. Body: `name` |
| `GET /rewards`, `POST /rewards`, `PATCH /rewards/{id}`, `DELETE /rewards/{id}` | Rewards. Body: `name`, `cost` |
| `POST /rewards/{id}/redeem` | Spend points on a reward. Returns the new `balance` |
| `GET /summary?period=week\|month\|year` | Earned, streak bonuses, spent, completions and a per-goal breakdown for the current calendar week (Monday to Sunday), month or year |
| `GET /heatmap` | Completions and points per day for the last 365 days |
| `GET /schedules` | The caller's schedules, plus example `templates` |
| `POST /schedules` | Create from `{ name, items }` or from an example with `{ templateId }` |
| `PUT /schedules/{id}`, `DELETE /schedules/{id}` | Edit or delete |
| `POST /schedules/{id}/apply` | Create one daily per item in the schedule |

Task IDs start with `t_` and daily IDs with `d_`.

## Items in the table

Under `USER#<userId>`:

| `SK` | Item |
|---|---|
| `PROFILE` | Profile, including the `points` balance |
| `GOAL#<id>` | A goal |
| `TASK#t_<id>` | A one-off task |
| `DAILY#d_<id>` | A daily |
| `DONE#<date>#<itemId>` | One completion. Its key is what stops a second completion on the same day |
| `STREAK#d_<id>` | A daily's streak: `current`, `longest`, `lastDate` |
| `LEDGER#<date>#<time>#<id>` | Every change to the balance: `amount` and `reason` (`task`, `daily`, `streak-week`, `streak-month`, `redeem`) |
| `REWARD#<id>` | A reward |
| `REDEEM#<date>#<time>#<id>` | A redemption |

Under `HH#<householdId>`: `MEMBER#<userId>` and `SCHED#<id>`. Every user currently has a household of their own (`householdId` equals their user ID); schedule routes check membership before reading or writing.

Completing and redeeming each write all of their items in one transaction, so the balance, the ledger and the completion record cannot disagree.
