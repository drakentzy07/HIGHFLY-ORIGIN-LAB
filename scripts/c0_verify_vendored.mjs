// HIGHFLY C0: immutable checks for staged MIT source, no external dependencies.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = 'vendor/claudecraft-v0447';
const manifest = JSON.parse(await readFile(join(root, 'MANIFEST.json'), 'utf8'));
let bad = false;
const expected = new Set(['MANIFEST.json', 'README.md']);
for (const entry of manifest.files) {
  expected.add(entry.path);
  const path = join(root, entry.path);
  try {
    const data = await readFile(path);
    const hash = createHash('sha1')
      .update('blob ' + data.length + '\0')
      .update(data)
      .digest('hex');
    if (hash !== entry.sha1) {
      console.error('SHA mismatch:', entry.path, 'expected', entry.sha1, 'got', hash);
      bad = true;
    } else console.log('SHA OK:', entry.path);
  } catch (error) {
    console.error('Missing or unreadable:', entry.path, String(error));
    bad = true;
  }
}
async function visit(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) await visit(path);
    else {
      const rel = relative(root, path).split('\\').join('/');
      if (!expected.has(rel)) {
        console.error('Unexpected file in upstream staging:', rel);
        bad = true;
      }
    }
  }
}
await visit(root);
if (bad) process.exitCode = 1;
else console.log('C0 STAGING VERIFIED: exact blobs, no untracked files, no imported media');
