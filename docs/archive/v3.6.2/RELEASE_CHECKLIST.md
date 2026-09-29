# v3.5.2 release checklist

The authoritative execution results are in QA_REPORT.md and qa352/. This file is
not a substitute for evidence or a claim of platform certification.

- Confirm source, title, manifest, launchers and both builds identify v3.5.2.
- Check immutable gameplay/art/audio/layout hashes against v3.5.1.
- Run Node tests, syntax validation and production build.
- Run both Score Chase browser formats and inherited regression suites serially.
- Verify first/near/tie/exceeded states; lock, retry, next, resume, restore, save
  import/export/clear, pace/mode/rules/start/chapter scopes and result agreement.
- Measure long values and neighboring geometry at all test viewports.
- Verify input/focus, reduced motion, high contrast, mute/background cancellation.
- Run model boundaries, rendered campaigns and normal-clock keyboard journey.
- Attempt real HTTP browser navigation; distinguish it from inline/Blob transport.
- Check native payloads, launchers, updater and corruption rejection.
- Freeze runtime hashes, create full ZIP, fresh-extract and rebuild identically.
- Repeat new feature and UI checks from that extraction.
- Verify final ZIP CRC, complete file manifest and frozen runtime bytes.

External release work remains: actual Mac/Windows/Safari/Firefox/Edge and real
Retina/GPU testing, human first-time-player study, prolonged subjective listening,
and live-host acceptance. Do not check these off from headless automation.
