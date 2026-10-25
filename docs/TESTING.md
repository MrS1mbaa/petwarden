# Testing

## Automated

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm run check       # domain checks, see below
npx expo-doctor     # dependency / config sanity
```

`npm run check` runs plain Node scripts (no test framework) against the real model code:

| Script | Covers |
| --- | --- |
| `check-theme` | WCAG AA contrast of every text token in both themes, minimum touch target |
| `check-database` | Input validation, every migration on a real SQLite database, foreign keys, unique and check constraints, rollback, reopen, cascade |
| `check-care` | Recurrence rules, daily / weekly plans, de-duplication, snooze persistence, scheduling retry |
| `check-health` | Dates, weight, vaccine chronology, medication schedule, chart geometry |
| `check-planner` | Local weeks, DST and leap days, future-check boundary, chronological aggregation |
| `check-documents` | File validation, portable references, relational snapshot, export limits |
| `check-notifications` | Safe notification targets, per-pet metadata, legacy rescheduling |
| `check-photo-transition` | Shared-photo transition state machine |
| `check-local-notifications` | Only the local notification modules are imported (no remote push registration) |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and check on every push and pull request.

## On a device

Last full pass: release APK on a Samsung SM-S928B, Android 17.

| Flow | Result |
| --- | --- |
| Cold start, three-step onboarding, keyboard does not hide the primary button (first step) | Pass |
| Check / un-check a task, mood, data survives force-stop | Pass |
| Reminder fires while the app is closed | Pass, 40 ms after the scheduled minute (exact alarm) |
| Alarms re-registered after a phone reboot, app not opened | Pass |
| Add document (PDF), open / share | Pass |
| Swipe a task, delete with confirmation | Pass |
| Delete a pet: records and reminders removed; last pet returns to Welcome. Leftover file cleanup not inspected (release builds block `run-as`) | Pass |
| JSON export (share sheet) and import (photo, task, weight, document restored) | Pass |
| System font at 200 %: tab labels stay on one line | Pass |
| Scrolling Home / Planner / Health / Profile | 0 – 0.6 % janky frames |
| Idle screen | 0 frames, ~5 % CPU |

Not yet verified: TalkBack reading order, animation recordings, airplane-mode session, iOS.

## Manual checklist for a new build

1. Fresh install, onboard a pet with a photo, allow notifications.
2. Add a task two minutes ahead, close the app, confirm the notification arrives on time.
3. Export, delete the pet, import the file, confirm photo, tasks, weight and documents are back.
4. Set the system font to the largest size and visit every tab.
5. Turn on *Remove animations* and confirm nothing moves except short fades.
6. Reboot the phone and confirm the next reminder still fires.

Useful ADB commands: `adb shell dumpsys gfxinfo <package>` (frame times), `adb shell dumpsys alarm` (scheduled alarms), `adb logcat -s ReactNativeJS:E AndroidRuntime:E` (errors).
