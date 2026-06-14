# LawnUp — Manual Device QA Checklist

**Build:** `redesign/phase1-design-system-auth`
**Run on:** at least one real Android device + one iOS device (a dev build, not Expo Go).
**Tester:** ________   **Device / OS:** ________   **Date:** ________

## How to use
Work top to bottom. For each case mark **PASS / FAIL / N/A** and note the build. A case with any *Failure indicator* is a FAIL — log it with the severity shown.

### Severity legend
- 🔴 **Critical** — crash, data loss, or a core journey is blocked for everyone. Launch-blocking.
- 🟠 **High** — a major feature is broken or wrong. Fix before launch.
- 🟡 **Medium** — degraded behaviour with a workaround. Fix soon.
- 🟢 **Low** — cosmetic / copy / polish.

### Pre-test setup
- Fresh install (delete any prior install first — see TC-1).
- Have **two test accounts** ready (one new, one existing with ≥3 saved plants).
- Be able to toggle **Airplane mode / Wi-Fi off** (offline cases are important).
- Set device city to one in the list (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Bhopal, Indore, Kochi, Nagpur, Patna, Vadodara, Surat, Coimbatore, Visakhapatnam) to exercise weather/AQI.
- Note: with no `OPENAI_API_KEY`, **Dr. Banyan returns the local (non-AI) responder** — flag that as a known state, not a bug, unless told otherwise.

---

## 1. First install & splash

### TC-1.1 — Cold first launch
- **Steps:** Install fresh. Tap the icon. Watch the splash through to the app.
- **Expected:** "Scan to Bloom" splash plays — dark screen → plant silhouette → mint scan beam sweeps → "✦ Ficus benjamina · IDENTIFIED" → leaves illuminate to colour → background dawns to ivory → "LawnUp" + "Grow something beautiful." → lands on the Landing/Login screen. Fonts render (no system-font flash). Tap-to-skip works after ~2s.
- **Failure indicators:** White/blank first frame; splash hangs > ~5s; never advances; crash; missing fonts; sees "98%" (should read **IDENTIFIED**).
- **Severity:** 🔴 (hang/crash) / 🟢 (cosmetic).

### TC-1.2 — App icon & launch screen
- **Steps:** Check the home-screen icon and the OS launch image.
- **Expected:** Correct LawnUp icon; no Expo default; no blue/teal default screen (regression check).
- **Failure indicators:** Default Expo icon; **blue launch screen** (known prior Android bug).
- **Severity:** 🟠.

---

## 2. Sign up

### TC-2.1 — Create a new account (happy path)
- **Steps:** From Landing → Sign up. Enter full name, a fresh email, password (≥6 chars). Tap **Create account**.
- **Expected:** Button shows "Creating account…"; account is created; proceeds into **Onboarding** (Welcome). No clutter; warm botanical screen.
- **Failure indicators:** Stuck on "Creating account…"; no navigation; silent failure; created but lands on a blank screen.
- **Severity:** 🔴.

### TC-2.2 — Validation
- **Steps:** Try: empty name; invalid email; password < 6 chars.
- **Expected:** Create button stays disabled / shows a soft inline error; no crash.
- **Failure indicators:** Accepts a 3-char password; harsh red crash banner; app crash.
- **Severity:** 🟡.

### TC-2.3 — Duplicate email
- **Steps:** Sign up with an email that already exists.
- **Expected:** Friendly soft error ("email already in use"); stays on Signup.
- **Failure indicators:** Crash; cryptic Firebase error code shown raw; infinite spinner.
- **Severity:** 🟠.

### TC-2.4 — Sign up while offline
- **Steps:** Airplane mode on → attempt sign up.
- **Expected:** Clear "no internet" style error; button resets (not stuck).
- **Failure indicators:** Button stuck on "Creating account…" forever.
- **Severity:** 🟠.

---

## 3. Login

### TC-3.1 — Login (happy path)
- **Steps:** Landing → Sign in. Enter existing creds. Tap **Sign in**.
- **Expected:** "Signing in…" → lands on **Home** (existing user with plants sees the full dashboard).
- **Failure indicators:** Spinner hang; wrong destination; crash.
- **Severity:** 🔴.

