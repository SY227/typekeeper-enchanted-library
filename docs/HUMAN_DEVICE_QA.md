# Human, device and long-session acceptance — not yet executed

These are remaining validation tasks, not results. Automated results are in
QA_REPORT.md. No claim of retention, fun, sales or platform certification follows
from synthetic players or screenshot coverage.

## First-use study

Recruit 12–18 non-developers spanning measured typing familiarity. Let the first
10 minutes run without verbal instruction. Then sample practice chapters from
Clockwork, Frost and Eternal Library. Record actual observations and quotes; do
not lead participants to the expected answer.

| Question | Suggested initial acceptance target | Observed |
|---|---|---|
| Does a new player submit the first word without coaching? | At least 8/10 within 30 seconds | Not measured |
| Can they explain why they lost a star after seeing results? | At least 8/10 correctly distinguish misses and wrong submissions | Not measured |
| Do they understand that FIRE saves the board but earns no words/points? | Record misunderstanding and teach only after observation | Not measured |
| Can they identify a genuine personal improvement? | Record unaided understanding, not just a click | Not measured |
| Does the wing/finale moment feel rewarding rather than obstructive? | Observe skips, misclicks and recall; no predetermined 'fun' score | Not measured |

These are internal design targets, not industry statistics. This sample is for
finding usability problems, not estimating population retention.

## Real-device/browser matrix

- [ ] Mac laptop: Chrome and Safari; built-in keyboard; actual Retina display.
- [ ] Windows laptop: Chrome/Edge and Firefox; integrated GPU; keyboard shortcuts.
- [ ] 1280×720, 1366×768, 1920×1080 and a small-height browser window.
- [ ] High DPI, OS/browser text scaling, high contrast, reduced motion.
- [ ] Actual downloaded PLAY.html opened from Finder/Explorer, including save access.
- [ ] Modular site over the actual deployment URL, reload, asset cache refresh.
- [ ] Old-save import, export/re-import and same-origin upgrade continuity.
- [ ] Keyboard layout variants, held Enter, selection editing, IME composition.
- [ ] Independent music/SFX settings, mute, rejected/failed audio unlock.
- [ ] Tab hide/return, display sleep, focus loss and resume countdown.
- [ ] Extended dense typing, all spell combinations, repeated restarts and final stage.
- [ ] Network offline after load, no API dependency; interruption must not corrupt save.

## 20–30 minute audio session

Use both laptop speakers and headphones at low and normal volume. Check repetitive
keystroke fatigue, danger cue audibility, speech/music interference from outside
the game, transitions between all four pressure layers, wing/finale endings,
click-free skip/mute and whether every important audio-only event also has a
visible state. This is a listening task; waveform limits and WebAudio node counts
do not substitute for it.

## Native performance

Measure the baseline, dense 12-card board, repeated FIRE/ICE and finale on target
hardware. Capture frame timing and input-to-visible latency separately. A 60Hz
headless render sample is not a hardware guarantee and not an input latency metric.
Log device, OS, browser version, power mode, display scale and recording overhead.


## v3.6.0 external Impact Pass checks — NOT EXECUTED

- [ ] Fresh players identify the selected candidate among shared prefixes without instruction.
- [ ] A miss is perceived as a page left on the desk; WIND is understood as relief.
- [ ] Rapid typing remains comfortable; key/return feedback never demands looking away from words.
- [ ] 20–30 minute headphone/speaker listening finds no repetitive transient fatigue.
- [ ] Real Mac/Windows/laptop/GPU and Safari/Chrome input/blur/resume/IME behavior.
- [ ] Live-origin save/Continue/PB export-import and reload, on the intended deployment URL.

These boxes intentionally remain empty; automated fixtures do not satisfy them.
