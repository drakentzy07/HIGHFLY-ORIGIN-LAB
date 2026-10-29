// HIGHFLY C0-K2 — stage ONLY the 32 audited CC0 assets in the signed allowlist.
// Original KayKit and ClaudeCraft source remains in ephemeral Actions checkout.
// No pack ZIP, source geometry collection, or other media enters the HIGHFLY repo.
import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

const root='highfly';
const allow=JSON.parse(await readFile(join(root,'config/c0_approved_assets.json'),'utf8'));
if(allow.schemaVersion!==1||allow.assets.length!==45)
  throw Error('Unexpected candidate set; exactly forty-five audited files required');
const sourcePrefix='kaykit/addons/kaykit_medieval_hexagon_pack/Assets/gltf/';
const modelOrigins={"building_castle_blue":"buildings/blue/building_castle_blue","building_tower_A_blue":"buildings/blue/building_tower_A_blue","wall_straight":"buildings/neutral/wall_straight","wall_straight_gate":"buildings/neutral/wall_straight_gate","tree_single_A":"decoration/nature/tree_single_A","tree_single_B":"decoration/nature/tree_single_B","rock_single_A":"decoration/nature/rock_single_A"};
const source=(outpath)=>{
  if(outpath.startsWith('assets/kaykit/')) { const file=outpath.slice('assets/kaykit/'.length);const base=file.replace(/\.(gltf|bin)$/,'');return sourcePrefix+(modelOrigins[base]||('buildings/blue/'+file.replace(/\.[^.]+$/,'')))+(modelOrigins[base]?'.'+file.split('.').pop():'.'+file.split('.').pop()); }
  if(outpath==='assets/quaternius/wolf.glb')return 'upstream/public/models/creatures/wolf.glb';
  if(outpath.startsWith('assets/original/')) {const paths={"chars/wild_boar.glb":"models/creatures/wild_boar.glb","chars/knight.glb":"models/chars/players/knight.glb","chars/ranger.glb":"models/chars/players/ranger.glb","chars/skeleton_warrior.glb":"models/chars/enemies/skeleton_warrior.glb","foliage/oak_1.glb":"models/foliage/oak_1.glb","foliage/pine_1.glb":"models/foliage/pine_1.glb","foliage/rock_1.glb":"models/foliage/rock_1.glb","foliage/bush.glb":"models/foliage/bush.glb","foliage/fern.glb":"models/foliage/fern.glb","terrain/grass.jpg":"textures/terrain/Grass001_Color.jpg","terrain/earth.jpg":"textures/terrain/Ground071_Color.jpg","terrain/rock.jpg":"textures/terrain/Rock026_Color.jpg","terrain/paving.jpg":"textures/terrain/PavingStones046_Color.jpg"};const name=outpath.slice('assets/original/'.length);if(!paths[name])throw Error('Unknown pinned original CC0 source '+name);return 'upstream/public/'+paths[name];}
  throw Error('Not in pinned source map: '+outpath);
};
const lic=await readFile('kaykit/LICENSE.txt','utf8');
if(!/CC0/i.test(lic)||!/commercial/i.test(lic))throw Error('KayKit licence changed');
const credits=await readFile('upstream/CREDITS.md','utf8');
if(!credits.includes('Animated creatures (wolf,')||!credits.includes('Quaternius'))
  throw Error('Original Quaternius wolf credit missing');

const files=[];
for(const item of allow.assets){
  if(item.license!=='CC0-1.0')throw Error('Non-CC0 asset attempted: '+item.path);
  const data=await readFile(source(item.path));
  const sha256=createHash('sha256').update(data).digest('hex');
  if(item.gitBlobSha){
    const gitSha=createHash('sha1').update(Buffer.from('blob '+data.length+String.fromCharCode(0))).update(data).digest('hex');
    if(gitSha!==item.gitBlobSha)throw Error('PINNED_GIT_BLOB_MISMATCH: '+item.path);
    item.sha256=sha256; // generated from the independently SHA-1 pinned immutable source
  }else if(sha256!==item.sha256)throw Error('SOURCE_HASH_MISMATCH: '+item.path);
  if(item.path.endsWith('.gltf')){
    const gltf=JSON.parse(data.toString('utf8'));
    if(gltf.asset?.version!=='2.0')throw Error('Bad glTF: '+item.path);
    const dependencies=[...(gltf.images||[]).map(i=>i.uri),
      ...(gltf.buffers||[]).map(b=>b.uri)].filter(Boolean);
    for(const dep of dependencies)if(!allow.assets.some(a=>a.path==='assets/kaykit/'+dep))
      throw Error('Unapproved glTF external dependency: '+item.path+' -> '+dep);
  }
  if(item.path.endsWith('.glb')&&data.toString('ascii',0,4)!=='glTF')
    throw Error('Invalid GLB magic: '+item.path);
  const destination=join(root,'dist',item.path);
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,data);
  files.push({path:item.path,bytes:data.byteLength,sha256});
}
await appendFile(join(root,'dist/THIRD_PARTY_NOTICES.txt'),
  '\n\nThird-party visual assets, CC0 1.0 Universal:\n'+
  '- KayKit Medieval Hexagon Pack by Kay Lousberg. '+allow.assets[0].licenseEvidence+'\n'+
  '- Quaternius animated wolf and native foliage, KayKit original avatars, ambientCG CC0 ground textures. '+
  'Source SHA-1 Git blobs checked against pinned v0.44.7, SHA-256 recorded at build.\\n'+
  '- Quaternius animated wolf, credited by World of ClaudeCraft v0.44.7. '+
  'https://quaternius.com/packs/ultimateanimatedanimals.html\n');
await mkdir(join(root,'reports/c0/web'),{recursive:true});
await writeFile(join(root,'reports/c0/web/k3_approved_runtime.json'),JSON.stringify(allow,null,2)+'\n');
await writeFile(join(root,'reports/c0/web/approved-media.json'),JSON.stringify({
  status:'STAGED_ONLY_AFTER_HASH_CHECK',
  actualMediaFiles:files.length,totalMediaBytes:files.reduce((n,f)=>n+f.bytes,0),
  origin:'pinned KayKit official CC0 and ClaudeCraft v0.44.7 credited Quaternius wolf',
  files,playerAssetImported:false
},null,2)+'\n');
console.log('C0-K3 approved CC0 media staged:',JSON.stringify(files));
