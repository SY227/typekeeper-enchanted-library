# Open Atrium release checklist

Completed current-runtime automated suites and the remaining external tests are
listed separately in QA_REPORT.md. A new version number is not platform approval.

- [x] Targeted environment change; no gameplay or HUD geometry changes.
- [x] Original source/assets and exact renderer delta preservation tests.
- [x] Normal/high contrast and reduced motion checks.
- [x] Same-build standalone and modular browser regression.
- [x] High pressure, all chapters, spells and input state coverage.
- [x] Normal-clock automated keyboard and overload/recovery recordings.
- [x] Native payload/launcher and backup-first updater checks on Linux.
- [ ] Native macOS/Windows/Safari/Firefox/Edge device matrix.
- [ ] Real browser-origin upgrade/reload persistence on live hosting.
- [ ] Human readability, comfort and preference study; extended listening.
- [ ] Steam/native packaging and distribution approval (outside this change).

Fresh ZIP extraction and final archive integrity: see QA_REPORT.md section 10.
