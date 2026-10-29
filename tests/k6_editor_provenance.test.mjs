import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Exact byte identity with MIT upstream v0.44.7 editor sources;
// independently hash Git blob data (not just contents string).
const upstream={
  'undo_core.ts':'f8cca1c98eeffa2e66a89a8703741daf4fc7aecd',
  'camera_axes.ts':'9dd46c6d3f2779c117cd6aaa85fae85c8260c33e',
  'placement_transform_core.ts':'16866ec50eb55536cab401f97c49910addd86b30'
};
test('MIT editor cores were copied exactly from pinned ClaudeCraft v0.44.7',()=>{
  const root=new URL('../vendor/claudecraft-v0447/src/editor/',import.meta.url);
  for(const [name,sha] of Object.entries(upstream)){
    const bytes=readFileSync(new URL(name,root));
    const digest=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
    assert.equal(digest,sha,name);
  }
  const notice=readFileSync(new URL('../vendor/claudecraft-v0447/LICENSE',import.meta.url),'utf8');
  assert.match(notice,/MIT License/);
  assert.match(notice,/Copyright \(c\) 2026 Levy Street/);
});
