# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Legal and compliance
- First-run "Before you start" screen: the app opens only after the user ticks that they accept the Terms of use and Privacy policy; it is shown again when the terms change.
- `licenses/`: the full license text of all 573 npm packages and 239 Android libraries (`npm run licenses`; CI checks it is current).
- Firebase / Google Play services components removed from the manifest (`plugins/withoutFirebase.js`) and the install-referrer permission blocked.
- Terms: separate limitation of liability that keeps what the law does not allow to exclude; privacy policy: built-in libraries and a contact.
- Medication hint: "Doses come from your vet, not from this app."
- Material Symbols font documented; `check-confetti.json` now has a generator script.

### Open-source preparation
- Added SECURITY.md (private reporting), CONTRIBUTING.md (no support obligation), CODE_OF_CONDUCT.md (Contributor Covenant 2.1), issue forms and THIRD_PARTY_NOTICES.md.
- README: disclaimer of warranty and liability, project status, license and attribution section.
- Home labels reworded ("Daily checklist", "Health at a glance", default tasks "Breakfast", "Walk", "Dinner"); screenshots retaken with the demo pet.
- In-app terms name "the developer" instead of an unregistered brand; .gitignore covers store credentials and exported backups.

### Fixed (audit)
- Photos and documents are fully copied before their database row is saved (missing `await`).
- Android Auto Backup disabled, so pet data and documents never leave the phone silently.
- Temporary picker copies and exported backups are removed from the cache at start.
- Export streams to disk one file at a time instead of building the whole backup in memory.
- Backups declare database version 3; restore inserts in batches.
- Weight number follows the system font size.

### Changed (size)
- Release builds ship only ARM code, with R8 and resource shrinking: APK 154 MB -> 72 MB.
- Illustrations converted to WebP (4.8 MB -> 0.9 MB).
- `runOnJS` replaced by `scheduleOnRN`; lint now rejects un-awaited promises.

### Added
- Delete a pet, with confirmation. Removes its records, photo, documents and reminders.
- JSON backup import. Imported pets are added next to existing ones; nothing is overwritten.
- English and Serbian UI, English by default, switchable in Profile.
- Release signing from `~/.petwarden/keystore.properties` (debug-key fallback).
- Per-platform cap on pending reminders (Android allows far more than iOS).
- Notification permission is requested once, during the first onboarding.
- Nine species (dog, cat, rabbit, hamster, guinea pig, bird, reptile, fish, other) with breed suggestions that depend on the species; the breed field stays free text. Existing data is migrated in place.
- Pets without a photo show a species illustration (four dogs, one cat, a rabbit and a hamster); a real photo always wins.
- Privacy policy and Terms of use pages in Profile (English and Serbian).
- Birthday and health date fields format themselves as DD.MM.YYYY and explain a bad date instantly.
- Pet age shows years and months, or weeks and days for puppies and kittens.
- GitHub Actions CI: typecheck, lint and domain checks.
- `docs/` rewritten in English: architecture, building, testing, asset provenance.

### Changed
- Redesign with a bolder palette and a black pet card (Home, Planner, Health, Profile, Welcome, Onboarding, Documents).
- Reminders use exact alarms (`USE_EXACT_ALARM`) and arrive on time; before, Android could delay them by up to an hour.
- Unused permissions are blocked: `INTERNET`, `ACCESS_NETWORK_STATE`, `SYSTEM_ALERT_WINDOW`, push token.
- The Windows build is a single `Build-APK.bat`.
- Check scripts are named by topic (`check-health`, `check-planner`, ...) instead of by development phase.
- `public/canvaskit.wasm` is generated on install instead of being committed.

### Fixed
- The keyboard covered the primary button and lower fields on onboarding and in bottom sheets.
- Tab and statistic labels wrapped onto two lines at 200 % system font.
- The idle app drew about 120 frames per second at 40 – 78 % CPU because of an endless background drift and a looping empty-state animation. Idle now renders zero frames at about 5 % CPU.

### Removed
- Development-phase review notes and screenshots of the old design.
- Four unused illustrations.
- Expo template leftovers (`assets/icon.png`, `android-icon-*.png`, `splash-icon.png`, `favicon.png`).

## [1.0.0] - 2026-10-11

Initial MVP, built in seven phases.

- Design system, light / dark / system theme, custom floating tab bar, local fonts.
- Onboarding with photo, birth date, weight and a daily schedule; local SQLite database with Drizzle.
- Home with daily care, check-in and undo, mood, snooze, local reminders.
- Health: weight chart, vaccines, vet visits, medication, allergies and notes.
- Planner with weekly view and recurring tasks.
- Documents (PDF and photos), several pets, JSON export.
- Motion polish: shared photo transition, rolling numbers, skeleton shimmer, Reduce Motion support.
