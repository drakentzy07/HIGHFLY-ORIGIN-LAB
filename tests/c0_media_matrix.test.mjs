import test from 'node:test';
import assert from 'node:assert/strict';
import { policy, creditPatterns, patternMatch, decide, matchFile }
  from '../scripts/c0_media_matrix.mjs';

test('restricted and noncommercial entries cannot become release candidates',()=>{
  assert.equal(policy({redistribution:'With the project only',license:'Project asset'}),'EXCLUDE_PROJECT_ONLY');
  assert.equal(policy({redistribution:'**No, permission required**',license:'Proprietary'}),'EXCLUDE_PERMISSION_REQUIRED');
  assert.equal(policy({redistribution:'Non-commercial only, with attribution',license:'CC BY-NC 4.0'}),'EXCLUDE_NONCOMMERCIAL');
});
test('CC0 and attribution records remain review only',()=>{
  assert.equal(policy({redistribution:'Yes',license:'CC0 1.0'}),'CC0_SOURCE_REVIEW');
  assert.equal(policy({redistribution:'Yes, attribution required',license:'Apache-2.0'}),'ATTRIBUTION_REVIEW');
  assert.equal(policy({redistribution:'Yes, under SIL OFL 1.1',license:'OFL'}),'FONT_LICENSE_REVIEW');
  assert.equal(policy({redistribution:'Yes',license:'unknown'}),'OTHER_LICENSE_REVIEW');
});
test('path extractor sees explicit patterns and brace groups only',()=>{
  assert.deepEqual(creditPatterns('Bag icons (public/ui/items/{wolfhide_satchel,backpack}.webp)'),
    ['public/ui/items/backpack.webp','public/ui/items/wolfhide_satchel.webp']);
  assert.deepEqual(creditPatterns('Quaternius creatures; no concrete public path'),[]);
  assert.deepEqual(creditPatterns('public/textures/battleground/*.jpg'),
    ['public/textures/battleground/*.jpg']);
});
test('filename globs do not cross folders and directory patterns are conservative',()=>{
  assert.equal(patternMatch('public/ui/items/*.webp','public/ui/items/bag.webp'),true);
  assert.equal(patternMatch('public/ui/items/*.webp','public/ui/items/sub/bag.webp'),false);
  assert.equal(patternMatch('public/ui/items/','public/ui/items/sub/bag.webp'),true);
  assert.equal(patternMatch('public/vfx/fel_meteor_impact.png','public/vfx/fel_meteor_impact.png'),true);
  assert.equal(patternMatch('public/vfx/fel_meteor_impact.png','public/vfx/fel_meteor_impact_2.png'),false);
});
test('deny always overrides less specific candidate match',()=>{
  assert.equal(decide([{policy:'CC0_SOURCE_REVIEW'},{policy:'EXCLUDE_PROJECT_ONLY'}]),
    'EXCLUDE_PROJECT_ONLY');
  assert.equal(decide([{policy:'ATTRIBUTION_REVIEW'},{policy:'EXCLUDE_PERMISSION_REQUIRED'}]),
    'EXCLUDE_PERMISSION_REQUIRED');
  assert.equal(decide([]),'BLOCKED_NO_EXPLICIT_CREDIT_MATCH');
  assert.equal(decide([{policy:'CC0_SOURCE_REVIEW'},{policy:'ATTRIBUTION_REVIEW'}]),
    'BLOCKED_CONFLICTING_CREDITS');
});
test('never guess a right from a creative-looking folder or a file extension',()=>{
  const patterns=[{row:21,policy:'EXCLUDE_PROJECT_ONLY',patterns:['public/models/city/wall_tower.glb']},
    {row:2,policy:'CC0_SOURCE_REVIEW',patterns:['public/models/city/*.glb']}];
  assert.equal(matchFile('public/models/city/wall_tower.glb',patterns).status,'EXCLUDE_PROJECT_ONLY');
  assert.equal(matchFile('public/models/city/inn.glb',patterns).status,'CC0_SOURCE_REVIEW');
  assert.equal(matchFile('public/models/creatures/pretty_wolf.glb',patterns).status,
    'BLOCKED_NO_EXPLICIT_CREDIT_MATCH');
});
