// HIGHFLY C0-E: produce a code-only audit package from an official upstream
// sparse checkout. Creates NO Git commits, copies NO media and fails closed.
// Uses Git SHA-1 for provenance. Original source is unchanged.
import { createHash } from 'node:crypto';
import { cp, mkdir, lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
const SRC = process.env.C0_SOURCE_DIR || 'upstream';
const OUT = process.env.C0_PACKAGE_OUT || 'highfly/reports/c0/sim-source';
const ROOT = join(SRC,'src','sim');
const SOURCE_SHA = '493c35a108cef6c8aa290e8793107b1cd117886e';
const CODE_EXT = /\.(?:ts|tsx|js|jsx|mjs|mts|cjs)$/i;
const MAX_FILE_BYTES=1024*1024*3; // 3MiB per code file
const MAX_TOTAL_BYTES=1024*1024*80; // 80MiB total
const files=[];
async function visit(dir){
  for(const file of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const p=join(dir,file.name);
    const stat=await lstat(p);
    if(stat.isSymbolicLink()) throw Error('Symlink refused: '+p);
    if(stat.isDirectory()) await visit(p);
    else if(stat.isFile()){
      const rel=relative(SRC,p).replace(/\\/g,'/');
      if (!CODE_EXT.test(file.name)) {
        // A source file's neighbours might include independently licensed media.
        // Those are never packed by this script.
        continue;
      }
      if(stat.size>MAX_FILE_BYTES)throw Error('Oversized code file requires review: '+rel);
      const bytes=await readFile(p);
      if(bytes.includes(0))throw Error('NUL / binary data in '+rel);
      const contents=bytes.toString('utf8');
      if(contents.includes('\uFFFD'))throw Error('Invalid UTF-8 in '+rel);
      // Specific embedded multimedia payloads, not URL references (the latter stay
      // as code and must be resolved/replaced at distribution time).
      if(/data:(?:image|audio|video|font)\//i.test(contents))
        throw Error('Possible embedded media in code: '+rel);
      if(/[A-Za-z0-9+/]{600,}={0,2}/.test(contents))
        throw Error('Potential binary/base64 payload in code: '+rel);
      const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
      files.push({path:rel,bytes:bytes.length,gitBlobSha1:sha});
    }
  }
}
await visit(ROOT);
const totalBytes=files.reduce((s,x)=>s+x.bytes,0);
if (totalBytes>MAX_TOTAL_BYTES) throw Error('Package size too large: '+totalBytes);
if (files.length<100) throw Error('Too few original code files, sparse checkout incomplete: '+files.length);
const dest=join(OUT,'source-only');
await mkdir(dest,{recursive:true});
for(const f of files){
  const from=join(SRC,f.path),to=join(dest,f.path);
  await mkdir(join(to,'..'),{recursive:true});
  await cp(from,to,{force:false,errorOnExist:true});
  const test=await readFile(to);
  const sha=createHash('sha1').update('blob '+test.length+'\0').update(test).digest('hex');
  if(sha!==f.gitBlobSha1)throw Error('Copy changed SHA of '+f.path);
}
const lic=await readFile(join(SRC,'LICENSE'));
if(!lic.toString('utf8').startsWith('MIT License'))throw Error('Unexpected upstream licence');
await writeFile(join(dest,'LICENSE'),lic);
const manifest={
  title:'C0-E isolated source-only upstream sim package',
  upstream:'levy-street/world-of-claudecraft',upstreamCommit:SOURCE_SHA,
  sourcePath:'src/sim',fileCount:files.length,totalBytes,
  graphicsIncluded:false,mediaIncluded:false,
  packageContainsRunnableGame:false,
  clearance:'MIT source provenance only; referenced media not cleared',
  files
};
await writeFile(join(dest,'MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
const lines=[
  '# HIGHFLY C0-E — source-only staging package',
  '- Upstream: v0.44.7 pinned commit '+SOURCE_SHA,
  '- Code files: '+files.length,
  '- Total source bytes: '+totalBytes,
  '- SHA-1 check after copy: **PASS**',
  '- Original MIT notice preserved',
  '- Media, 3D models, images, audio: **NOT INCLUDED**',
  '- Executable standalone game: **NO** (other runtime layers are required)',
  '',
  'This is an audit artifact only; importing a source directory does NOT clear references',
  'to unlicensed assets nor prove a playable HIGHFLY build.'
];
await writeFile(join(OUT,'summary.md'),lines.join('\n')+'\n');
console.log(lines.join('\n'));