### TC-3.2 — Wrong password
- **Steps:** Correct email, wrong password.
- **Expected:** Soft error ("incorrect email or password"); stays on Login.
- **Failure indicators:** Raw error code; crash; spinner hang.
- **Severity:** 🟠.

### TC-3.3 — Forgot password
- **Steps:** Tap "Forgot password?" → enter email → submit.
- **Expected:** Confirmation that a reset email was sent; reset email actually arrives.
- **Failure indicators:** No email received; crash; no feedback.
- **Severity:** 🟡.

### TC-3.4 — Session persistence
- **Steps:** Log in, force-quit the app, reopen.
- **Expected:** Opens straight to Home (still authenticated); no re-login; onboarding not repeated.
- **Failure indicators:** Forced to log in again; bounced to onboarding.
- **Severity:** 🟠.

---

## 4. Onboarding

### TC-4.1 — Full onboarding flow
- **Steps:** New account → Welcome ("Begin your garden") → Location (search & pick a city) → "Where will your plants live?" (1/4) → "How would you describe yourself?" (2/4) → "What kind of plants do you love?" (3/4) → "What's your main goal?" (4/4) → **Enter LawnUp**.
- **Expected:** Each step advances; selections persist; step counter correct; CTA reads **"Enter LawnUp"** (capital U — regression check); lands on first-run Home.
- **Failure indicators:** Selections lost on back/forward; counter wrong; CTA reads "Enter Lawnup"; crash.
- **Severity:** 🟠 / 🟢 (casing).

### TC-4.2 — Onboarding completion while OFFLINE (regression: C1)
- **Steps:** On the final Goal step, turn on **Airplane mode**, then tap **Enter LawnUp**.
- **Expected:** App enters Home **immediately** (does not block on the network write). On reconnect, completion syncs silently.
- **Failure indicators:** **Button stuck on "Setting up your garden…"**; app trapped on the Goal screen; relaunch returns to onboarding. *(This is the exact C1 bug that was fixed — verify it stays fixed.)*
- **Severity:** 🔴.

### TC-4.3 — City search
- **Steps:** In Location, type a partial city name.
- **Expected:** List filters; selecting sets the city used later for weather/AQI.
- **Failure indicators:** No filtering; selection doesn't stick.
- **Severity:** 🟡.

### TC-4.4 — First-run Home (regression: #1 UX)
- **Steps:** Immediately after onboarding (0 plants), view Home.
- **Expected:** Focused first-run view — greeting + **"Scan your first plant"** hero + "What one scan gives you" + trust line ("Free to start · Save as many plants as you like · No card needed"). **No** weather/AQI/seasonal-tip/quick-diagnose clutter, **no** premium banner.
- **Failure indicators:** Empty 0/0 dashboard; weather/AQI shown with no data; premium upsell on first run.
- **Severity:** 🟡.

---

## 5. Scan flow

### TC-5.1 — Camera permission priming (regression: #7)
- **Steps:** Tap Scan / "Scan your first plant" → reach the camera prompt (first time).
- **Expected:** Priming screen: "Camera access" + rationale + **privacy line** "🔒 Your photo is used only to identify the plant — never posted or shared." → "Allow Camera Access" → OS prompt → camera opens on grant.
- **Failure indicators:** OS prompt with no rationale; privacy line missing; "Allow" does nothing.
- **Severity:** 🟡.

### TC-5.2 — Permission denied recovery
- **Steps:** Deny camera permission.
- **Expected:** "Access denied" screen with **"Choose from Gallery"** + "Go back". Re-enabling in OS settings and returning shows the live camera.
- **Failure indicators:** Dead-end (no gallery option, no way out); crash; ignores the new permission after re-enabling.
- **Severity:** 🟠.

### TC-5.3 — Scan quota display (regression: #6)
- **Steps:** As a **free** user, open ScanLanding.
- **Expected:** Reads **"3 free scans left this week"** (gift framing, counts down with use). Not "0 of 3 used".
- **Failure indicators:** Shows "used" framing; wrong count; off-by-one.
- **Severity:** 🟢.

