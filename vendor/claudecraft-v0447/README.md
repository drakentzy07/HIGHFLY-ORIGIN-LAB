# ClaudeCraft v0.44.7 — HIGHFLY C0 MIT staging

This directory contains ONLY a tiny, unchanged selection of **source code** from the official v0.44.7 tag of [World of ClaudeCraft](https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7).

**Not a playable game, not yet a complete engine, and not a replacement for the upstream repo.**

- Provenance and original Git blob SHA-1 identifiers: [MANIFEST.json](MANIFEST.json).
- Original MIT licence and copyright (c) 2026 Levy Street: [LICENSE](LICENSE).
- Verify integrity and unexpected files: run node scripts/c0_verify_vendored.mjs from HIGHFLY repo root.
- Code has NOT been edited, adapted, integrated or executed as a game.
- No models, media, original gameplay assets or restricted materials are staged here.
- Importing further code requires understanding its TypeScript dependencies and preserving tests.
- Future HIGHFLY-only modifications must stay separate from this immutable snapshot or update provenance after a deliberate change.

## Current individual modules

| Exact upstream path | Reason for preliminary staging |
|---|---|
| src/sim/rng.ts | deterministic RNG and procedural noise primitives |
| src/sim/world_seed.ts | original seeded world identity |
| src/sim/geometry2d.ts | map/building polygon geometry functions |
| src/sim/mob/aggro_ranges.ts | enemy aggro and roaming limits |

Media licences are independent: [upstream CREDITS.md](https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md). HIGHFLY excludes all "With the project only" assets as a project policy.
