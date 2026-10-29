// HIGHFLY release safety gate. Nothing multimedia may ship implicitly.
// Run: node scripts/c0_release_gate.mjs <dist-directory> <approval-json>
// Every output media file must be explicitly approved with digest + evidence.
// This does not replace a full legal or runtime asset dependency audit.
import { readdir, readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MEDIA=/\.(?:glb|gltf|fbx|obj|mtl|bin|ktx2?|hdr|exr|png|jpe?g|webp|gif|avif|ico|svg|wav|ogg|mp3|m4a|flac|mp4|webm|ttf|otf|woff2?|wasm|pdf)$/i;
const CODE=/\.(?:html|js|mjs|css|txt)$/i;
const SAFE_LICENCES=new Set(['CC0-1.0','MIT','Apache-2.0','CC-BY-4.0','OFL-1.1']);
export function validApproval(row){
  if(!row||typeof row!=='object')return false;
  if(!SAFE_LICENCES.has(row.license))return false;
  if(typeof row.path!=='string'||!row.path||row.path.startsWith('/')||
     row.path.includes('..')||row.path.includes('\\'))return false;
  if(typeof row.sha256!=='string'||!/^[a-f0-9]{64}$/.test(row.sha256))return false;
  if(typeof row.provider!=='string'||row.provider.trim().length<2)return false;
  if(typeof row.sourceUrl!=='string'||!row.sourceUrl.startsWith('https://'))return false;
  if(typeof row.licenseEvidence!=='string'||!row.licenseEvidence.startsWith('https://'))return false;
  if(row.license==='CC-BY-4.0'||row.license==='Apache-2.0'||row.license==='OFL-1.1'){
    if(typeof row.notice!=='string'||row.notice.trim().length<8)return false;
  }
  return true;
}
export function inspectMedia(path,contents,approved){
  const row=approved.get(path);
  if(!row)return 'UNAPPROVED_MEDIA';
  if(!validApproval(row))return 'INVALID_APPROVAL';
  const sha=createHash('sha256').update(contents).digest('hex');
  if(row.sha256!==sha)return 'HASH_MISMATCH';
  return null;
}
export function detectEmbeds(code){
  // GLTFLoader and Three.js contain the *format string* 'data:image/'.
  // Block actual literal data URI payloads, not runtime parser/regex templates.
  if(/data:(?:image|audio|video|font|model)\/[a-z0-9.+-]+(?:;[a-z0-9.+-]+)*(?:;base64)?,[a-z0-9+/=%]{24,}/i.test(code))
    return 'EMBEDDED_MEDIA_REVIEW_REQUIRED';
  if(/(?:worldofclaudecraft-logo|woc_logo_square|fel_meteor_impact\.png)/i.test(code))
    return 'RESTRICTED_BRANDING_OR_ASSET_REFERENCE';
  return null;
}
export async function gate(dist,approvalFile){
  const failures=[];
  let approvals;
  try{
    const data=JSON.parse(await readFile(approvalFile,'utf8'));
    if(data.schemaVersion!==1||!Array.isArray(data.assets))
      throw Error('Invalid manifest schema');
    approvals=new Map();
    for(const row of data.assets){
      if(!validApproval(row))throw Error('Invalid allowlist record: '+String(row?.path));
      if(approvals.has(row.path))throw Error('Duplicate approval record: '+row.path);
      approvals.set(row.path,row);
    }
  }catch(e){return {ok:false,errors:['APPROVAL_FILE_ERROR: '+String(e)]};}
  const found=new Set();
  let files=0,mediaFiles=0;
  async function walk(d){
    for(const x of await readdir(d,{withFileTypes:true})){
      const path=join(d,x.name);
      if((await lstat(path)).isSymbolicLink()){failures.push('SYMLINK_NOT_ALLOWED: '+path);continue;}
      if(x.isDirectory()){await walk(path);continue;}
      if(!x.isFile()){failures.push('UNEXPECTED_FILE_TYPE: '+path);continue;}
      files++;
      const rel=relative(dist,path).replace(/\\/g,'/');
      found.add(rel);
      const bytes=await readFile(path);
      if(MEDIA.test(rel)){
        mediaFiles++;
        const error=inspectMedia(rel,bytes,approvals);
        if(error)failures.push(error+': '+rel);
      }else if(CODE.test(rel)&&rel!=='THIRD_PARTY_NOTICES.txt'){
        const flagged=detectEmbeds(bytes.toString('utf8'));
        if(flagged)failures.push(flagged+': '+rel);
      }else if(!/\.(?:webmanifest|map|json)$/i.test(rel)&&
               rel!=='THIRD_PARTY_NOTICES.txt'&&rel!=='robots.txt'){
        failures.push('UNKNOWN_EXTENSION_REVIEW_REQUIRED: '+rel);
      }else if(/\.json$/i.test(rel)){
        if(!approvals.has(rel))failures.push('UNAPPROVED_JSON_DATA: '+rel);
        else {const e=inspectMedia(rel,bytes,approvals);if(e)failures.push(e+': '+rel);}
      }
    }
  }
  try{await walk(dist);}catch(e){failures.push('OUTPUT_READ_ERROR: '+String(e));}
  if(!found.has('index.html'))failures.push('MISSING_INDEX_HTML');
  try{
    const notice=await readFile(join(dist,'THIRD_PARTY_NOTICES.txt'),'utf8');
    if(!notice.includes('MIT License')||!notice.includes('Levy Street'))
      failures.push('ORIGINAL_MIT_NOTICE_MISSING');
  }catch(_){failures.push('THIRD_PARTY_NOTICES_MISSING');}
  for(const row of approvals.values()){
    if(!found.has(row.path))failures.push('APPROVAL_POINTS_TO_MISSING_FILE: '+row.path);
  }
  return {ok:failures.length===0,errors:failures,files,mediaFiles,approvedEntries:approvals.size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const dist=resolve(process.argv[2]||'dist');
  const allowlist=resolve(process.argv[3]||'config/c0_approved_assets.json');
  gate(dist,allowlist).then(result=>{
    console.log(JSON.stringify(result,null,2));
    if(!result.ok)process.exitCode=1;
  }).catch(err=>{console.error(err);process.exitCode=1;});
}