### TC-5.4 — Successful scan
- **Steps:** Point at a real plant → capture. Wait through Processing.
- **Expected:** Processing animation → **ScanResult**: hero image + common/scientific name + confidence; AI summary; CARE/HEALTH/INFO tabs; **leaf-burst celebration**; sticky "Add to my garden". Scan counter drops by exactly 1.
- **Failure indicators:** Processing hangs; no result; counter drops on failure; tabs broken; crash.
- **Severity:** 🔴.

### TC-5.5 — Gallery upload
- **Steps:** ScanLanding → "Upload from gallery" → pick a plant photo.
- **Expected:** Same Processing → Result flow.
- **Failure indicators:** Picker doesn't open; upload fails silently.
- **Severity:** 🟠.

### TC-5.6 — Failed / unclear scan does NOT burn quota
- **Steps:** Scan a blurry photo or a non-plant (wall).
- **Expected:** Friendly error ("Plant not detected clearly — try a different angle"); **scan counter unchanged**; rescan tips offered for low confidence.
- **Failure indicators:** Counter decrements on failure; crash; no guidance.
- **Severity:** 🟠.

### TC-5.7 — Scan while offline
- **Steps:** Airplane mode → attempt a scan.
- **Expected:** "No internet — check your connection and try again"; counter unchanged.
- **Failure indicators:** Indefinite spinner; crash; counter drops.
- **Severity:** 🟠.

### TC-5.8 — Free scan limit reached
- **Steps:** Use all free scans for the week.
- **Expected:** ScanLanding shows reset-aware message ("That's your free scans for this week — they refresh Monday"); camera/gallery disabled; "Upgrade for unlimited" → Paywall.
- **Failure indicators:** Can still scan past the limit; dead-end with no upgrade path; "limit reached" with no reset info.
- **Severity:** 🟠.

---

## 6. Plant detail

### TC-6.1 — Open a plant
- **Steps:** Home/My Garden → tap a plant.
- **Expected:** Hero image, health ring/score, care info, watering reminder toggle, AI-doctor card, milestones; correct nickname & species.
- **Failure indicators:** Wrong plant data; broken image; crash; missing sections.
- **Severity:** 🟠.

### TC-6.2 — Newly saved plant
- **Steps:** Open a plant just saved from a scan.
- **Expected:** Reflects scan data (species, health, confidence); empty milestone history reads gracefully.
- **Failure indicators:** Blank/garbled fields; crash.
- **Severity:** 🟡.

### TC-6.3 — AI-doctor card from plant detail
- **Steps:** Tap the "Ask AI Doctor" / care card.
- **Expected:** Opens Dr. Banyan focused on this plant (header "Caring for {nickname}").
- **Failure indicators:** Goes nowhere / to the wrong screen / to the Paywall unexpectedly.
- **Severity:** 🟡.

---

## 7. Add plant

### TC-7.1 — Save from scan (SavePlantModal)
- **Steps:** On ScanResult → "Add to my garden" → enter a nickname → save.
- **Expected:** Saves; "{nickname} added to your garden" banner; routes to the plant's detail (or upgrade prompt if free quota just hit 0); appears in My Garden + Home.
- **Failure indicators:** Save spinner hang; plant not in garden after save; duplicate; crash.
- **Severity:** 🔴.

### TC-7.2 — Manual add (AddPlant)
- **Steps:** Open the Add Plant flow (FAB / My Garden add).
- **Expected:** Form accepts entries; selected chips + Save use the brand sage; saves to garden.
- **Failure indicators:** Required fields not enforced; save fails; crash.
- **Severity:** 🟠.

### TC-7.3 — Save while offline
- **Steps:** Airplane mode → save a plant.
- **Expected:** Either queues and appears locally, or a clear error — **not** a silent loss or a permanent spinner.
- **Failure indicators:** Spinner hang; plant lost with no message.
- **Severity:** 🟠.

---

## 8. Edit plant

### TC-8.1 — Edit details
- **Steps:** Plant detail → Edit → change nickname / watering frequency → Save.
- **Expected:** Changes persist; reflected on detail, My Garden, Home; survive app restart.
- **Failure indicators:** Changes revert; not persisted after restart; crash.
- **Severity:** 🟠.

