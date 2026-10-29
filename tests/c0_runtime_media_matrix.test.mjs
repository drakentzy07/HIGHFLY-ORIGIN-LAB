import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestEntries, mediaIndex, joinRuntime } from '../scripts/c0_runtime_media_matrix.mjs';
test('parse exact generated renderer keys, with stable /media URL',()=>{
  const rows=manifestEntries('export const MEDIA_ASSETS = {\n  "models/wolf.glb": "/media/models/wolf.abc.glb",\n  "env/day.ktx2": "/media/env/day.123.ktx2"\n};');
  assert.equal(rows.length,2);
  assert.equal(rows[0].sourcePath,'public/models/wolf.glb');
  assert.equal(rows[0].url,'/media/models/wolf.abc.glb');
});
test('read original path matrix without falsely approving missing entries',()=>{
  const csv='"path","bytes","git_blob_sha1","status","credit_rows"\n'+
    '"public/models/wolf.glb","250","abc123","CC0_SOURCE_REVIEW","7"\n';
  const index=mediaIndex(csv);
  const manifest=[
    {key:'models/wolf.glb',url:'/media/models/wolf.hash.glb',sourcePath:'public/models/wolf.glb'},
    {key:'models/wall.glb',url:'/media/models/wall.hash.glb',sourcePath:'public/models/wall.glb'}
  ];
  const result=joinRuntime(manifest,index);
  assert.equal(result[0].status,'CC0_SOURCE_REVIEW');
  assert.equal(result[0].creditRows,'7');
  assert.equal(result[1].status,'BLOCKED_NOT_FOUND_IN_SOURCE_TREE');
});
test('duplicate keys or traversal attempts are refused',()=>{
  assert.throws(()=>manifestEntries('"models/wolf.glb": "/media/a.glb",\n"models/wolf.glb": "/media/b.glb"'),/Duplicate/);
  assert.throws(()=>manifestEntries('"../outside.glb": "/media/c.glb"'),/unsafe/);
});
