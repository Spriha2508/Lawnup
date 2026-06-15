# Phase F — Home Dashboard State Audit

> Scope: audit `HomeScreen.tsx` (689 lines) **without changing navigation or redesigning**. ₹0 task.

## 1. Audit findings — the four states

| State | Status | Evidence |
|---|---|---|
| **Empty (first-run, 0 plants)** | ✅ **Strong** | `isNewUser` path (`:288`) — "Scan your first plant" hero + "What one scan gives you" value grid + trust line ("Free to start · Save as many plants…"). Focused, no clutter. |
| **Empty (care tasks, has plants)** | ✅ Good | "All caught up — your garden is happy 🌿" (`:324`). |
| **Success / populated** | ✅ Good | Overview stats, Today's Care, My Plants carousel, Featured Scan, educational tip (overwatering, `:74`), seasonal content. Solid hierarchy. |
| **Loading** | ⚠️ **Gap** | Weather & AQI fetched async (`:147–148`) with no skeleton/placeholder — cards pop in when ready. No `ActivityIndicator`/skeleton anywhere on Home. |
| **Error** | ⚠️ **Gap** | Weather/AQI failures are **silently swallowed** (`.catch(() => {})`, `:147–148`). On persistent failure the card simply never appears — no "couldn't load weather" message and no retry. |

### Content density / hierarchy / educational
- Density and hierarchy are **good** — sectioned, staggered reveal, first-run is appropriately sparse.
- Educational content **exists** (care tip at `:74`, value props, seasonal tips) and is well-placed.
- Minor: weather/AQI absence is indistinguishable from "still loading" vs "failed."

## 2. Proposed changes (recommended, NOT applied — see risk note)
1. **Weather/AQI loading skeleton** — show a lightweight placeholder while `weather === null && city` (before first resolve), so the layout doesn't jump.
2. **Soft error/empty for weather/AQI** — on `.catch`, set a small flag and render a one-line "Weather unavailable — tap to retry" instead of swallowing. Keeps graceful degradation but is honest.
3. **(Optional) Pull-to-refresh** — wrap the scroll in `RefreshControl` to re-fetch weather/AQI/tasks (no nav change).
4. **Educational rotation** — the static overwatering tip could rotate among 3–4 seasonal tips already available in the knowledge layer (content-only, no layout change).

## 3. Files modified
**None.** This phase is delivered as an audit. The Home screen is the product of the M3 "Botanical Daylight" rebuild; the gaps (loading/error for two optional cards) are **graceful-degradation**, not breakage. Per the "do not redesign / freeze risky changes" directive, the targeted improvements above are documented for a **separate, reviewed follow-up** rather than applied blind to a 689-line screen.

## 4. Risk level
🟢 **Low** (audit only — no code changed). The proposed follow-up changes are also Low risk (additive states on two optional cards), but were intentionally **not** applied to avoid regressing the M3 work without review.