### TC-8.2 — Edit validation / cancel
- **Steps:** Clear the nickname; also try Cancel/back without saving.
- **Expected:** Empty name blocked or defaulted; cancel discards changes.
- **Failure indicators:** Saves an empty name; cancel still saves.
- **Severity:** 🟡.

---

## 9. Delete plant

### TC-9.1 — Delete with confirmation
- **Steps:** Plant detail → Delete → confirm.
- **Expected:** Destructive confirm dialog; on confirm, plant removed from detail/My Garden/Home; any scheduled reminders for it are cancelled; counts update.
- **Failure indicators:** Deletes with no confirm; plant reappears after restart; **orphaned reminder still fires**; crash.
- **Severity:** 🟠.

### TC-9.2 — Cancel delete
- **Steps:** Start delete → Cancel.
- **Expected:** Nothing deleted.
- **Failure indicators:** Deletes anyway.
- **Severity:** 🟠.

---

## 10. Chat (Dr. Banyan)

### TC-10.1 — First entry / intro (regression: #2)
- **Steps:** Open the Chat tab with no messages.
- **Expected:** Empty state shows **"AI PLANT DOCTOR"** eyebrow → **"Meet Dr. Banyan"** → grounded line ("…care data for 100+ Indian plants") → **"Tap a question to begin"** → 4 starter prompts. Header subtitle "AI plant doctor".
- **Failure indicators:** Bare cursor with no intro; generic "companion" subtitle; no starter prompts.
- **Severity:** 🟡.

### TC-10.2 — Send a message
- **Steps:** Tap a starter prompt or type a question → send.
- **Expected:** User bubble appears; "Dr. Banyan is thinking…" indicator; a relevant reply appears. *(Reply is the local responder unless an OpenAI key is configured.)*
- **Failure indicators:** No response ever; crash; reply is empty/garbled.
- **Severity:** 🟠.

### TC-10.3 — Message credit only on success (regression: M1)
- **Steps:** As a free user, note "X left today". Turn on Airplane mode, send a message (it will fail), turn Wi-Fi back on, check the count.
- **Expected:** Failed send shows an apology message but **does NOT decrement** the daily count. A successful reply **does** decrement by 1.
- **Failure indicators:** Count drops on the failed send.
- **Severity:** 🟡.

### TC-10.4 — Daily message limit → Paywall (regression: M3)
- **Steps:** As a free user, exhaust the daily message quota (20), send one more.
- **Expected:** Paywall opens as a **modal over the Chat tab** (no jump to the Profile tab); dismissing returns to Chat.
- **Failure indicators:** Jumps to the Profile tab; can send past 20; crash.
- **Severity:** 🟡.

### TC-10.5 — Plant-context chat
- **Steps:** Enter chat from a plant's AI card.
- **Expected:** Header "Caring for {nickname}"; intro references that plant; replies are plant-aware.
- **Failure indicators:** No plant context; wrong plant.
- **Severity:** 🟡.

---

## 11. Profile

### TC-11.1 — New-user Profile (regression: #5)
- **Steps:** With 0 plants, open Profile.
- **Expected:** Identity + **"Your garden starts here"** welcome card with **"Scan your first plant →"** (opens Scan), not just a cold 0/0/0 scorecard. Growth shows "X more to Sprout".
- **Failure indicators:** No welcome card; the scan CTA does nothing; crash.
- **Severity:** 🟡.

### TC-11.2 — Populated Profile
- **Steps:** With several plants/scans, open Profile.
- **Expected:** Correct counts (plants / thriving / AI scans); garden level + progress bar; achievements reflect real progress (earned vs locked); member-since year.
- **Failure indicators:** Wrong counts; achievements all locked despite progress; "since 2024" for a clearly new account.
- **Severity:** 🟡.

### TC-11.3 — Account rows
- **Steps:** Tap Edit profile, Reminders, Scan history, Settings, Help & support.
- **Expected:** Each navigates to the right screen; back returns cleanly.
- **Failure indicators:** Dead taps; wrong screen; crash; a "SOON" item that's actually tappable.
- **Severity:** 🟡.

