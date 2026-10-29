// C0-G: compile a browser-only WebGL diagnostic from immutable upstream source.
// No upstream public/ assets or images are included: esbuild bundles TS+Three.js.
// CI must execute the release gate after building, before uploading this artifact.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root=resolve('.');
const out=join(root,'highfly/dist');
await mkdir(out,{recursive:true});
const source=join(root,'upstream/src/sim/world.ts');
const original=await readFile(source,'utf8');
if(!original.includes('terrainHeight')||!original.includes("from './data'"))
  throw Error('Pinned original world module not found/changed');
const manifest=await build({
  entryPoints:[join(root,'highfly/web/src/main.ts')],
  outfile:join(out,'game.js'),
  bundle:true,platform:'browser',format:'esm',target:['es2022'],
  minify:true,treeShaking:true,sourcemap:false,
  nodePaths:[join(root,'highfly/node_modules')],
  define:{'process.env.NODE_ENV':'"production"'},
  legalComments:'none',
  metafile:true,logLevel:'info'
});
const inputs=Object.keys(manifest.metafile.inputs);
if(!inputs.some(x=>x.includes('upstream/src/sim/world.ts'))||
   !inputs.some(x=>x.includes('upstream/src/sim/sim.ts'))||
   !inputs.some(x=>x.includes('upstream/src/sim/data.ts')))
  throw Error('Build did not include REAL v0.44.7 Sim, world and data');
const mediaExt=/\.(?:glb|png|jpe?g|webp|ogg|mp3|ktx2|hdr|woff2?|svg)$/i;
const mediaInputs=inputs.filter(x=>mediaExt.test(x));
if(mediaInputs.length)throw Error('Forbidden asset inputs included: '+mediaInputs.join(', '));
await copyFile(join(root,'highfly/web/index.html'),join(out,'index.html'));
const originalLicense=await readFile(join(root,'upstream/LICENSE'),'utf8');
const threeLicense=await readFile(join(root,'highfly/node_modules/three/LICENSE'),'utf8');
await writeFile(join(out,'THIRD_PARTY_NOTICES.txt'),
  'HIGHFLY C0-G diagnostic\n\nOriginal simulation and world code:\n'+
  originalLicense+'\n\nThree.js (MIT):\n'+threeLicense+
  '\n\nHIGHFLY procedural geometry and UI are independently authored.\n');
await mkdir(join(root,'highfly/reports/c0/web'),{recursive:true});
const report={
  sourceTag:'v0.44.7',originalCommit:'493c35a108cef6c8aa290e8793107b1cd117886e',
  html:true,webgl:true,realSim:true,realTerrain:true,realWorldData:true,
  actual3dModelsIncluded:0,originalVisualAssetsIncluded:0,
  features:'procedural geometry for local original terrain, NPC/mobs and original buildings; provisional movement',
  minifiedBundleBytes:(await readFile(join(out,'game.js'))).byteLength,
  modulesBundled:inputs.length,
  sourceMediaInputs:mediaInputs,
  releaseGate:'must run separately; build success alone does not authorize publication'
};
await writeFile(join(root,'highfly/reports/c0/web/build.json'),JSON.stringify(report,null,2)+'\n');
console.log('HIGHFLY C0-G build completed:',JSON.stringify(report));
