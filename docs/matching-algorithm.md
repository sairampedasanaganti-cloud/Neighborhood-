# Smart Matching Algorithm (Explainable Rule-Based Scoring)

Implemented in `server/services/matchingEngine.js`. Produces a 0–100 match score per (member, request) pair based on a transparent, explainable formula:

## Weighted Scoring Formula

| Factor | Weight | Scoring Details |
|---|---|---|
| **Skills & Interests** | **50%** (Max 50 pts) | • Exact skill match: **50 pts**<br>• Keyword/interest match: **35 pts**<br>• Related category/general skill: **25 pts** |
| **Availability** | **30%** (Max 30 pts) | • Matched day + slot (e.g., Saturday morning): **30 pts**<br>• Same day or active status: **20 pts**<br>• General available: **10 pts** |
| **Community Proximity** | **20%** (Max 20 pts) | • Same community & same city: **20 pts**<br>• Same city: **10 pts** |

## Age Suitability & Safety Filter
Before scores are calculated, an **age suitability filter** runs:
- Requests posted by teenagers (10–17) are filtered for age safety.
- Emergency requests are broadcast to all eligible members in the community regardless of skill match.
- Requests with match score $\ge 40\%$ generate a **Good Match** notification with transparent human-readable bullet points (e.g. *"✓ Relevant skill"*, *"✓ Available at requested time"*, *"✓ Same community"*).
