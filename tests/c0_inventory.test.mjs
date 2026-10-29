import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPath, parseCredits, countsByStatus, csvCell } from '../scripts/c0_inventory.mjs';

test('simulation source is only a MIT candidate, not a final licence approval', () => {
  assert.equal(classifyPath('src/sim/world.ts'), 'CODE_MIT_CANDIDATE');
  assert.equal(classifyPath('src/sim/mob/aggro_ranges.ts'), 'CODE_MIT_CANDIDATE');
  assert.equal(classifyPath('src/editor/3d/viewport.ts'), 'CODE_MIT_CANDIDATE');
  assert.equal(classifyPath('server/routes.ts'), 'CODE_MIT_CANDIDATE');
});
test('never auto-approve media just because original repository is MIT', () => {
  assert.equal(classifyPath('public/models/creatures/wolf.glb'), 'REVIEW_MEDIA');
  assert.equal(classifyPath('public/textures/grass.webp'), 'REVIEW_MEDIA');
  assert.equal(classifyPath('public/audio/sfx.ogg'), 'REVIEW_MEDIA');
  assert.equal(classifyPath('public/ui/skills/warrior/strike.webp'), 'REVIEW_MEDIA');
  assert.equal(classifyPath('src/render/assets/character.png'), 'REVIEW_MEDIA');
});
test('explicitly restricted and project-only examples are excluded', () => {
  assert.equal(classifyPath('public/models/city/wall_tower.glb'), 'EXCLUDE_OR_REPLACE');
  assert.equal(classifyPath('public/textures/battleground/decals/foo.webp'), 'EXCLUDE_OR_REPLACE');
  assert.equal(classifyPath('public/vfx/fel_meteor_impact.png'), 'EXCLUDE_OR_REPLACE');
  assert.equal(classifyPath('public/claudium/art.webp'), 'EXCLUDE_OR_REPLACE');
  assert.equal(classifyPath('public/woc-logo-hero.webp'), 'EXCLUDE_OR_REPLACE');
});
test('unknown and source-neutral files remain pending', () => {
  assert.equal(classifyPath('public/custom/map.json'), 'REVIEW_OTHER');
  assert.equal(classifyPath('public/ui/mapping.json'), 'REVIEW_OTHER');
  assert.equal(classifyPath('LICENSE'), 'NOTICE');
  assert.equal(classifyPath('CREDITS.md'), 'NOTICE');
});
test('parse only five-column matching credit tables', () => {
  const text = [
    '# Credits', '',
    '| Assets | Author | Source | License | Redistribution |',
    '|---|---|---|---|---|',
    '| Wolf GLB | Quaternius | link | CC0 | Yes |',
    '| Wall tower | Owner | generated | Project asset | With the project only |',
    '',
    'Another table', '',
    '| Name | Status |', '|----|----|', '| Unknown | Yes |'
  ].join('\n');
  const data = parseCredits(text);
  assert.equal(data.length, 2);
  assert.deepEqual(data.map((x) => x.redistribution), ['Yes', 'With the project only']);
});
test('csv escapes quotes and spreadsheet-breaking commas', () => {
  assert.equal(csvCell('A,"B"'), '"A,""B"""');
});
test('summarize labels by status', () => {
  assert.deepEqual(countsByStatus([{ status: 'REVIEW_MEDIA' }, { status: 'REVIEW_MEDIA' },
    { status: 'NOTICE' }]), { REVIEW_MEDIA: 2, NOTICE: 1 });
});