### TC-11.4 — Edit profile
- **Steps:** Edit profile → change name → Save.
- **Expected:** Name updates across Profile/Home greeting; email & city shown read-only.
- **Failure indicators:** Name doesn't update; "Could not save" with good connection; crash.
- **Severity:** 🟡.

---

## 12. Settings (regression: M2)

### TC-12.1 — Notifications toggle reflects OS state
- **Steps:** Profile → Settings. Observe the "Watering reminders" toggle. Flip it.
- **Expected:** Toggle reflects the **real OS permission**. Turning **on** (when off) triggers the OS prompt or, if blocked, an alert offering "Open Settings". Turning **off** explains it's an OS-level change with "Open Settings". Returning from system settings re-syncs the toggle (focus re-check).
- **Failure indicators:** Toggle out of sync with OS; flipping does nothing; claims to disable but reminders still fire.
- **Severity:** 🟡.

### TC-12.2 — Appearance = SOON
- **Steps:** Look at "Dark mode".
- **Expected:** Shows a non-interactive **"SOON"** pill (light-only this release).
- **Failure indicators:** Tappable but does nothing; flips into a broken dark theme.
- **Severity:** 🟢.

### TC-12.3 — Delete account (destructive)
- **Steps:** Settings → Delete account → confirm in the destructive dialog.
- **Expected:** Confirm dialog warns it's permanent. On confirm: account + profile deleted, signed out, returned to auth. If the OS/Firebase requires a fresh login, see TC-12.4.
- **Failure indicators:** Deletes with no confirm; "Deleting…" hangs; account still logs in afterwards; crash.
- **Severity:** 🔴.

### TC-12.4 — Delete requiring recent login
- **Steps:** Log in, wait/return later (stale session), then try delete.
- **Expected:** Friendly alert: "Please sign in again … then delete your account." (the `RECENT_LOGIN_REQUIRED` path) — not a crash.
- **Failure indicators:** Raw Firebase error; crash; silent no-op.
- **Severity:** 🟠.

---

## 13. Premium / Paywall

### TC-13.1 — Open Paywall from multiple entry points (regression: M3)
- **Steps:** Open the Paywall from Home banner, Profile "Upgrade", ScanLanding upgrade, and a quota wall.
- **Expected:** Each presents the Paywall as a **modal over the current tab** (no jump to the Profile tab); swipe/close returns to where you were.
- **Failure indicators:** Tab switches to Profile; back button lands on the wrong screen; can't dismiss.
- **Severity:** 🟡.

### TC-13.2 — Paywall content & trust (regression: #3)
- **Steps:** Read the Paywall top to bottom.
- **Expected:** Hero "Never lose a plant to a guess."; comparison table; the scan row shows the number for the **selected plan** (100 annual / 80 monthly — not a "80–100" range); illustrative outcomes **with no fabricated names/testimonials**; no "thousands of gardeners" claim; plan picker (₹1990 annual / ₹199 monthly); trust row.
- **Failure indicators:** Fake testimonials present; "80–100" range; pricing mismatch with plan cards.
- **Severity:** 🟡.

