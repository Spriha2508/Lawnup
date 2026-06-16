# Phase 3 — Real-Device QA Checklist (v1 Pre-Launch)

> Run on **≥1 real Android + 1 real iOS** device (a dev/preview build, **not** Expo Go). Mark each **PASS / FAIL / N/A**.
> Severity: 🔴 Critical (launch-blocking) · 🟠 High · 🟡 Medium · 🟢 Low.
> **Run this only after the clean prebuild (Phase 2) so the new branding assets are actually in the binary.**

## A. Branding assets (new — verify the rebuild took)
| # | Test | Sev | Expected result | P/F |
|---|---|---|---|---|
| A1 | Launcher icon | 🔴 | The textured green **L** on cream — **not** a green/dark square, not the Expo default | |
| A2 | Adaptive icon (Android masks) | 🟠 | L stays inside circle/squircle/rounded masks, uncropped, cream background | |
| A3 | Splash screen | 🟠 | Dark first-frame → "Scan to Bloom" animation → ivory → wordmark; no white flash, no missing fonts | |
| A4 | Notification icon | 🟡 | A clean white **L** silhouette (gold-tinted), not a white box/blob | |
| A5 | App name under icon | 🟢 | Reads "LawnUp AI" (or "LawnUp" if renamed per Phase 1 #13) | |

## B. Onboarding flow
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| B1 | Full flow Welcome→Location→4 steps→Enter | 🟠 | Each step advances, selections persist, counter correct | |
| B2 | "How would you describe yourself?" | 🟡 | **Single-select** (only one card active) | |
| B3 | Complete onboarding **offline** | 🔴 | Enters Home immediately; does not hang on "Setting up…" (regression C1) | |
| B4 | First-run Home (0 plants) | 🟡 | Focused "Scan your first plant" view, no empty dashboard/clutter | |

## C. Login / Signup
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| C1 | Signup happy path | 🔴 | Account created → Onboarding | |
| C2 | Login happy path | 🔴 | → Home; session persists after force-quit | |
| C3 | Validation / wrong password / duplicate email | 🟠 | Soft inline errors, no raw Firebase codes, no crash | |
| C4 | Auth offline | 🟠 | Clear "no internet" error; button resets (not stuck) | |
| C5 | Forgot password | 🟡 | Reset email actually arrives | |

## D. Permissions
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| D1 | Camera priming + grant | 🟡 | Rationale + privacy line → OS prompt → camera opens | |
| D2 | Camera denied recovery | 🟠 | "Access denied" screen offers **Open settings** + Gallery; re-enabling works | |
| D3 | Notification permission | 🟠 | Prompted once; remembered | |
| D4 | Photo/gallery permission | 🟡 | Picker opens after grant | |

## E. Navigation
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| E1 | All 5 tabs + back/gesture | 🟠 | Every tab loads; Android hardware-back & iOS swipe never trap the user | |
| E2 | Deep stacks (plant→edit→back, paywall modal) | 🟡 | Back returns cleanly; paywall opens as modal over current tab | |

## F. AI plant diagnosis flow (Doc. Sage)
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| F1 | Open Chat empty state | 🟡 | "Meet Doc. Sage" intro + starter prompts | |
| F2 | Send a message | 🟠 | Reply appears (local responder unless `OPENAI_API_KEY` set — known state) | |
| F3 | Message credit only on success | 🟡 | Failed send does **not** decrement daily count | |
| F4 | Plant-context entry | 🟡 | Header "Caring for {nickname}"; replies plant-aware | |
| F5 | Daily limit → Paywall | 🟡 | Paywall modal over Chat, no tab jump | |

## G. Scan / Plant creation flow
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| G1 | Successful scan → result | 🔴 | Processing → ScanResult (name, confidence, care); counter −1 | |
| G2 | Gallery upload scan | 🟠 | Same Processing→Result flow | |
| G3 | Failed/blurry/non-plant scan | 🟠 | Friendly error; **counter unchanged** | |
| G4 | Scan offline | 🟠 | "No internet" message; counter unchanged | |
| G5 | Save from scan (SavePlantModal) | 🔴 | Saves; appears in My Garden + Home; survives restart | |
| G6 | Manual Add Plant | 🟠 | Form validates; saves to garden | |
| G7 | Free scan limit reached | 🟠 | Reset-aware message; upgrade path | |

## H. Plant detail pages
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| H1 | Open a plant | 🟠 | Correct hero/health/care/nickname; no broken image/crash | |
| H2 | Edit details persist | 🟠 | Nickname/watering changes survive restart | |
| H3 | Delete with confirm | 🟠 | Destructive confirm; removed everywhere; reminders cancelled | |

## I. Reminder system
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| I1 | Schedule from plant detail | 🟠 | Reminder created; appears in Reminders list | |
| I2 | Delivery (~1–2 min out, backgrounded) | 🟠 | Local notification fires; tapping opens app | |
| I3 | Cancel reminder | 🟠 | Removed; does not fire | |
| I4 | Survives restart | 🟡 | Persists and still fires | |
| I5 | Orphaned reminder after delete | 🟠 | Deleting the plant cancels its reminder | |

## J. Offline handling
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| J1 | Airplane mode across app | 🟠 | No infinite spinners; clear errors; nothing silently lost | |
| J2 | Reconnect sync | 🟡 | Onboarding completion / garden sync silently | |

## K. Error states
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| K1 | Network/API failures | 🟠 | Friendly messages, retry where sensible, no raw errors | |
| K2 | Weather/AQI fetch failure on Home | 🟡 | Degrades gracefully (card hidden), no crash | |

## L. Loading states
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| L1 | Scan processing | 🟡 | Animated processing; no frozen UI | |
| L2 | Home/usage hydration | 🟡 | Brief spinner, no false "limit reached" | |

## M. Performance
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| M1 | Splash + scan + Home animations | 🟠 | Smooth, no jank/dropped frames | |
| M2 | Garden list with many plants | 🟡 | Smooth scroll | |
| M3 | Repeated scan→save→delete | 🟠 | No crash/leak over cycles | |

## N. Dark mode (light-only app)
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| N1 | OS set to dark mode | 🟡 | App **ignores** OS dark mode and renders its light Botanical-Daylight theme correctly (only Camera/Processing/Splash are intentionally dark) | |

## O. Tablet responsiveness
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| O1 | Run on a tablet | 🟡 | Portrait-locked layouts don't break/stretch awkwardly; touch targets fine | |

## P. Android compatibility
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| P1 | Android 8–14 range | 🟠 | Adaptive icon, splash, notifications, camera all work | |
| P2 | No blue/teal default launch screen (regression) | 🟠 | Dark/ivory splash only | |

## Q. iOS compatibility
| # | Test | Sev | Expected | P/F |
|---|---|---|---|---|
| Q1 | iOS 15+ | 🟠 | Icon (no alpha), splash, camera, notifications work | |
| Q2 | Notch/Dynamic Island safe areas | 🟡 | No clipped headers/CTAs | |

---
### Defect log
| TC | Device/OS | Severity | What happened | Repro | Screenshot |
|----|-----------|----------|---------------|-------|------------|
|    |           |          |               |       |            |

**Exit criteria:** all 🔴 PASS and no open 🟠 → QA gate cleared for v1.
