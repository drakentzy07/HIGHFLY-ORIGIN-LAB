# C0-K1 Eastbrook restore — audited stage

Source original World of ClaudeCraft v0.44.7 commit 493c35a108cef6c8aa290e8793107b1cd117886e. HIGHFLY works from the pinned MIT simulation, authoritative zone1 layout, 3-D dock builder and original foliage placement generator. Never imports the original audio/textures/branding.

Source art: six already approved assets and twelve additional building GLTF/BIN files from official KayKit Medieval Hexagon Pack 1.0, pinned to 84fa4e91af6a88989be7c99e0891cede11f2ca38 and independently SHA256-approved. All are CC0; shared atlas is reused.

Features:
- Building mapping by original Eastbrook building ID: smithy->blacksmith, inn->tavern, chapel->church, harbour market->market, bank->barracks placeholder, houses->A/B.
- Eastbrook civic square, fences, benches and central monument represented with HIGHFLY procedural prototype geometry at original coordinates.
- Original Eastbrook piers from original MIT procedural renderer; three independently authored placeholder boats, **not** user-owned V7 ship asset yet, not dynamic ferries.
- Original generateDecorationsInBounds coordinates and variants, with temporary low-poly mesh foliage; still not native foliage renderer or Forest Nature models.
- One original HIGHFLY **temporary** humanoid created from our own authored geometry; no pre-existing KayKit/Claude character chosen as final Hunter. NPC humanoid visuals likewise original and follow original sim entities.
- Real Quaternius CC0 animated wolf attached ONLY to original sim entities recognized as wolves. POI portal to Wolf Run to find these, with no fake AI monster entities.
- World/Sim/loot/quest data preserved. Map editor not yet integrated. The original C0-J sector stream remains for other zones.
- Exact full v7 SOURCE collection has been independently opened and audited locally for shape, route, triangle counts and CC0 LICENSE; it is NOT exported into GitHub or Pages.
- Browser CI gates loading, town models, actor, landmarks, movement, SHA256 and license gate. Screenshot/Android manual approval still required; no claim of full restoration yet.

Known design limitations: Eastbrook original town shader, interiors, full environmental render pipeline, V7 ships and fauna presentation, original editor and mobile FPS profiling await later gates.
