# v3.5.0 current release evidence

Start with release-summary.json and ../docs/QA_REPORT.md. Completed current-SHA
reports are at this level; development-attempts/ and initial-regression/ contain
failed/interrupted/pre-correction runs, not current pass counts.

flow-model-full.json.gz retains every boundary-case row. flow-model.json is its
readable summary. Fresh-extraction logs/JSON repeat the candidate ZIP tests; those
38 checks are not added to the 228 unique named browser checks.

Most scenes are controlled fixtures. live-journey.json uses normal time and actual
keyboard events without forced words. Neither is a human playtest.

Captures are curated under ../docs/screenshots/v3.5.0/. App assets and masters were
not recompressed. Scripts recreate native PNG evidence when rerun.
