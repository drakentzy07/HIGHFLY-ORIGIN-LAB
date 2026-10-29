import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gate, inspectMedia, validApproval, detectEmbeds } from '../scripts/c0_release_gate.mjs';

const originalMIT='MIT License\nCopyright (c) 2026 Levy Street\n';
const src='https://kaylousberg.itch.io/kaykit-adventurers';
const proof='https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0';
function row(path,bytes){
  return {path,sha256:createHash('sha256').update(bytes).digest('hex'),license:'CC0-1.0',
    provider:'KayKit',sourceUrl:src,licenseEvidence:proof};
}
async function fixture(t,assets=[]){
  const root=await mkdtemp(join(tmpdir(),'highfly-c0-f-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const dist=join(root,'dist');
  await mkdir(dist,{recursive:true});
  await writeFile(join(dist,'index.html'),'<html><body>HIGHFLY</body></html>');
  await writeFile(join(dist,'THIRD_PARTY_NOTICES.txt'),originalMIT);
  const allow=join(root,'allow.json');
  await writeFile(allow,JSON.stringify({schemaVersion:1,assets}));
  return {dist,allow};
}
test('empty build with origin notice passes; it is not a playable release',async(t)=>{
  const {dist,allow}=await fixture(t);
  const result=await gate(dist,allow);
  assert.equal(result.ok,true);
  assert.equal(result.mediaFiles,0);
});
test('unknown packaged models must block release',async(t)=>{
  const {dist,allow}=await fixture(t);
  await mkdir(join(dist,'models'));
  await writeFile(join(dist,'models','wolf.glb'),Buffer.from('fake glb bytes'));
  const result=await gate(dist,allow);
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(e=>e.startsWith('UNAPPROVED_MEDIA')));
});
test('approved hash + source evidence passes and a changed byte blocks',async(t)=>{
  const bytes=Buffer.from('fake test content, not real pack asset');
  const approved=row('models/wolf.glb',bytes);
  const {dist,allow}=await fixture(t,[approved]);
  await mkdir(join(dist,'models'));
  await writeFile(join(dist,'models','wolf.glb'),bytes);
  assert.equal((await gate(dist,allow)).ok,true);
  await writeFile(join(dist,'models','wolf.glb'),'tampered');
  const check=await gate(dist,allow);
  assert.ok(check.errors.some(e=>e.startsWith('HASH_MISMATCH')));
});
test('project-only, noncommercial and weak evidence are never valid approvals',()=>{
  const content=Buffer.from('asset');
  const ok=row('models/wolf.glb',content);
  assert.equal(validApproval(ok),true);
  assert.equal(validApproval({...ok,license:'With the project only'}),false);
  assert.equal(validApproval({...ok,license:'CC-BY-NC-4.0'}),false);
  assert.equal(validApproval({...ok,sourceUrl:'none'}),false);
  assert.equal(validApproval({...ok,path:'../../leak.glb'}),false);
  assert.equal(inspectMedia('models/wolf.glb',content,new Map([[ok.path,ok]])),null);
});
test('embedded image data and known restricted branding are blocked',()=>{
  assert.equal(detectEmbeds("const img = 'data:image/png;base64,"+"iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"+"';"),'EMBEDDED_MEDIA_REVIEW_REQUIRED');
  assert.equal(detectEmbeds('function parse(s){return s.startsWith("data:image/")}'),null);
  assert.equal(detectEmbeds('asset=fel_meteor_impact.png'),'RESTRICTED_BRANDING_OR_ASSET_REFERENCE');
});
test('original MIT notices must accompany the derived game build',async(t)=>{
  const {dist,allow}=await fixture(t);
  await writeFile(join(dist,'THIRD_PARTY_NOTICES.txt'),'HIGHFLY only');
  const result=await gate(dist,allow);
  assert.ok(result.errors.includes('ORIGINAL_MIT_NOTICE_MISSING'));
});
