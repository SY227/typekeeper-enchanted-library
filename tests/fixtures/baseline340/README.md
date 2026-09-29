# Immutable 3.4.0 gameplay reference

These files are copied byte-for-byte from the user-supplied 3.4.0 full app. They are NOT shipped into dist or PLAY.html. Tests import both old and new models and compare authoritative state under identical actions. New multiplier notification events are the only intentionally added model events; scoring, resources, RNG, spawn flow, timing and results must agree. The baseline hash manifest is independent of the changed model. Do not regenerate this fixture to make a parity failure pass.
