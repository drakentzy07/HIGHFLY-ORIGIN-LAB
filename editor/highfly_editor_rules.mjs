// HIGHFLY World Editor — strict independent-asset and metric placement policy.
// Derived design from MIT World of ClaudeCraft v0.44.7 map editor; modified for
// HIGHFLY's independent world overlay. Copyright (c) 2026 Levy Street (upstream).
// Original MIT license: vendor/claudecraft-v0447/LICENSE
// Source: https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7/src/editor
//
// Pure module. No Three.js, no DOM, no network, no asset downloads.
// The working editor must keep all non-approved media OUT of its asset browser.

export const HIGHFLY_EDITOR_SCHEMA=1;
export const TARGET_AVATAR_HEIGHT_METERS=1.70;
export const LICENSES_ALLOWED=new Set(['CC0-1.0','MIT']);
const DISPLAYABLE_EXT=/\.(?:glb|gltf)$/i;
const SAFE_PATH=/^assets\/[a-z0-9_/-]+\.(?:glb|gltf)$/i;

export function catalogFromApprovedManifest(manifest){
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets))
    throw new Error('INVALID_HIGHFLY_ASSET_MANIFEST');
  const unique=new Set(),catalog=[];
  for(const a of manifest.assets){
    if(!DISPLAYABLE_EXT.test(a?.path??''))continue;
    if(!SAFE_PATH.test(a.path)||!LICENSES_ALLOWED.has(a.license)||
       !/^[0-9a-f]{64}$/i.test(a.sha256??'')||!a.sourceUrl||!a.licenseEvidence)
      throw new Error('UNAPPROVED_EDITOR_ASSET: '+String(a?.path));
    if(unique.has(a.path))throw new Error('DUPLICATE_EDITOR_ASSET: '+a.path);
    unique.add(a.path);
    const rel=a.path.slice('assets/'.length),parts=rel.split('/');
    const filename=parts.at(-1);
    catalog.push(Object.freeze({
      id:rel.replace(/\.(?:gltf|glb)$/i,''),
      path:a.path,
      label:filename.replace(/\.(?:gltf|glb)$/i,'').replaceAll('_',' '),
      category:parts[0],
      license:a.license,
      sha256:a.sha256,
      sourceUrl:a.sourceUrl,
      licenseEvidence:a.licenseEvidence
    }));
  }
  return Object.freeze(catalog);
}

// All source models have different local units; use the VERIFIED source height.
// ClaudeCraft's generic `TARGET_HEIGHT=2.2` for every model is forbidden here.
// unitsPerMeter must be calibrated for the shared Sim/renderer world, never guessed.
export function metricModelScale({sourceHeightUnits,targetHeightMeters,unitsPerMeter}){
  for(const [key,value] of Object.entries({sourceHeightUnits,targetHeightMeters,unitsPerMeter})){
    if(typeof value!=='number'||!Number.isFinite(value)||value<=0)
      throw new Error('INVALID_METRIC_'+key);
  }
  return targetHeightMeters*unitsPerMeter/sourceHeightUnits;
}

export function canonicalPlacement(asset,position,opts={}){
  if(!asset||!LICENSES_ALLOWED.has(asset.license)||!SAFE_PATH.test(asset.path))
    throw new Error('ASSET_NOT_APPROVED_FOR_EDITOR');
  if(!Number.isFinite(position?.x)||!Number.isFinite(position?.z))
    throw new Error('INVALID_WORLD_COORDINATES');
  const {sourceHeightUnits,targetHeightMeters,unitsPerMeter,rotationRadians=0,
         collide=true,semantic='building'}=opts;
  if(!Number.isFinite(rotationRadians))throw new Error('INVALID_ROTATION');
  const scale=metricModelScale({sourceHeightUnits,targetHeightMeters,unitsPerMeter});
  return Object.freeze({assetId:asset.id,x:position.x,z:position.z,
    rotY:rotationRadians,scale,collide,semantic,
    requestedHeightMeters:targetHeightMeters,sourceHeightUnits,unitsPerMeter});
}

// Non-destructive world editing: do NOT clone a half-world or write back into
// original Eastbrook, its NPCs, camps, quest anchors or coordinates.
export function newHighflyWorldOverlay({upstreamCommit,worldSeedId}){
  if(!/^[0-9a-f]{40}$/i.test(upstreamCommit??''))throw new Error('MISSING_PINNED_UPSTREAM');
  if(!String(worldSeedId??'').trim())throw new Error('MISSING_WORLD_SEED_REFERENCE');
  return {schemaVersion:HIGHFLY_EDITOR_SCHEMA,upstreamCommit,worldSeedId,
    placements:[],roads:[],terrainEdits:[],districts:[],portals:[],playerSpawn:null};
}

export function appendApprovedPlacement(overlay,placement,catalog){
  if(overlay?.schemaVersion!==HIGHFLY_EDITOR_SCHEMA||
     !Array.isArray(overlay.placements)||!Array.isArray(catalog))
    throw new Error('INVALID_EDITOR_DOCUMENT');
  const asset=catalog.find(a=>a.id===placement?.assetId);
  if(!asset)throw new Error('ASSET_NOT_IN_WHITELIST');
  if(!Number.isFinite(placement.x)||!Number.isFinite(placement.z)||
     !Number.isFinite(placement.scale)||placement.scale<=0)
    throw new Error('INVALID_PLACEMENT');
  // Immutable overlay update to prevent edits leaking back into the original Sim.
  return {...overlay,placements:[...overlay.placements,{...placement}]};
}
