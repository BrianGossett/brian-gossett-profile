# Bug History

A permanent, append-only record of every bug found in this project and why it happened. Entries are never deleted — only updated with resolution info once a bug is fixed.

`make-ticket`'s bug path appends a new entry here (status `Open`) when it authors a bug ticket. `work-ticket` updates that same entry in place — filling in **Root cause (confirmed)**, **Fix summary**, and flipping **Status** to `Fixed` — in the same commit that closes the bug's ticket.

New entries are appended at the end of this file, each preceded by a `---` horizontal rule. Entry format:

```
## Bug N — <Title>
**Found:** <date>
**Status:** Open | Fixed
**Description:** <what was observed>
**Root cause (hypothesis):** <filled in when the bug ticket is authored>
**Root cause (confirmed):** <filled in when work-ticket closes it — may differ from the hypothesis>
**Fix summary:** <filled in on close — what changed and where>
**Ticket:** Bug N in docs/tickets.md · GitHub issue: pending sync
```

`sync-tickets` replaces "GitHub issue: pending sync" with the real issue number the moment it creates that bug's issue.

---

## Bug 14 — Empty MODEL ANSWER box on questions without a model answer
**Found:** 2026-11-21
**Status:** Open
**Description:** In Full Deck Exam and Exam Simulation, the grading screen shows an empty "MODEL ANSWER" box for score-analysis questions that have no model answer (all but the attribution question on each score).
**Root cause (hypothesis):** `modelAnswer` is optional in `src/data/scores.ts`; `ComprehensiveQuiz.tsx` and `ExamSimulation.tsx` render the box unconditionally, unlike `ScoreAnalysis.tsx`, which guards it.
**Root cause (confirmed):** <filled in when work-ticket closes it — may differ from the hypothesis>
**Fix summary:** <filled in on close — what changed and where>
**Ticket:** Bug 14 in docs/tickets.md · GitHub issue: pending sync
