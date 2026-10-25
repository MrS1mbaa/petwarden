# Security Policy

## Supported versions

Only the latest commit on the default branch is supported. Older builds and self-built or modified versions receive no fixes.

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for a security problem.**

Report it privately through GitHub: **Security** tab → **Report a vulnerability** ([direct link](../../security/advisories/new)).

Include, if you can:

- the affected commit or app version,
- the Android version and device,
- steps to reproduce, and
- what an attacker could do with it.

This is a hobby project maintained in spare time. I aim to acknowledge a report within 14 days, but I cannot promise a timeline or a fix. There is no bug bounty. Please give me a reasonable chance to fix the problem before you disclose it publicly.

## Scope

The app has no server, no account and no network permission; all data stays on the device. Relevant reports include:

- exposure of the local database, photos or documents to other apps,
- backup export and import parsing (the import file is untrusted input),
- file handling in the app's private storage,
- notification payloads and deep links.

Out of scope: problems that need a rooted device or an unlocked phone in an attacker's hands, issues in third-party packages that are already reported upstream, and builds that were modified by someone else.
