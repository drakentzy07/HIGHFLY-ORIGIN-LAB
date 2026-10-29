// HIGHFLY C0-F. Read-only matrix; NO MEDIA APPROVED FOR RELEASE.
// The original tag is immutable. Tree metadata only; no model/texture downloads.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCredits, csvCell } from './c0_inventory.mjs';

const COMMIT='493c35a108cef6c8aa290e8793107b1cd117886e';
const API='https://api.github.com/repos/levy-street/world-of-claudecraft';
const OUT=process.env.C0_MEDIA_OUT||'reports/c0/media';
const mediaExtension=/\.(?:png|jpe?g|webp|gif|svg|ico|avif|glb|gltf|fbx|obj|mtl|bin|ktx2?|hdr|exr|wav|ogg|mp3|m4a|flac|mp4|webm|ttf|otf|woff2?|pdf|wasm)$/i;
async function gh(path){
  const headers={'User-Agent':'highfly-c0-f-auditor','Accept':'application/vnd.github+json'};
  if(process.env.GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_TOKEN;
  const r=await fetch(API+path,{headers,signal:AbortSignal.timeout(45000)});
  if(!r.ok)throw Error('GitHub GET '+r.status+' '+path);
  return r.json();
}
async function readCredits(){
  const r=await fetch('https://raw.githubusercontent.com/levy-street/world-of-claudecraft/'+COMMIT+'/CREDITS.md',{signal:AbortSignal.timeout(45000)});
  if(!r.ok)throw Error('CREDITS download failed '+r.status);
  return r.text();
}
export function policy(row) {
  const t=(row.redistribution||'').replace(/\*/g,'').trim().toLowerCase();
  const licence=(row.license||'').toLowerCase();
  if(t==='with the project only')return 'EXCLUDE_PROJECT_ONLY';
  if(t.includes('permission required')||t==='no')return 'EXCLUDE_PERMISSION_REQUIRED';
  if(t.includes('non-commercial')||t.includes('noncommercial')||licence.includes('by-nc'))
    return 'EXCLUDE_NONCOMMERCIAL';
  if(t==='yes, attribution required')return 'ATTRIBUTION_REVIEW';
  if(t.includes('sil ofl'))return 'FONT_LICENSE_REVIEW';
  if(t==='yes'&&licence.includes('cc0'))return 'CC0_SOURCE_REVIEW';
  if(t==='yes')return 'OTHER_LICENSE_REVIEW';
  return 'BLOCKED_UNKNOWN';
}
function expandBraces(pattern){
  const a=pattern.indexOf('{');if(a<0)return [pattern];
  const b=pattern.indexOf('}',a+1);if(b<0)return [pattern];
  const parts=pattern.slice(a+1,b).split(',').map(x=>x.trim()).filter(Boolean);
  if(!parts.length||parts.length>100)return [pattern];
  return parts.flatMap(x=>expandBraces(pattern.slice(0,a)+x+pattern.slice(b+1)));
}
export function creditPatterns(description){
  const found=new Set();
  for(const m of String(description||'').matchAll(/public\/[A-Za-z0-9_\-./*?{}+,]+/g)){
    const p=m[0].replace(/[.,]+$/g,'');
    if(p.includes('..')||p.includes('//'))continue;
    for(const a of expandBraces(p))
      if(a.startsWith('public/')&&!a.includes('{')&&!a.includes('}')&&!a.includes(','))
        found.add(a);
  }
  return [...found].sort();
}
export function patternMatch(pattern,path){
  if(!pattern.startsWith('public/')||!path.startsWith('public/'))return false;
  if(pattern.endsWith('/'))return path.startsWith(pattern);
  let regex='^';
  for(let i=0;i<pattern.length;i++){
    const c=pattern[i];
    if(c==='*') {
      if(pattern[i+1]==='*'){regex+='.*';i++;}
      else regex+='[^/]*';
    } else if(c==='?')regex+='[^/]';
    else regex+=('.^$+()[]{}|\\'.includes(c)?'\\':'')+c;
  }
  return new RegExp(regex+'$').test(path);
}
export function decide(matches){
  if(matches.length===0)return 'BLOCKED_NO_EXPLICIT_CREDIT_MATCH';
  const labels=matches.map(x=>x.policy);
  return labels.find(x=>x.startsWith('EXCLUDE_'))||
    (labels.includes('BLOCKED_UNKNOWN')?'BLOCKED_AMBIGUOUS_CREDIT':null)||
    ([...new Set(labels)].length>1?'BLOCKED_CONFLICTING_CREDITS':labels[0]);
}
export function matchFile(path,patterns){
  const matched=[];
  for(const row of patterns)
    if(row.patterns.some(p=>patternMatch(p,path)))
      matched.push({creditRow:row.row,policy:row.policy});
  return {status:decide(matched),matched};
}
async function publicTree(){
  const commit=await gh('/git/commits/'+COMMIT);
  const root=await gh('/git/trees/'+commit.tree.sha);
  if(root.truncated)throw Error('Root Git tree was truncated');
  const pub=root.tree.find(x=>x.path==='public'&&x.type==='tree');
  if(!pub)throw Error('Public assets tree not found');
  const out=[];
  const deep=await gh('/git/trees/'+pub.sha+'?recursive=1');
  if(!deep.truncated){
    for(const x of deep.tree)if(x.type==='blob')out.push({
      path:'public/'+x.path,bytes:x.size??0,sha:x.sha
    });
  } else {
    const todo=[{sha:pub.sha,prefix:'public'}];
    while(todo.length){
      const node=todo.pop();
      const sub=await gh('/git/trees/'+node.sha);
      if(sub.truncated)throw Error('Shallow Git tree truncated: '+node.prefix);
      for(const x of sub.tree){
        const path=node.prefix+'/'+x.path;
        if(x.type==='tree')todo.push({sha:x.sha,prefix:path});
        if(x.type==='blob')out.push({path,bytes:x.size??0,sha:x.sha});
      }
    }
  }
  if(out.length<500)throw Error('Too few assets to trust inventory: '+out.length);
  return out.sort((a,b)=>a.path.localeCompare(b.path));
}
async function run(){
  const paths=await publicTree();
  const credits=parseCredits(await readCredits());
  if(credits.length!==181)throw Error('Pinned CREDITS expected 181 rows; found '+credits.length);
  const rows=credits.map((r,i)=>({row:i+1,author:r.author,license:r.license,
    redistribution:r.redistribution,policy:policy(r),assets:r.assets,
    patterns:creditPatterns(r.assets)}));
  const media=paths.filter(x=>mediaExtension.test(x.path));
  const decisions=media.map(x=>({...x,...matchFile(x.path,rows)}));
  const counts={};
  for(const d of decisions)counts[d.status]=(counts[d.status]||0)+1;
  const matched=decisions.filter(x=>x.matched.length);
  const summary={
    tag:'v0.44.7',commit:COMMIT,publicFiles:paths.length,mediaFiles:media.length,
    creditRows:credits.length,mediaWithExplicitCreditPath:matched.length,
    creditRowsWithoutPublicPath:rows.filter(x=>x.patterns.length===0).length,
    mediaBytes:media.reduce((s,x)=>s+x.bytes,0),
    counts,readyForRelease:false,
    notes:'Status CC0_SOURCE_REVIEW still needs per-file source/version proof. Broad patterns can overblock.'
  };
  await mkdir(OUT,{recursive:true});
  const line=(values)=>values.map(csvCell).join(',');
  const csv=[line(['path','bytes','gitBlobSha1','status','creditRows'])];
  for(const d of decisions)csv.push(line([d.path,d.bytes,d.sha,d.status,d.matched.map(x=>x.creditRow).join(';')]));
  await writeFile(join(OUT,'media-matrix.csv'),csv.join('\n')+'\n');
  await writeFile(join(OUT,'credit-path-patterns.json'),JSON.stringify(rows,null,2)+'\n');
  await writeFile(join(OUT,'summary.json'),JSON.stringify(summary,null,2)+'\n');
  const md=[
    '# C0-F — License provenance matrix',
    '',
    '- Source: v0.44.7 pinned commit '+COMMIT,
    '- Total public files in Git tree: '+paths.length,
    '- Media files: '+media.length,
    '- Media with explicitly matching CREDITS paths: '+matched.length,
    '- Credit rows with no public-path patterns: '+summary.creditRowsWithoutPublicPath,
    '',
    '## Counts (NOT approvals)',
    ...Object.entries(counts).sort().map(([k,n])=>'- '+k+': '+n),
    '',
    '## Stop conditions',
    '- EXCLUDE means reject or replace; BLOCKED means evidence insufficient.',
    '- CC0_SOURCE_REVIEW and attribution candidates are NOT permission to copy blindly.',
    '- No assets were downloaded, uploaded, cleared or published.',
    '- All code and CSS resource references must also be scanned before release.',
    ''
  ];
  await writeFile(join(OUT,'summary.md'),md.join('\n'));
  console.log(md.join('\n'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  run().catch(err=>{console.error('C0-F ERROR',err);process.exitCode=1;});
