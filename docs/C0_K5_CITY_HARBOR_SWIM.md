# HIGHFLY K5 — Expanded Eastbrook, harbor slips and shoreline traversal

## Baseline and provenance
Branch `c0-k5-walled-city-harbor-fixes` starts at K4 `923a43f9f7eeedc4362838b2f70e96f6717a5cf2`. Pinned upstream ClaudeCraft v0.44.7 `493c35a108cef6c8aa290e8793107b1cd117886e` remains immutable. Approved public KayKit CC0, Quaternius and explicit media whitelist remain unchanged. Exclude AnyRPG, CraftPix and unapproved/unknown license media.

## Review of the four-minute-twenty-two-second S23 test
- 0:18–0:30 houses/market outside K4 40-m radius; K5 creates 72m perimeter offset toward the original harbor district, preserving original 11 building placements.
- 0:33–1:05 gate panels and arch clip into terrain/wall; hide faulty pivoting leaves, resize the existing licensed wall/arch geometry to match the 40 surveyed spans.
- 1:09–1:25 some apparent invisible wall collisions; within rebuilt city, replace legacy footprint collision with currently visible building shell outlines plus authored fortress.
- 1:30–2:12 city too crowded: retain real castle/chapel/market/inn/smithy and room for additional districts; do not invent new licensed models.
- 2:18–2:48 real Sim corpses/loot/inventory stack functioning; preserve original `Sim.lootCorpse`, `corpseCanInteract`, no dropped cube items.
- 3:24–3:33 character below sea surface; K5 floats at the actual sampled water surface, reduces water speed and uses a native swim clip where available or a visibly animated surface-swim fallback.
- 3:57–4:22 three bright vessels over piers; anchor to original three-pier world coordinates; desaturate licensed hull material copies.

## Automatic K5 gates
- K4 controls, WebGL boot, full world streaming, source Sim, media/license checks and combat/loot HUD remain mandatory.
- K5 adds checks for 72m city radius, 11 original Eastbrook buildings, 2 unobstructed gates and geometrically valid harbor berth coordinates.
- Browser-green is NOT proof of perfect boat boarding collision, complete swimming animation quality, or all monster death animations on S23.

## Next intended city content
The full user-purchased KayKit Complete archive is NOT checked into this repo. Current build uses the already whitelisted public official Hexagon subset. The later layout should reserve named districts for guild, blacksmith, apothecary, armorer, church, market, inns, houses, cultivation, keep, waterfront and interiors, without moving original NPC/quests unless explicitly adapted with regression tests. Boat deck/boarding physics remains to be verified with mesh bounds and player tests.
