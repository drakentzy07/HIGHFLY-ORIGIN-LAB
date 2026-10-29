// HIGHFLY C0-D: run REAL unmodified upstream Sim + a hostile mob in a
// disposable read-only sparse checkout. Not an asset audit or a playable build.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Sim } from '../../upstream/src/sim/sim.ts';
import { createMob } from '../../upstream/src/sim/entity.ts';
import { MOBS } from '../../upstream/src/sim/data.ts';
import { WORLD_SEED } from '../../upstream/src/sim/world_seed.ts';

function requireInvariant(c: unknown, reason: string): asserts c {
  if (!c) throw new Error('C0-D SIM BASELINE FAIL: ' + reason);
}
const sim = new Sim({ seed: WORLD_SEED, playerClass: 'warrior', noPlayer: true });
requireInvariant(sim.entities instanceof Map, 'entities Map unavailable');
const populationBeforePlayer = sim.entities.size;
requireInvariant(populationBeforePlayer > 0, 'world populated no entities');
const pid = sim.addPlayer('warrior', 'HIGHFLY_C0_Probe');
requireInvariant(typeof pid === 'number', 'invalid player entity id');
const player = sim.entities.get(pid);
requireInvariant(player, 'player did not spawn');
requireInvariant(Number.isFinite(player.pos.x) && Number.isFinite(player.pos.z), 'player position is not finite');
requireInvariant(MOBS.forest_wolf, 'base forest_wolf template missing');
const wolf = createMob(sim.nextId++, MOBS.forest_wolf, 1, {
  x: player.pos.x + 6,
  y: player.pos.y,
  z: player.pos.z + 6,
});
requireInvariant(wolf && typeof wolf.id === 'number', 'wolf model/entity could not be created');
sim.addEntity(wolf);
requireInvariant(sim.entities.has(wolf.id), 'wolf not added to real Sim roster');
const wolfBefore = { x:wolf.pos.x, y:wolf.pos.y, z:wolf.pos.z, aiState:wolf.aiState };
const timeBefore = Number(sim.time ?? 0);
for (let i=0;i<12;i++) sim.tick();
const wolfAfter = { x:wolf.pos.x, y:wolf.pos.y, z:wolf.pos.z, aiState:wolf.aiState };
requireInvariant(Number.isFinite(wolf.pos.x) && Number.isFinite(wolf.pos.y) && Number.isFinite(wolf.pos.z),
  'mob position became invalid after real simulation ticks');
requireInvariant(Number.isFinite(player.hp), 'player health became invalid after ticks');
const result = {
  title:'HIGHFLY C0-D REAL original Sim smoke',
  upstream:'v0.44.7',
  sourceCommit:'493c35a108cef6c8aa290e8793107b1cd117886e',
  status:'PASS',
  seededWorldEntities:populationBeforePlayer,
  entitiesAfter:sim.entities.size,
  playerId:pid,
  playerAlive:player.hp > 0,
  simulationTicks:12,
  simulatedSecondsApprox:0.6,
  timeBefore,timeAfter:Number(sim.time ?? 0),
  wolfId:wolf.id,
  wolfTemplateId:MOBS.forest_wolf.id,
  wolfBefore,wolfAfter,
  noAssetsCopied:true,
  codeImportedToHighfly:false,
  graphicsRendered:false,
  note:'Original simulation, single player, NPC/mob population and wolf entity only. No license clearance of media and no browser build.'
};
const path='highfly/reports/c0/sim';
await mkdir(path,{recursive:true});
await writeFile(join(path,'sim-baseline.json'),JSON.stringify(result,null,2)+'\n');
const lines=[
  '# HIGHFLY C0-D — original simulation smoke',
  '',
  '- Result: **PASS**',
  '- Pre-player world entity count: '+result.seededWorldEntities,
  '- Entities after injection + 12 ticks: '+result.entitiesAfter,
  '- Spawned player and forest_wolf with REAL source entity factory',
  '- Wolf before: '+JSON.stringify(result.wolfBefore),
  '- Wolf after: '+JSON.stringify(result.wolfAfter),
  '- Player alive: '+result.playerAlive,
  '- Full RPG migrated: **NO**',
  '- Cleared media: **NO**',
  '',
  'No source or media copied into the public HIGHFLY repository.',
  ''
];
await writeFile(join(path,'summary.md'),lines.join('\n'));
console.log(lines.join('\n'));
