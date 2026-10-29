// C0-B: source import dependency reconnaissance. Read-only upstream sparse checkout.
// This is a heuristic TS/JS static import graph, not a full TypeScript compiler graph.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, dirname, posix } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = process.env.C0_GRAPH_OUT || 'reports/c0/graphs';
const SCOPES = ['src/sim', 'src/editor', 'src/game', 'src/render', 'src/world_api', 'src/net'];
const ROOTS = [
  'src/sim/world.ts',
  'src/sim/data.ts',
  'src/sim/sim.ts',
  'src/sim/mob/locomotion.ts',
  'src/editor/3d/viewport.ts',
  'src/game/offline_world_config.ts'
];
const sourceExt = /\.(?:ts|tsx|js|mjs|cjs|jsx)$/i;
const assetPattern = /["'](\/(?:models|textures|audio|vfx|ui|env|fonts|map_art|map_bg)\/[^"'\s]+)["']/g;

export function importSpecifiers(source) {
  const result = [];
  // Static import, export-from, side-effect import, dynamic import and require.
  const re = /\b(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s*)(['"])(\.[^'"]+)\1/g;
  let match;
  while ((match = re.exec(source))) result.push(match[2]);
  return [...new Set(result)];
}
export function assetReferences(source) {
  const found = new Set();
  for (const m of source.matchAll(assetPattern)) found.add(m[1]);
  return [...found].sort();
}
export function resolveRelative(from, spec, known) {
  const base = posix.normalize(posix.join(posix.dirname(from), spec)).split('?')[0];
  const candidates = [base, base + '.ts', base + '.tsx', base + '.js', base + '.mjs',
    base + '.json', base + '/index.ts', base + '/index.tsx', base + '/index.js'];
  return candidates.find((c) => known.has(c)) || null;
}
async function walk(dir, base, files) {
  const items = await readdir(dir, { withFileTypes: true });
  for (const entry of items) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, base, files);
    else if (sourceExt.test(entry.name)) files.push(relative(base, p).split('\\').join('/'));
  }
}
export function analyzeSources(sources) {
  const known = new Set(sources.keys());
  const edges = [];
  const mediaRefs = [];
  const next = new Map();
  for (const [file, content] of sources) {
    const resolved = [];
    for (const spec of importSpecifiers(content)) {
      const target = resolveRelative(file, spec, known);
      const path = posix.normalize(posix.join(posix.dirname(file), spec));
      const status = target ? 'RESOLVED_SCANNED' :
        SCOPES.some((s) => path === s || path.startsWith(s + '/'))
          ? 'REVIEW_MISSING_OR_NONCODE' : 'OUTSIDE_CHECKOUT';
      edges.push({ from: file, import: spec, target: target || path, status });
      if (target) resolved.push(target);
    }
    next.set(file, resolved);
    for (const asset of assetReferences(content)) mediaRefs.push({ file, asset, status: 'REVIEW_MEDIA' });
  }
  const closures = ROOTS.map((root) => {
    const visited = new Set();
    const pending = [root];
    while (pending.length) {
      const x = pending.pop();
      if (visited.has(x) || !known.has(x)) continue;
      visited.add(x);
      for (const y of next.get(x) || []) pending.push(y);
    }
    return { root, scanned: known.has(root), reachableScannedModules: visited.size };
  });
  const unresolved = edges.filter((x) => x.status !== 'RESOLVED_SCANNED');
  return { modulesScanned: sources.size, edges, mediaRefs, closures, unresolved };
}
async function main() {
  const upstreamDir = process.argv[2] || 'upstream';
  const files = [];
  for (const scope of SCOPES) await walk(join(upstreamDir, scope), upstreamDir, files);
  const sources = new Map();
  for (const file of files) sources.set(file, await readFile(join(upstreamDir, file), 'utf8'));
  const report = analyzeSources(sources);
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'summary.json'), JSON.stringify({
    sourceTag: 'v0.44.7',
    filesScanned: report.modulesScanned,
    importEdges: report.edges.length,
    importEdgesNeedingFollowup: report.unresolved.length,
    staticMediaRefs: report.mediaRefs.length,
    roots: report.closures,
    disclaimer: 'Regex-only static code reconnaissance; missing imports may be unscanned files, not bugs.'
  }, null, 2) + '\n');
  await writeFile(join(OUT, 'imports.json'), JSON.stringify(report.edges, null, 2) + '\n');
  await writeFile(join(OUT, 'media-references.json'),
    JSON.stringify(report.mediaRefs, null, 2) + '\n');
  await writeFile(join(OUT, 'root-closures.json'),
    JSON.stringify(report.closures, null, 2) + '\n');
  const lines = [
    '# C0-B — World dependency map',
    '- Source tag: v0.44.7; repository checkout was sparse and read-only',
    '- Scanned code modules: ' + report.modulesScanned,
    '- Static relative import edges: ' + report.edges.length,
    '- Edges outside current scope or unresolved: ' + report.unresolved.length,
    '- Static media references requiring licence verification: ' + report.mediaRefs.length,
    '',
    '## Root dependency closures',
    ...report.closures.map((r) => '- ' + r.root + ': ' + (r.scanned ? r.reachableScannedModules + ' scanned files' : 'NOT FOUND')),
    '',
    'This is a preliminary import graph: not all dynamic imports, generated code, CSS or runtime references are captured.',
    'No upstream asset or code is copied into HIGHFLY by this report.',
    ''
  ];
  await writeFile(join(OUT, 'summary.md'), lines.join('\n'));
  console.log(lines.join('\n'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error('C0 GRAPH FAILED:', err); process.exitCode = 1; });
}
