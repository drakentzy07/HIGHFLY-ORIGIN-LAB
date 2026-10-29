// HIGHFLY C0-C: execute ORIGINAL upstream data and terrain modules from a
// read-only sparse checkout. This script does not export upstream source or media.
// Run from the repository workspace with highfly/ and upstream/ as siblings.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import * as data from '../../upstream/src/sim/data.ts';
import * as world from '../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../upstream/src/sim/world_seed.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('WORLD BASELINE FAILED: ' + message);
}
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function size(value: unknown): number {
  return Array.isArray(value) ? value.length : Object.keys(asRecord(value)).length;
}
function core() {
  const tables = {
    zones: data.ZONES,
    mobs: data.MOBS,
    npcs: data.NPCS,
    items: data.ITEMS,
    quests: data.QUESTS,
    camps: data.CAMPS,
    roads: data.ROADS,
    portals: data.PORTALS,
    props: data.PROPS,
    groundObjects: data.GROUND_OBJECTS,
    dungeons: data.DUNGEONS,
  };
  const counts = Object.fromEntries(Object.entries(tables).map(([key, val]) => [key, size(val)]));
  const props = asRecord(data.PROPS);
  counts.buildings = size(props.buildings);
  counts.stalls = size(props.stalls);
  counts.walls = size(props.walls);
  counts.campfires = size(props.campfires);
  counts.decorProps = size(props.decorProps);
  counts.wells = size(props.wells);
  counts.mines = size(props.mines);
  assert(WORLD_SEED === 20061, 'unexpected source seed — wrong reference?');
  for (const k of ['zones', 'mobs', 'npcs', 'items', 'quests', 'camps', 'roads', 'buildings']) {
    assert(counts[k] > 0, 'missing table or world content: ' + k);
  }
  assert(Array.isArray(data.ZONES) && data.ZONES.length === 15, 'expected 15 base zones on fixed v0.44.7');
  assert(Array.isArray(data.BUILTIN_WORLD?.zones), 'missing built-in world');
  assert(data.BUILTIN_WORLD.zones === data.ZONES, 'editor/sim zone table lost object identity');
  const starts = [
    { kind: 'playerStart', x: data.PLAYER_START.x, z: data.PLAYER_START.z },
    ...data.ZONES.map((zone: any, i: number) => ({
      kind: 'zone' + i,
      x: ((zone.xMin ?? data.STRIP_MIN_X) + (zone.xMax ?? data.STRIP_MAX_X)) / 2,
      z: (zone.zMin + zone.zMax) / 2,
    })),
  ];
  const heights = starts.map(({kind,x,z})=>({kind,x,z,
    height: world.terrainHeight(x,z,WORLD_SEED)}));
  for (const sample of heights) {
    assert(Number.isFinite(sample.x) && Number.isFinite(sample.z),
      'non-finite position for ' + sample.kind);
    assert(Number.isFinite(sample.height),
      'non-finite terrain height for ' + sample.kind);
    // Deterministic world function must return same sample twice.
    assert(sample.height === world.terrainHeight(sample.x,sample.z,WORLD_SEED),
      'terrain height changed at ' + sample.kind);
  }
  const invalidCampMobIds = (data.CAMPS as any[])
    .filter(c=>c.mobId && !Object.hasOwn(data.MOBS,c.mobId))
    .map(c=>c.mobId);
  const zoneDescriptors = (data.ZONES as any[])
    .map(z=>({id:String(z.id ?? z.name ?? 'unknown'),zMin:z.zMin,zMax:z.zMax}));
  const report = {
    title:'C0-C original upstream world data and terrain smoke test',
    source:'World of ClaudeCraft v0.44.7',
    sourceCommit:'493c35a108cef6c8aa290e8793107b1cd117886e',
    execution:'READ-ONLY original TypeScript modules, no source copied',
    result:'PASS',
    worldSeed:WORLD_SEED,
    counts,zoneDescriptors,
    samples:heights,
    danglingCampMobRefs:invalidCampMobIds.length,
    danglingCampMobIds:[...new Set(invalidCampMobIds)].slice(0,20),
    dataIsBuildCleared:false,
    playableBuildProduced:false,
    note:'Executable original data baseline only; resources, editor, runtime Sim ticks, and licence clearance remain untested.'
  };
  return report;
}
const report=core();
const out=process.env.C0_WORLD_REPORT_DIR || 'highfly/reports/c0/world';
await mkdir(out,{recursive:true});
await writeFile(join(out,'world-baseline.json'),JSON.stringify(report,null,2)+'\n');
const lines=[
  '# HIGHFLY C0-C — world data smoke',
  '',
  '- Result: **PASS**',
  '- Source: v0.44.7 / '+report.sourceCommit,
  '- Origin world seed: '+report.worldSeed,
  '- Entries: '+Object.entries(report.counts).map(([k,v])=>k+'='+v).join('; '),
  '- Zone terrain samples finite and deterministic: '+report.samples.length,
  '- Camp references to unknown mob templates: '+report.danglingCampMobRefs+' (review if nonzero)',
  '',
  'The real data and procedural terrain ran in an isolated read-only checkout.',
  '**No media clearance, game build, player movement or full Sim gameplay is claimed.**',
  ''
];
await writeFile(join(out,'summary.md'),lines.join('\n'));
console.log(lines.join('\n'));
