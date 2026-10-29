import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  TARGET_AVATAR_HEIGHT_METERS,LICENSES_ALLOWED,
  catalogFromApprovedManifest,metricModelScale,canonicalPlacement,
  newHighflyWorldOverlay,appendApprovedPlacement
} from '../editor/highfly_editor_rules.mjs';

const realManifest=JSON.parse(readFileSync(new URL('../config/c0_approved_assets.json',import.meta.url),'utf8'));
const realGlossary=JSON.parse(readFileSync(new URL('../config/k6_upstream_media_glossary.json',import.meta.url),'utf8'));

test('the inventory covers ALL CREDITS rows without treating family entries as approvals',()=>{
  assert.equal(realGlossary.records.length,255);
  assert.ok(realGlossary.records.every(x=>x.fileVerification==='PENDING'));
  assert.equal(realGlossary.records.filter(x=>x.decision==='EXCLUDE_PROJECT_DEPENDENCY').length,137);
  assert.equal(realGlossary.records.filter(x=>x.decision==='EXCLUDE_RIGHTS_RESERVED').length,69);
  assert.equal(realGlossary.records.filter(x=>x.decision==='EXCLUDE_NONCOMMERCIAL').length,9);
});

test('only SHA-pinned CC0/MIT visible models from HIGHFLY approved manifest reach editor',()=>{
  const catalog=catalogFromApprovedManifest(realManifest);
  assert.ok(catalog.length>0);
  assert.ok(catalog.every(x=>LICENSES_ALLOWED.has(x.license)&&x.path.startsWith('assets/')));
  assert.ok(catalog.every(x=>!x.path.includes('CraftPix')&&!x.path.includes('projects/')));
  assert.ok(!catalog.some(x=>/\.mp3$|\.png$|\.wasm$/i.test(x.path)));
  assert.ok(catalog.some(x=>/building_castle/.test(x.id)));
});
test('strict catalog rejects project-only or unverified media',()=>{
  const sample={...realManifest.assets.find(x=>/\.gl(?:tf|b)$/.test(x.path))};
  assert.throws(()=>catalogFromApprovedManifest({schemaVersion:1,assets:[{...sample,license:'With the project only'}]}),/UNAPPROVED_EDITOR_ASSET/);
  assert.throws(()=>catalogFromApprovedManifest({schemaVersion:1,assets:[{...sample,sha256:'wrong'}]}),/UNAPPROVED_EDITOR_ASSET/);
});
test('canonical metric scale is based on measured height, not universal 2.2 normalizer',()=>{
  assert.equal(TARGET_AVATAR_HEIGHT_METERS,1.7);
  assert.equal(metricModelScale({sourceHeightUnits:2,targetHeightMeters:8,unitsPerMeter:1}),4);
  assert.equal(metricModelScale({sourceHeightUnits:2,targetHeightMeters:8,unitsPerMeter:1.5}),6);
  assert.throws(()=>metricModelScale({sourceHeightUnits:0,targetHeightMeters:8,unitsPerMeter:1}),/INVALID_METRIC/);
});
test('independent overlay adds placements without modifying source or preceding snapshots',()=>{
  const assets=catalogFromApprovedManifest(realManifest);
  const castle=assets.find(x=>/building_castle/.test(x.id));
  const original=newHighflyWorldOverlay({
    upstreamCommit:'493c35a108cef6c8aa290e8793107b1cd117886e',
    worldSeedId:'src/sim/world_seed.ts'
  });
  const placement=canonicalPlacement(castle,{x:24,z:-120},{sourceHeightUnits:4,targetHeightMeters:12,unitsPerMeter:1});
  const result=appendApprovedPlacement(original,placement,assets);
  assert.equal(original.placements.length,0);
  assert.equal(result.placements.length,1);
  assert.equal(result.placements[0].scale,3);
  assert.throws(()=>appendApprovedPlacement(original,{...placement,assetId:'proprietary/icon'},assets),/ASSET_NOT_IN_WHITELIST/);
});
