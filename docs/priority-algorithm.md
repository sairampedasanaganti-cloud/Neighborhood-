# Priority Algorithm (Explainable Rule-Based Scoring)

Implemented in `server/services/priorityEngine.js`. Produces a 0–100 score from
four additive factors, then buckets it into HIGH (>=65) / MEDIUM (35–64) / LOW (<35).

| Factor | Contribution |
|---|---|
| Category base score | Emergency Transport +55, Medicine Pickup +30, Grocery/Other +10, Tutoring +5 |
| Requester-selected urgency | HIGH +25, MEDIUM +10, LOW +0 |
| Urgent keywords in description | up to +20 (10 per matched keyword, capped) |
| Waiting time (recalculation only) | 20–60 min: +10, 60+ min: +20 |

The requester's own urgency selection is only one of several inputs — it is
never trusted on its own, satisfying the "do not simply trust a user-entered
priority field" requirement. Every contribution is logged into
`priorityExplanation`, which the UI shows in a collapsible "Why this priority?"
panel on the Request Details page.
