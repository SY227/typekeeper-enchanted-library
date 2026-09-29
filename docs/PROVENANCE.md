> **v3.6.2 provenance:** available full baseline is v3.6.0 (SHA-256
> b365782d99f7a0f62d787a85607802adc3d83f54fa07122b36819b6ea45100d7).
> Above-book labels are reapplied from the supplied v3.6.1 preview; no v3.6.1 source
> ZIP was available. Original art, music, masters, gameplay and 85 pinned foundation
> files are unchanged. This release adds the fresh-campaign entry, not a reset system.
> See FRESH_JOURNEY_SPEC.md and QA_REPORT.md. Material below is historical provenance.

> **v3.5.1 addendum:** See [UI_SPACING_SPEC.md](UI_SPACING_SPEC.md) for this release’s UI-only changes and [QA_REPORT.md](QA_REPORT.md) for current evidence. The material below describes retained systems or earlier decisions.

# Source and asset provenance — 3.2

Baseline: the user-uploaded Typekeeper_Enchanted_Library_v3.1_Full_App(1).zip.
The original 24 asset-source files and 21 previous runtime art/audio files are
byte-identical. The asset manifest is intentionally regenerated for two additions.
Chapter data, controls, pressure bands, clock, icons, HTML layout and Vercel config
are also retained: 52 unchanged files in the stated scope, not every source file.
All three dictionary arrays deep-equal the baseline (746 entries).

New pressure/urgency audio is original deterministic mathematical synthesis,
with no third-party recordings, sample packs or extracted source-video audio.
The two new mono runtime MP3 files, FLAC masters, editable MIDI, authored event
JSON and generation script are included. The 40-second pressure-preview mix
is a demonstration rather than gameplay. The SFX reel is rendered from the
actual GameAudio class in OfflineAudioContext and has a labeled cue sheet.

Typing sheen and score glints are Canvas effects, not generated replacement
illustrations. New interface markup only adds controls/feedback within the
existing design. Original painted library, typist and face masters are retained.
Earlier source lineage is archived under qa/v3.1-baseline/documentation and
qa/v3.1-baseline/v3-baseline/documentation.

No original-publisher visuals/sounds were newly extracted. The reference video's
moving frames/audio were inaccessible; new cues do not claim historical parity.
No fonts, account secrets, external sample libraries or model keys are bundled.
The normal game loads only its own supplied assets and has no telemetry backend.

Screenshots show actual controlled browser fixtures. Their scores are QA data,
not preloaded records or independent human play. Hashes establish file integrity,
not trademark clearance, third-party affiliation or commercial approval.
