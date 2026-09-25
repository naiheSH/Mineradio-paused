#!/usr/bin/env node
'use strict';

// Node-level regression runner used by CI and `npm test`.
// Adapted from XxHuberrr/Mineradio-paused PR #404 (scripts/run-ci-tests.js).
// Electron-runtime tests are skipped here; they are not part of the Linux CI job.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TESTS_DIR = path.join(__dirname, '..', 'tests');
const SKIP = new Set([
  'qishui-passport-qr-login.test.js',
]);

const files = fs
  .readdirSync(TESTS_DIR)
  .filter((file) => file.endsWith('.test.js') && !SKIP.has(file))
  .sort();

let failed = 0;
let passed = 0;
const start = Date.now();

for (const file of files) {
  const filePath = path.join(TESTS_DIR, file);
  process.stdout.write(`=== ${file} ===\n`);
  const result = spawnSync(process.execPath, ['--test', filePath], {
    stdio: 'inherit',
    timeout: 120_000,
  });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(`\nFAIL: ${file} (exit ${result.status})\n`);
  } else {
    passed += 1;
  }
}

const elapsed = Math.round((Date.now() - start) / 1000);
process.stdout.write(`\n${passed} passed, ${failed} failed, ${files.length} total (${elapsed}s)\n`);
if (SKIP.size) {
  process.stdout.write(`skipped: ${[...SKIP].join(', ')}\n`);
}
if (failed > 0) process.exit(1);