### TC-13.3 — Purchase attempt
- **Steps:** Select a plan → "Start Premium".
- **Expected (current build):** In a **dev build**, mock-activates premium and dismisses. **⚠️ In a release build this is a no-op** (no payment provider wired) — confirm expected behaviour for your build type.
- **Failure indicators:** Release build: button looks tappable but nothing happens with no explanation (known H1 gap — confirm it's hidden/handled before a monetized launch).
- **Severity:** 🟠 (for a monetized launch).

### TC-13.4 — Premium state applies
- **Steps:** With premium active (mock or real), check Scan + Chat.
- **Expected:** Scan limit becomes monthly (80/100); chat shows unlimited (no "X left" chip); premium badge in Profile.
- **Failure indicators:** Still limited as free; badge missing.
- **Severity:** 🟠.

---

## 14. Notifications (permissions & delivery)

### TC-14.1 — Permission request
- **Steps:** Enable a watering reminder or the Settings toggle for the first time.
- **Expected:** OS notification permission prompt appears once; grant is remembered.
- **Failure indicators:** Prompt never appears; asks repeatedly; toggle says on without permission.
- **Severity:** 🟠.

### TC-14.2 — Notification delivery
- **Steps:** Schedule a reminder for ~1–2 min out (or set device clock forward). Background the app.
- **Expected:** A local notification fires at the scheduled time with sensible copy; tapping it opens the app (ideally the relevant plant).
- **Failure indicators:** Notification never fires; fires at the wrong time; tapping crashes; fires after the plant was deleted.
- **Severity:** 🟠.

### TC-14.3 — Permission denied
- **Steps:** Deny notifications, then try to enable a reminder.
- **Expected:** Clear guidance to enable in system settings; no crash; reminder isn't silently "scheduled" while blocked.
- **Failure indicators:** Pretends to schedule; crash.
- **Severity:** 🟡.

---

## 15. Reminder scheduling

### TC-15.1 — Schedule from plant detail
- **Steps:** Plant detail → enable watering reminder.
- **Expected:** Reminder created; appears in the Reminders list; toggle reflects scheduled state on return.
- **Failure indicators:** Toggle resets; no reminder created; duplicate reminders.
- **Severity:** 🟠.

### TC-15.2 — Reminders screen & AddReminder
- **Steps:** Profile → Reminders → Add a reminder (pick plant/time).
- **Expected:** Reminder saved and listed; editable/cancellable.
- **Failure indicators:** Save fails; list doesn't update; crash.
- **Severity:** 🟡.

### TC-15.3 — Cancel reminder
- **Steps:** Remove a reminder.
- **Expected:** Removed from list; the scheduled OS notification is cancelled (does not fire).
- **Failure indicators:** Still fires after cancel; list out of sync.
- **Severity:** 🟠.

### TC-15.4 — Reminder survives restart
- **Steps:** Schedule, force-quit, reopen.
- **Expected:** Reminder persists and still fires.
- **Failure indicators:** Lost after restart.
- **Severity:** 🟡.

---

## 16. Logout

### TC-16.1 — Sign out
- **Steps:** Profile (or Settings) → Sign out.
- **Expected:** Returns to Landing/Login; garden + cached usage cleared; live plant subscription torn down; the next account doesn't see the previous user's plants.
- **Failure indicators:** Previous user's plants/data visible after switching accounts; crash; stuck on a blank screen.
- **Severity:** 🔴 (data leakage between accounts).

---

## 17. Re-login

### TC-17.1 — Log back in
- **Steps:** After logout, sign in to the same account.
- **Expected:** Garden re-syncs from the cloud; **onboarding NOT repeated** (onboardingComplete persisted); scan/message usage hydrates correctly (no false "limit reached", brief spinner OK).
- **Failure indicators:** Onboarding repeats; plants missing; false limit-reached; usage wrong.
- **Severity:** 🟠.

### TC-17.2 — Cross-account isolation
- **Steps:** Log out of account A, log in to account B, then back to A.
- **Expected:** Each account shows only its own plants/usage; no bleed-through.
- **Failure indicators:** A's plants appear under B (or vice-versa).
- **Severity:** 🔴.

---

## Cross-cutting checks (run opportunistically throughout)
- **Offline/poor network:** no infinite spinners anywhere; clear errors; nothing silently lost.
- **Back/gesture nav:** Android hardware back and iOS swipe behave on every screen; never traps the user.
- **Rotation / large font / dark-OS setting:** layouts don't break (app is light-only — verify it ignores OS dark mode gracefully).
- **Performance:** splash + scan + Home animations are smooth (no jank/dropped frames); list scrolling is smooth with many plants.
- **Memory/stability:** repeated scan→save→delete cycles don't crash or leak.
- **Copy:** no "Enter Lawnup" (casing), no "98%" on splash, no fabricated testimonials on Paywall, no placeholder/lorem text.

---

## Defect log (fill in)
| TC | Device/OS | Severity | What happened | Repro steps | Screenshot |
|----|-----------|----------|---------------|-------------|------------|
|    |           |          |               |             |            |
