#!/usr/bin/env node
'use strict';

// Copies the handwritten section for one version out of CHANGELOG.md.
// Release notes are never generated from git history.

const fs = require('node:fs');

const version = String(process.argv[2] || '').replace(/^v/, '');
if (!version) {
  process.stderr.write('usage: node scripts/extract-release-notes.js <version>\n');
  process.exit(1);
}

const text = fs.readFileSync('CHANGELOG.md', 'utf8').replace(/\r\n/g, '\n');
const heading = `## v${version}`;
const start = text.indexOf(`${heading}\n`);
if (start < 0) {
  process.stderr.write(`CHANGELOG.md has no handwritten notes for v${version}\n`);
  process.exit(1);
}
const rest = text.slice(start + heading.length + 1);
const next = rest.search(/^## v/m);
const section = (next < 0 ? rest : rest.slice(0, next)).trim();
if (!section) {
  process.stderr.write(`CHANGELOG.md section for v${version} is empty\n`);
  process.exit(1);
}

const notes = [
  `## Mineradio v${version}`,
  '',
  '这是草稿发布。Windows 安装包是主发布物。macOS 是未签名、未公证的 Apple Silicon 包。Linux 是未签名 AppImage。',
  '',
  '完整桌面嵌入和 Wallpaper Engine 仍然只在 Windows 上可用。macOS 不能清理系统待机列表。',
  '',
  '校验值见随包的 `SHA256SUMS-*.txt`。',
  '',
  '## 更新日志',
  '',
  section,
  '',
].join('\n');

fs.mkdirSync('release', { recursive: true });
fs.writeFileSync('release-notes.md', notes);
fs.writeFileSync('release/RELEASE_NOTES.md', notes);
process.stdout.write(`Wrote handwritten notes for v${version}\n`);
