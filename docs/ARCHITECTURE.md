# Architecture

PetWarden is an offline-first Expo / React Native app. There is no backend and no account: every record lives in a local SQLite database on the phone.

## Layout

```
app/                 Expo Router routes (thin: each file re-exports a screen)
  (tabs)/            Home, Planner, Health, Profile
  onboarding/        3-step first-run flow
  welcome.tsx        First-run landing screen
  documents.tsx      Document list
src/
  features/          One folder per domain: care, health, planner, pets, documents
  db/                SQLite client, Drizzle schema, numbered migrations, repositories
  notifications/     Reminder planning (pure) + platform adapters (native / web)
  components/        Shared UI (tab bar, bottom sheet, press feedback, Skia surfaces)
  lib/               Dates, motion preference, haptics, i18n (English + Serbian)
  theme/             Design tokens, light / dark / system theme
plugins/             Expo config plugins (release signing)
scripts/             Node checks (no test framework) and build helpers
```

## Data

- **expo-sqlite** is the store; **Drizzle ORM** (sqlite-proxy adapter) provides typed queries.
- Migrations are numbered, immutable SQL strings applied in a transaction at startup (`PRAGMA user_version`). A database newer than the app is refused instead of downgraded.
- All access goes through `withDatabase` / `withTransaction`, which serialise calls on one connection so async transactions cannot interleave.
- Deleting a pet cascades to every child table; the repository returns the file URIs so the caller can delete photos and documents afterwards.
- Photos and documents are copied into the app's document directory (`pet-photos/`, `pet-documents/`). The database stores their URIs.
- Android Auto Backup is off (`allowBackup: false`): nothing is copied to Google Drive. The JSON export is the only backup.
- Picker copies and old export files in the cache are deleted at every start (`clearTransientFiles`).

## Backup

Export writes one JSON file with every table plus the photos and documents embedded as base64 assets (max 24 MB, checked from file sizes before anything is read). The file is streamed to disk one asset at a time (`writeBackup`), so memory holds one file, not the whole backup. Import validates shape, asset references and size **before** any write, writes files first, then inserts all rows in one transaction as **new** rows with fresh ids. It never overwrites or merges into existing pets; files are removed again if the insert fails.

## Reminders

`src/notifications/plan.ts` and `healthPlan.ts` are pure functions that turn tasks, vaccines, visits and medication into a list of desired reminders. `reconcilePlan` diffs that list against what the OS has scheduled (by id and fingerprint) and cancels or adds only the difference, so reopening the app never multiplies notifications.

- Care tasks use daily or weekly repeating triggers.
- Vaccines and visits fire once at 09:00 on the day.
- Medication with an end date is expanded into dated triggers, 30 days ahead, and renewed when the app opens.
- Android allows far more pending alarms than iOS, so the cap is per platform (`maxPending`).
- Android alarms are exact (`USE_EXACT_ALARM`) and are re-registered by the OS-delivered boot event.
- Tapping a notification validates its payload (own app tag, positive integer pet id, whitelisted route) before switching pet and navigating.

## UI and motion

- Navigation is Expo Router with a custom floating tab bar.
- Animation uses Reanimated worklets (UI thread). Skia draws the paw background, charts and rolling digits.
- Every animation honours the system *Reduce Motion* setting.
- Nothing may animate forever: an endless loop keeps the UI thread at display refresh rate even when the screen is idle (measured: 120 fps and ~40 % CPU). Idle must render zero frames.

## Platform files

`*.native.ts(x)` and `*.web.ts(x)` pairs isolate code that differs between the phone and the browser preview (notifications, Lottie, Skia surfaces, file storage). The browser build is a development preview, not a supported target.

## Conventions

- Strict TypeScript, `any` only in backup import and restore (an untrusted-input boundary).
- Domain logic that can be tested without React lives in `model.ts` files and is covered by `scripts/check-*.mts`.
- Expo APIs change between SDKs: read the installed `expo` major version and use the matching docs (see `AGENTS.md`).
