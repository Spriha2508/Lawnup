# Phase G — Accessibility Audit

> Scope: audit only (no behaviour changes this phase). ₹0 task. Measured across `src/**/*.tsx`.

## 1. Audit findings

| Area | Finding | Severity |
|---|---|---|
| **Screen-reader labels** | Only **6 `accessibilityLabel`** + **6 `accessibilityRole`** across **143 interactive elements** (~4% coverage). Most buttons/cards are unlabelled — TalkBack/VoiceOver will read them as generic or by raw child text. | 🔴 High |
| **Accessibility hints** | **0 `accessibilityHint`** anywhere — actions with non-obvious outcomes (e.g., scan FAB, paywall CTA) give no spoken context. | 🟡 Medium |
| **Dynamic text sizing** | **0 instances of `allowFontScaling={false}`** — text is **not** prevented from scaling with the OS font-size setting. ✅ Good (large-text users are respected). Caveat: many fixed-height containers/pills could clip at very large font scales — needs a device check at 130–200% (that's in the device-QA workstream, not here). | 🟡 Medium |
| **Touch targets** | Camera/close buttons use `hitSlop` (good pattern), and `PressableScale` has a default `hitSlop:8`. But several icon buttons are 30–36 px without explicit hitSlop — below the 48×48 dp recommendation. Spot-check needed. | 🟡 Medium |
| **Contrast** | Brand palette is warm/light. `textMuted`/`textFaint` on cream may fall below WCAG AA (4.5:1) for body text — needs a contrast-ratio check on the actual hex pairs (e.g., muted text on `#F6F1EA`). Decorative/secondary text is lower-risk. | 🟡 Medium |
| **Images/icons** | Emoji-as-icon is used widely (🌿, ✦). Screen readers read emoji names aloud, which can be noisy; decorative ones should be `accessibilityElementsHidden` / wrapped with a label on the parent. | 🟢 Low |
| **Focus order / roles** | Custom `PressableScale`/`Animated.View` tap targets often lack `accessibilityRole="button"`, so they aren't announced as actionable. | 🟠 High |

### What's already good
- Some key controls (profile open, scan CTA) **do** have labels + roles (`HomeScreen.tsx:247,433`) — the M8 QA pass started this.
- No font-scaling is blocked — dynamic type works app-wide.
- `hitSlop` is used on the most-tapped camera controls.

## 2. Proposed changes (recommended; not applied this phase)
1. **Add `accessibilityRole="button"` + `accessibilityLabel`** to the shared tap primitives (`PressableScale`, card components) so coverage propagates across all 143 sites with a handful of edits. Highest leverage.
2. **Label icon-only buttons** (close ✕, flash, flip, settings, tab bar) — short verbs ("Close", "Toggle flash").
3. **Add `accessibilityHint`** to the scan FAB and paywall CTA.
4. **Verify contrast** of `textMuted`/`textFaint` token pairs; bump one shade if below 4.5:1 for body copy (token-level, low blast radius).
5. **Add `hitSlop`** (or min 44×44) to sub-44px icon buttons lacking it.
6. **Hide decorative emoji** from the a11y tree where a parent already conveys meaning.

## 3. Files modified
**None this phase** (audit). The highest-leverage fix (labels on shared primitives) is a focused, low-risk change set best done as one reviewed pass — recommended as the immediate Phase-G follow-up.

## 4. Risk level
🟢 **Low** (audit only). Recommended follow-ups are Low–Medium risk (additive a11y props + one possible token shade), with no layout or logic change. **Coverage today (~4%) is the headline gap to close before a confident launch**, but it is not a release blocker for sighted users.
