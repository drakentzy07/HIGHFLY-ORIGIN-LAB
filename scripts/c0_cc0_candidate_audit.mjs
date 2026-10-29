// HIGHFLY C0-I: audit candidate *original* CC0 buildings and Quaternius wolf.
// No binary files, art assets or characters are published into HIGHFLY.
// Asset URLs are only candidates until exact licensing/provenance and rendering
// are verified. The code is a read-only audit of two pinned Git checkouts.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const assetRepo='KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0';
const kaykitCommit='84fa4e91af6a88989be7c99e0891cede11f2ca38';
const claudeCommit='493c35a108cef6c8aa290e8793107b1cd117886e';
const prefix='kaykit/addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/blue/';
const sources=[
 {name:'home-blue',family:'KayKit Medieval Hexagon CC0',sources:[
   prefix+'building_home_A_blue.gltf',prefix+'building_home_A_blue.bin',prefix+'hexagons_medieval.png'
  ],licenseEvidence:'https://github.com/'+assetRepo+'/blob/'+kaykitCommit+'/LICENSE.txt'},
 {name:'tavern-blue',family:'KayKit Medieval Hexagon CC0',sources:[
   prefix+'building_tavern_blue.gltf',prefix+'building_tavern_blue.bin',prefix+'hexagons_medieval.png'
  ],licenseEvidence:'https://github.com/'+assetRepo+'/blob/'+kaykitCommit+'/LICENSE.txt'},
 {name:'wolf-animated',family:'Quaternius Ultimate Animated Animal Pack CC0 candidate',
  sources:['upstream/public/models/creatures/wolf.glb'],
  licenseEvidence:'https://quaternius.com/packs/ultimateanimatedanimals.html',
  note:'Wolf is attributed to Quaternius in CREDITS.md. Confirm its identity against original source release before production.'}
];
const license=await readFile('kaykit/LICENSE.txt','utf8');
if(!/CC0/i.test(license)||!/commercial/i.test(license))throw Error('Official KayKit license evidence differs');
const upstreamCredits=await readFile('upstream/CREDITS.md','utf8');
if(!upstreamCredits.includes('Animated creatures (wolf,')||
   !upstreamCredits.includes('Quaternius'))throw Error('Wolf provenance not found in official ClaudeCraft credits');
const records=[];
for(const group of sources){
  const paths=[];
  for(const file of group.sources){
    const bytes=await readFile(file);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    const gitSha1=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
    if(file.endsWith('.glb')&&!bytes.subarray(0,4).equals(Buffer.from('glTF')))throw Error('Invalid GLB header '+file);
    if(file.endsWith('.gltf')){
      const json=JSON.parse(bytes.toString('utf8'));
      if(json.asset?.version!=='2.0')throw Error('Expected glTF 2.0 '+file);
    }
    if(bytes.length<100)throw Error('Truncated candidate '+file);
    paths.push({file,bytes:bytes.length,sha256,gitBlobSha1:gitSha1});
  }
  records.push({...group,paths});
}
await mkdir('highfly/reports/c0/assets',{recursive:true});
const info={
  title:'HIGHFLY C0-I official CC0 source candidate audit',
  kaykitUpstream:assetRepo,kaykitCommit,
  originalClaudeCraftCommit:claudeCommit,
  assetsReleased:0,playerAssetImported:false,
  candidates:records,
  note:'No files are approved or deployed by this job. The Quaternius GLB identity is a candidate until checked.'
};
await writeFile('highfly/reports/c0/assets/cc0-candidates.json',JSON.stringify(info,null,2)+'\n');
const md=['# HIGHFLY C0-I — selected CC0 candidates',
  '- KayKit pinned official source: '+kaykitCommit,
  '- ClaudeCraft v0.44.7 pinned source: '+claudeCommit,
  '- Candidate groups: '+records.length,
  ...records.map(x=>'- '+x.name+': '+x.paths.reduce((s,p)=>s+p.bytes,0)+' bytes, source evidence '+x.licenseEvidence),
  '',
  '**NOT yet deployed:** these are candidate files with immutable hashes and licence evidence.',
  '**Player assets deliberately excluded:** the Hunter will be HIGHFLY original built with the users own KayKit SOURCE pack.',
  'The selected files never enter the public HIGHFLY repository or Pages through this audit.',
  ''];
await writeFile('highfly/reports/c0/assets/summary.md',md.join('\n'));
console.log(md.join('\n'));
