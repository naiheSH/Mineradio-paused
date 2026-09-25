const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const serverText = fs.readFileSync(path.resolve(__dirname, '..', 'server.js'), 'utf8');

test('beatmap cache defaults to a user cache directory outside Windows', () => {
  assert.match(serverText, /function defaultBeatmapCacheDir\(\)/);
  assert.match(serverText, /if \(process\.platform === 'darwin'\) return path\.join\(os\.homedir\(\), 'Library', 'Caches', 'Mineradio', 'beatmaps'\);/);
  assert.match(serverText, /const base = process\.env\.XDG_CACHE_HOME \|\| path\.join\(os\.homedir\(\), '\.cache'\);/);
  assert.match(serverText, /const BEATMAP_CACHE_DIR = defaultBeatmapCacheDir\(\);/);
});

test('non-Windows beatmap cache does not use the Windows drive-letter gate', () => {
  assert.match(
    serverText,
    /if \(process\.platform !== 'win32'\) \{\s*return \{ dir, root, drive, allowed: !!root, available: !!root \};\s*\}/s
  );
});
