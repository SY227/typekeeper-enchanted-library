# Source and asset provenance — 3.1

Baseline: the user-uploaded Typekeeper_Enchanted_Library_v3.0_Full_App(1).zip.
No new art, music, fonts or external assets were introduced. The original 24 master files
and 22 public asset/manifest files are byte-identical. Layout HTML/CSS, audio code, icons,
chapter data and pressure thresholds are also hash-compared; see qa/preservation-audit.json.
That audit lists 52 unchanged files in those scopes, not a claim every source file is unchanged.

The prior v3 library/character imagery and registered facial expressions remain as supplied.
The existing Lanterns & Letters soundtrack, its stems, MIDI, synthesis script and masters
are retained. Earlier provenance is preserved in qa/v3-baseline/documentation/PROVENANCE.md
and MUSIC_PRODUCTION.md. No original-publisher art was newly extracted from video.

Renderer changes only correct feedback concurrency and inactive SLOW-state depiction.
The screenshots are actual controlled browser states. Example scores in screenshots/test
saves are synthetic QA data and never prepopulate a normal player's game.

No font binaries are packaged. Runtime files stay local and do not rely on a font CDN,
remote audio, external inference service, advertising or telemetry. File hashes establish
integrity, not trademark clearance, publisher affiliation or commercial approval.
