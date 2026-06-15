# Phase H — Technical Cleanup

> Scope: reduce lint warnings / dead code / unused imports — **app code only** (Cloud Functions workspace deliberately untouched, per directive). ₹0 task.

## 1. Audit findings

### Lint baseline (before): **154 warnings, 0 errors**
Breakdown by rule (top):
| Count | Rule | Nature |
|---|---|---|
| 92 | `react-hooks/refs` | Reanimated "ref read in render" pattern — **intentional/structural**, not safely auto-fixable |
| 28 | `@typescript-eslint/no-require-imports` | RN bundle `require()` patterns (Firebase workaround, image assets) — **intentional** |
| 16 | `import/first` | A module-scope `const` wedged between imports in `App.tsx` cascaded into 16 violations |
| 4 | `react-hooks/immutability` | structural |
| 2 | `@typescript-eslint/no-unused-vars` | genuine dead code |
| 2 | `import/no-duplicates` | duplicate import in `App.tsx` |
| 2 | `@typescript-eslint/array-type` | style, auto-fixable |
| … | others | low counts |

**Insight:** ~120 of 154 warnings are **intentional RN/Reanimated patterns** (`react-hooks/refs`, `no-require-imports`) — chasing those would mean disabling rules or risky refactors, not real cleanup. The honest wins are the import-ordering cluster in `App.tsx` and genuine dead code.

### Dead code
- **`src/services/validation/plantValidation.ts`** — pass-through that always returned `isPlant: true`; the real logic lives in `identifyPlant`. **0 importers** across the codebase → genuine dead code (also flagged in the original project audit).

### Unused assets
- The 5 icon PNGs are 1×1 placeholders but are **referenced** by `app.json` (Phase A) — not "unused," they're *broken*. Not removed here (Phase A owns them).
- `LeafBurst.skia.tsx` is still referenced (1 importer via the skia-safe path) → **kept**.

## 2. Proposed changes (applied)
1. **`eslint --fix`** for the safe auto-fixable subset (import ordering + duplicates + array-type). This resolved the 16 `import/first` + 2 `import/no-duplicates` cluster in `App.tsx` by moving `const WINDOW_HEIGHT = …` below the imports and merging the duplicated `react-native-gesture-handler` import.
   - **Safety verified:** imports hoist, so the const move is behaviour-neutral; `react-native-gesture-handler` is **still the first import** (side-effect init preserved); `tsc --noEmit` clean.
2. **Deleted** `src/services/validation/plantValidation.ts` (0 importers) and the now-empty `src/services/validation/` directory.
3. **Reverted** the one auto-fix that touched `functions/src/plant/processPlantScan.ts` — Cloud Functions are out of scope for this workstream.

## 3. Files modified
- `App.tsx` — import-ordering auto-fix (behaviour-neutral).
- `src/services/validation/plantValidation.ts` — **deleted** (dead code, −17 lines).
- `src/services/validation/` — removed (empty).

## 4. Before / after metrics
| Metric | Before | After | Δ |
|---|---|---|---|
| Lint warnings (app) | **154** | **136** | **−18 (−11.7%)** |
| Lint errors | 0 | 0 | 0 |
| Dead files | 1 (`plantValidation.ts`) | 0 | −1 file, −17 LOC |
| `tsc --noEmit` | clean | clean | ✅ |

> The remaining **136 warnings are dominated by intentional Reanimated `react-hooks/refs` (92) and RN `no-require-imports` (28)** patterns. Reducing those further would require rule-level suppressions or risky refactors and is **not recommended** as ₹0 launch work — they are noise, not defects.

## 5. Risk level
🟢 **Low.** Only an import-ordering auto-fix (verified behaviour-neutral, gesture-handler still first, tsc clean) and deletion of a provably-unused file. No logic, UI, or navigation changes.
