#!/usr/bin/env node
'use strict';

// Checks a packed directory for the expected binary and for cookie/secret files.
// Adapted from XxHuberrr/Mineradio-paused PR #404 (scripts/verify-package.js),
// extended for the macOS arm64 and Linux directory layouts used on this branch.

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

function error(message) {
  errors.push(message);
  process.stderr.write(`[ERR] ${message}\n`);
}

function ok(message) {
  process.stdout.write(`[OK] ${message}\n`);
}

function warn(message) {
  process.stdout.write(`[WARN] ${message}\n`);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    out.push(full);
    if (entry.isDirectory()) walk(full, out);
  }
  return out;
}

const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) {
  warn('dist/ not found — skip artifact checks (run a build first)');
} else {
  const expectedBins = [
    ['win-unpacked/Mineradio.exe', 'Windows directory'],
    ['mac-arm64/Mineradio.app/Contents/MacOS/Mineradio', 'macOS arm64 app'],
    ['linux-unpacked/mineradio', 'Linux directory'],
  ];
  let foundBin = false;
  for (const [relativePath, label] of expectedBins) {
    const full = path.join(distDir, relativePath);
    if (fs.existsSync(full)) {
      foundBin = true;
      ok(`${label}: ${relativePath}`);
    }
  }
  if (!foundBin) warn('No known unpacked binary found under dist/');
  ok(`package version: ${pkg.version}`);

  const names = walk(distDir).map((file) => path.basename(file));
  const dangerous = [
    '.cookie',
    '.qq-cookie',
    '.kugou-cookie',
    '.qishui-cookie',
    '.env',
    'spotify-credentials.json',
  ];
  for (const bad of dangerous) {
    if (names.some((name) => name === bad || name.endsWith(bad))) {
      error(`Sensitive file found in build: ${bad}`);
    }
  }
  if (names.some((name) => name.endsWith('.test.js'))) {
    error('Test files found in build artifact');
  } else {
    ok('No test files in build artifact');
  }
}

if (errors.length) {
  process.stdout.write(`\n${errors.length} error(s)\n`);
  process.exit(1);
}
process.stdout.write('\nAll checks passed\n');
