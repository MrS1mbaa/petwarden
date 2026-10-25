# Contributing

Thanks for your interest in PetWarden. Please read this first: it sets expectations for everyone, including me.

## This is a spare-time project

- There is **no support obligation**. I answer when I can, and I may not answer at all.
- **Issues are for reproducible bugs** in the latest version. Please use the bug report form and fill in every field. Incomplete reports, questions, build help and feature requests may be closed without a reply.
- I do not provide help with self-built, modified or redistributed versions.

## Pull requests

- For anything larger than a small fix, **open an issue first** and wait for a go-ahead. Large unannounced pull requests may be closed.
- I may decline any pull request, including good ones, if it does not fit the project. Declining is not a judgement of you or your work.
- Keep changes small and focused, one topic per pull request.
- The app must stay offline-first: no network calls, analytics, ads, trackers or new permissions.
- Do not include copyrighted images, fonts or text you have no right to share, AI images generated from someone else's work, or personal data (real names, photos, phone numbers, locations).
- Before you submit, these must pass:

  ```bash
  npm run typecheck && npm run lint && npm run check
  ```

- If you use an AI coding agent, read [AGENTS.md](AGENTS.md) first: Expo APIs change between SDKs.

## License of contributions

By submitting a pull request you confirm that you wrote the change (or otherwise have the right to submit it) and that it is licensed under the project's [MIT License](LICENSE).

## Conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
