# Reference and evidence boundary

User's longer video: https://www.youtube.com/watch?v=O1b81SRshpE
Earlier video: https://www.youtube.com/watch?v=2eRBN-hLKCY

The watch page and exact-ID retrieval did not provide playable frames/audio in this environment. No timestamped music observations, original tempo/instrument identification, frame timings or new original-game mechanics are claimed. The baseline code and the user's explicit requests are the basis of this polish release.

New authored choices in v3: the Typekeeper identity, editorial reduction, focused HUD, settings layout, optional resume count, new score, scene mixing and data/interaction fixes. Preserved v2 rules, stage content and expressions are documented in RULES.md, rather than silently presented as verified historical-game constants.

Primary implementation reference for loop semantics: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/loop . Buffer sources are scheduled together and reused by gain automation; the actual game implementation and audits, not a generic API page, establish what this release does.

A usable MP4 is still needed for any later request for frame/audio parity. The current goal is the user's Typekeeper adaptation, not a claim of exact reproduction.
