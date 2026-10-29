import test from 'node:test';
import assert from 'node:assert/strict';
import { importSpecifiers, assetReferences, resolveRelative, analyzeSources }
  from '../scripts/c0_dependency_graph.mjs';

test('discover static and dynamic relative imports', () => {
  const s = [
    "import { foo } from './foo';",
    "import './side-effect';",
    "export { bar } from '../bar';",
    "const x = await import('./dynamic');",
    "const y = require('./legacy');",
    "import { something } from 'three';"
  ].join('\n');
  assert.deepEqual(importSpecifiers(s).sort(),
    ['./foo', './side-effect', '../bar', './dynamic', './legacy'].sort());
});
test('assets listed in strings require manual validation', () => {
  assert.deepEqual(assetReferences('const a="/models/wolf.glb"; const b="/audio/a.ogg"'),
    ['/audio/a.ogg', '/models/wolf.glb']);
});
test('resolve known modules without guessing nonexistent files', () => {
  const known = new Set(['src/sim/world.ts', 'src/sim/rng.ts', 'src/sim/mob/index.ts']);
  assert.equal(resolveRelative('src/sim/world.ts', './rng', known), 'src/sim/rng.ts');
  assert.equal(resolveRelative('src/sim/world.ts', './mob', known), 'src/sim/mob/index.ts');
  assert.equal(resolveRelative('src/sim/world.ts', './missing', known), null);
});
test('world closure counts scanned imports and tracks missing', () => {
  const sources = new Map([
    ['src/sim/world.ts', "import './rng'; import './missing'; import '../ui/x'; const a='/models/wolf.glb'"],
    ['src/sim/rng.ts', 'export const x = 1']
  ]);
  const result = analyzeSources(sources);
  assert.equal(result.closures.find((x) => x.root === 'src/sim/world.ts').reachableScannedModules, 2);
  assert.equal(result.mediaRefs.length, 1);
  assert.equal(result.unresolved.length, 2);
});
