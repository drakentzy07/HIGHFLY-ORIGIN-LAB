// HIGHFLY C0-F2: distinguish runtime renderer inventory from all public files.
// Uses generated MEDIA_ASSETS at the pinned upstream commit, plus the C0-F matrix.
// Reads textual manifests only; no binary assets are downloaded or distributed.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const COMMIT='493c35a108cef6c8aa290e8793107b1cd117886e';
const OUT=process.env.C0_MEDIA_OUT||'reports/c0/media';

export function manifestEntries(source) {
  const list=[];
  const found=new Set();
  const regex=/^\s*"([^"]+)":\s*"\/media\/([^"]+)"\s*,?$/gm;
  for(const m of source.matchAll(regex)){
    const key=m[1],url='/media/'+m[2];
    if(key.startsWith('/')||key.includes('..')||found.has(key))throw Error('Duplicate or unsafe manifest key: '+key);
    found.add(key);
    list.push({key,url,sourcePath:'public/'+key});
  }
  return list;
}
export function mediaIndex(csv){
  const out=new Map();
  for(const line of csv.split(/\r?\n/).slice(1)){
    if(!line.trim())continue;
    // C0-F writes quoted CSV with exactly five fields. The first four
    // contain no embedded double-quotes in actual original Git paths.
    const match=/^"([^"]+)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/u.exec(line);
    if(!match)throw Error('Unexpected CSV row format (fail closed): '+line.slice(0,120));
    out.set(match[1],{bytes:Number(match[2]),sha:match[3],status:match[4],creditRows:match[5]});
  }
  return out;
}
export function joinRuntime(manifest,index){
  return manifest.map(x=>{
    const row=index.get(x.sourcePath);
    return {...x,bytes:row?.bytes??null,sha:row?.sha??null,
      status:row?.status??'BLOCKED_NOT_FOUND_IN_SOURCE_TREE',
      creditRows:row?.creditRows??''};
  });
}
const manifestUrl='https://raw.githubusercontent.com/levy-street/world-of-claudecraft/'+COMMIT+'/src/render/assets/manifest.generated.ts';
async function run(){
  const response=await fetch(manifestUrl,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Pinned renderer manifest fetch error: '+response.status);
  const manifest=manifestEntries(await response.text());
  if(manifest.length<100)throw Error('Renderer manifest suspiciously short');
  const rows=mediaIndex(await readFile(join(OUT,'media-matrix.csv'),'utf8'));
  const result=joinRuntime(manifest,rows);
  const statuses={},categories={};
  for(const r of result){
    statuses[r.status]=(statuses[r.status]||0)+1;
    const cat=r.key.split('/')[0];categories[cat]=(categories[cat]||0)+1;
  }
  const summary={
    title:'HIGHFLY C0-F2 pinned runtime renderer media set',
    originalCommit:COMMIT,
    manifestEntries:result.length,
    categoryCounts:categories,
    statusCounts:statuses,
    approvedForPublicRelease:0,
    note:'A generated runtime renderer manifest is not the full runtime asset set: UI, CSS and dynamic URL paths remain to audit.'
  };
  const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
  const lines=[['sourcePath','rendererUrl','bytes','gitBlobSha1','status','creditRows'].map(quote).join(',')];
  for(const r of result)lines.push([r.sourcePath,r.url,r.bytes,r.sha,r.status,r.creditRows].map(quote).join(','));
  await writeFile(join(OUT,'renderer-media-matrix.csv'),lines.join('\n')+'\n');
  await writeFile(join(OUT,'renderer-summary.json'),JSON.stringify(summary,null,2)+'\n');
  const md=[
    '# HIGHFLY C0-F2 — actual renderer media manifest',
    '- Exact upstream version: '+COMMIT,
    '- Renderer manifest keys: '+result.length,
    '',
    '## By category',
    ...Object.entries(categories).sort().map(([k,v])=>'- '+k+': '+v),
    '',
    '## Licences and provenance status (all pre-approval)',
    ...Object.entries(statuses).sort().map(([k,v])=>'- '+k+': '+v),
    '',
    '## Interpretation',
    'Matching a declared CC0 resource does NOT approve it for redistribution automatically.',
    'Unknown resources and excluded/project-only sources remain blocked.',
    'The renderer manifest does not include every UI, audio, CSS or dynamic resource.',
    ''
  ];
  await writeFile(join(OUT,'renderer-summary.md'),md.join('\n'));
  console.log(md.join('\n'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  run().catch(e=>{console.error('C0-F2 failed',e);process.exitCode=1;});
