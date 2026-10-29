// HIGHFLY C0: audit the exact upstream tag WITHOUT cloning or copying media.
// Requires Node.js >=20. No external dependencies; no edits to upstream/source code.
// Classification is intentionally fail-closed. A GitHub path is NOT a media licence.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const OWNER = 'levy-street';
const REPO = 'world-of-claudecraft';
const TAG = 'v0.44.7';
const API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
const SOURCE = 'https://github.com/' + OWNER + '/' + REPO + '/tree/' + TAG;
const OUT = process.env.C0_OUT_DIR || 'reports/c0';

async function fetchRemote(url, json = true) {
  const headers = { 'User-Agent': 'highfly-origin-c0-audit', 'Accept': 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw Error('Upstream request failed ' + response.status + ': ' + url);
  return json ? response.json() : response.text();
}
const gh = (path) => fetchRemote(API + path);

export function classifyPath(path) {
  // Explicitly excluded assets from the v0.44.7 CREDITS.md, not a full denylist.
  const restricted = [
    /^public\/claudium\//i,
    /^public\/models\/city\/wall_tower\.glb$/i,
    /^public\/textures\/battleground\/decals\//i,
    /^public\/vfx\/fel_meteor_impact\.png$/i,
    /^public\/(?:woc[-_]|worldofclaudecraft[-_]|website[-_])/i,
  ];
  if (restricted.some((pattern) => pattern.test(path))) return 'EXCLUDE_OR_REPLACE';
  // The exact set of purchased CraftPix icons requires inspection of mapping.json.
  if (/^public\/ui\/skills\//i.test(path)) return 'REVIEW_MEDIA';
  const media = /\.(?:png|jpg|jpeg|webp|gif|svg|ico|glb|gltf|fbx|obj|mtl|ktx2|hdr|exr|wav|ogg|mp3|m4a|flac|mp4|webm|ttf|otf|woff2?|pdf)$/i;
  if (media.test(path)) return 'REVIEW_MEDIA';
  if (/^(?:src|server|headless|scripts|bot|tests|python|electron|android|ios)\//.test(path) &&
      /\.(?:ts|tsx|js|jsx|mjs|mts|cjs|py|java|kt|swift|css|scss|html)$/i.test(path)) {
    return 'CODE_MIT_CANDIDATE';
  }
  if (/(?:^|\/)(?:LICENSE(?:\..+)?|THIRD_PARTY_NOTICES\.md|CREDITS\.md)$/i.test(path)) return 'NOTICE';
  return 'REVIEW_OTHER';
}

export function parseCredits(text) {
  const rows = [];
  let active = false;
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim();
    if (/^\|\s*Assets\s*\|\s*Author\s*\|\s*Source\s*\|\s*License\s*\|\s*Redistribution\s*\|/i.test(clean)) {
      active = true;
      continue;
    }
    if (active && !clean.startsWith('|')) { active = false; continue; }
    if (!active || /^\|\s*:?-{3,}/.test(clean)) continue;
    const fields = clean.split('|').slice(1, -1).map((v) => v.trim());
    if (fields.length !== 5) continue;
    rows.push({ assets: fields[0], author: fields[1], source: fields[2],
      license: fields[3], redistribution: fields[4] });
  }
  return rows;
}
export function countsByStatus(items) {
  const counts = {};
  for (const x of items) counts[x.status] = (counts[x.status] || 0) + 1;
  return counts;
}
export function csvCell(s) {
  const t = String(s ?? '');
  return '"' + t.replace(/"/g, '""') + '"';
}

// Lightweight tags or annotated tags are both supported.
async function resolveUpstreamCommit() {
  const ref = await gh('/git/ref/tags/' + TAG);
  let object = ref.object;
  for (let depth = 0; object.type === 'tag' && depth < 3; depth++) {
    object = (await gh('/git/tags/' + object.sha)).object;
  }
  if (object.type !== 'commit') throw Error('Tag did not resolve to a commit');
  const commit = await gh('/git/commits/' + object.sha);
  return { commitSha: object.sha, treeSha: commit.tree.sha };
}

async function walkTree(treeSha, pathPrefix, result) {
  const response = await gh('/git/trees/' + treeSha + '?recursive=1');
  if (!response.truncated) {
    for (const item of response.tree) {
      if (item.type !== 'blob') continue;
      const path = (pathPrefix ? pathPrefix + '/' : '') + item.path;
      result.push({ path, bytes: item.size ?? null, sha: item.sha, status: classifyPath(path) });
    }
    return;
  }
  // Do not trust truncated trees. Traverse smaller subtrees until complete.
  const stack = [{ sha: treeSha, prefix: pathPrefix }];
  while (stack.length) {
    const node = stack.pop();
    const shallow = await gh('/git/trees/' + node.sha);
    if (shallow.truncated) throw Error('Even shallow tree was truncated: ' + node.prefix);
    for (const entry of shallow.tree) {
      const path = (node.prefix ? node.prefix + '/' : '') + entry.path;
      if (entry.type === 'tree') stack.push({ sha: entry.sha, prefix: path });
      else if (entry.type === 'blob') {
        result.push({ path, bytes: entry.size ?? null, sha: entry.sha, status: classifyPath(path) });
      }
    }
  }
}

async function audit() {
  const upstream = await resolveUpstreamCommit();
  const root = await gh('/git/trees/' + upstream.treeSha);
  if (root.truncated) throw Error('Root tree truncated; cannot complete audit safely');
  const entries = [];
  for (const item of root.tree) {
    if (item.type === 'blob') entries.push({
      path: item.path, bytes: item.size ?? null, sha: item.sha, status: classifyPath(item.path)
    });
    else if (item.type === 'tree') {
      console.log('Inventory:', item.path);
      await walkTree(item.sha, item.path, entries);
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const creditsText = await fetchRemote(
    'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + TAG + '/CREDITS.md', false
  );
  const credits = parseCredits(creditsText);
  if (credits.length < 10) throw Error('CREDITS extraction suspiciously short; fail closed');
  const statusCounts = countsByStatus(entries);
  const areas = {};
  for (const e of entries) {
    const area = e.path.split('/').slice(0, e.path.startsWith('src/') ? 2 : 1).join('/');
    areas[area] = (areas[area] || 0) + 1;
  }
  const summary = {
    title: 'HIGHFLY C0 source metadata inventory',
    source: SOURCE,
    tag: TAG,
    commit: upstream.commitSha,
    codeImported: false,
    mediaApproved: false,
    scannedEntries: entries.length,
    creditsRows: credits.length,
    statusCounts,
    areas,
    policy: 'No media is automatically approved; credits rows are not per-file proof.'
  };
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'source-manifest.csv'),
    ['path,bytes,git_blob_sha,status', ...entries.map((x) => [
      x.path, x.bytes, x.sha, x.status
    ].map(csvCell).join(','))].join('\n') + '\n');
  await writeFile(join(OUT, 'credits-rows.json'), JSON.stringify(credits, null, 2) + '\n');
  await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  const lines = [
    '# HIGHFLY C0 — Upstream audit',
    '',
    '- Source: ' + SOURCE,
    '- Immutable commit: ' + upstream.commitSha,
    '- Paths inventoried: ' + entries.length,
    '- Credit rows captured: ' + credits.length,
    '- Code imported: **NO**',
    '- Media approved for publication: **NO**',
    '',
    '## Status counts',
    ...Object.entries(statusCounts).sort().map(([key, n]) => '- ' + key + ': ' + n),
    '',
    '## Important',
    'This is a metadata inventory, **not** a cleared asset manifest.',
    'Unknown paths or media must never be redistributed until independently checked.',
    'With the project only, reserved, noncommercial and unknown assets are excluded by HIGHFLY policy.',
    'The mapping.json entries for CraftPix must be individually inspected.',
    ''
  ];
  await writeFile(join(OUT, 'summary.md'), lines.join('\n'));
  console.log(lines.join('\n'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  audit().catch((error) => { console.error('C0 AUDIT FAILED:', error); process.exitCode = 1; });
}
