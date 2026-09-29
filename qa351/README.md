# Current v3.5.1 evidence

QA_REPORT.md identifies the exact shipping bytes and enumerates completed gates.
Top-level final report JSONs are current; iterations/ and *initial*, *second*,
*interrupted* logs retain rejected/partial attempts, not additional passes.
Synthetic word/stock fixtures are not human play sessions. Browser screens execute
the actual release through in-memory standalone / Blob-module transport because
loopback navigation is blocked. Node/Python payload transport is checked separately.
Parallel browser processes initially hit the4 GiB container memory limit; the
final browser run is serial. Neither assertions nor the game are weakened to hide
resource failures. Human/device and live-hosting checks remain external.
