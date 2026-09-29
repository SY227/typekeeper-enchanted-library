# v3.6.4 — Bound & Balanced

## Requested changes
Chapter 3 and Chapter 4 change from 13 to 14 required correct words in all three
paces, both Campaign and Practice. The first wing now totals 84 words instead of
82. No quota elsewhere is lowered or flattened; the course retains its escalation.
The stage number 13 and interim progress 13/14 are not removed.

## Art direction
Rebuilt the right-side first-wing reading folio as a supported physical object:
wooden lectern, asymmetric curved pages, thick layered page block, darker leather,
localized gutter/contact shadow, fine paper grain, restrained aged manuscript ink
and cloth bookmark. Related shelf volumes now use curved leather spines and quiet
wear. All new pigment/fiber detail is deterministic and baked into the existing
scene cache; it does not consume gameplay randomness or introduce a dependency.
The original atmosphere/atrial background and all main HUD/control geometry remain.

## Save and score compatibility
A quota change creates additional scoring opportunities, so the scoring namespace
is now `typekeeper-3.6.4`. Previous `typekeeper-3.2.1` scoped PB collections remain
preserved on load/export/import, while new-profile lookups only compare like with
like. Previous continued checkpoints keep their original score provenance and
show EARLIER RULES. Fresh Journey starts a new profile without clearing stars,
chapter access or historical PBs. Invalid unknown/future score profiles are rejected.

Migration tests also exposed a deduplication defect: records with identical dates,
scores and seeds in different paces could collapse into one record. Difficulty is
now part of the identity key. The supplied original save schema/key is unchanged.

## Production hygiene
Deployment excludes non-runtime QA/media and source masters from upload, not from
this full archive. Retained tests use exact declared deltas rather than weakening
old baseline checks or replacing original reference hashes. New tests cover real
14th-word completion, native input events, actual import/export UI and art masking.

## Scope not changed
No new spells, shop, login, controller scheme, global ranking, engine swap, level
count, audio, targeting rule, main HUD, input or pressure layout. Desktop/Steam
certification and independent human usability research are not claimed.
