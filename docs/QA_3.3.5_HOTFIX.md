# Typekeeper: Enchanted Library — v3.3.5 launch hotfix QA

## Root cause fixed
The previous 3.3.4 package contained 3.3.4 JavaScript/build metadata but a 3.3.3 HTML title/version meta tag. The runtime intentionally rejects mixed-version files, so initialization was blocked. The corrected 3.3.5 build has one consistent version across source HTML, dist HTML, standalone PLAY.html, build metadata, and runtime.

## Additional launch-safety change
The local launcher now defaults to port 4355 instead of the older 4332 range, reducing the chance that a still-running older Typekeeper server is mistaken for the current release.

## Executed checks
- 356/356 Node logic/state/layout/storage/randomness tests passed.
- JavaScript syntax checks passed.
- Production build passed; build ID 3.3.5-d359c4a45bfd3d0a.
- Real Chromium in-memory startup: v3.3.5 title, diagnostics initialized, no page errors, Start control visible.
- Standalone single-row/randomization suite: 19/19 passed.
- ES-module single-row/randomization suite: 19/19 passed.
- Standalone book/spell interaction suite: 26/26 passed.
- ES-module book/spell interaction suite: 26/26 passed.
- Release integrity/launcher/collision/corruption audit: 7/7 passed.
- Polish/audio/resume suite completed its displayed checks through unsupported-AudioContext fallback without a product error; the harness process itself did not terminate before the environment timeout, so it is not counted as a completed aggregate suite.
- General legacy browser suite was not used as a release gate because several checks still expect older result-screen timing and pressure-expression implementation details; those failures are retained as QA debt rather than mislabeled as product passes.

## Scope boundary
Automated browser checks use Chromium on Linux and in-memory fixtures because this environment blocks navigation to localhost. The actual local HTTP launch path is separately verified by the release audit. Actual macOS Chrome/Safari and the user's machine remain external device checks.
