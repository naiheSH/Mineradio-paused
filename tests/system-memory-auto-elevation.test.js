const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const appRoot = path.resolve(__dirname, '..');

const systemMemoryText = fs.readFileSync(
  path.join(appRoot, 'desktop', 'system-memory.js'),
  'utf8'
);
const persistenceText = fs.readFileSync(
  path.join(appRoot, 'public', 'js', 'modules', '02-visual', '04-visual-settings-persistence.js'),
  'utf8'
);
const defaultsText = fs.readFileSync(
  path.join(appRoot, 'public', 'js', 'modules', '00-state', '04-fx-defaults.js'),
  'utf8'
);
const controlsText = fs.readFileSync(
  path.join(appRoot, 'public', 'js', 'modules', '00-state', '11-system-memory-controls.js'),
  'utf8'
);

test('automatic system memory cleanup cannot request administrator elevation', () => {
  assert.match(
    systemMemoryText,
    /const autoElevate = options\.manual === true && options\.autoElevate === true;/
  );
});

test('automatic system memory elevation is disabled by default', () => {
  assert.match(defaultsText, /memorySystemAutoElevate:\s*false/);
  assert.match(defaultsText, /memorySafetyRevision:\s*4/);
});

test('legacy memory settings migrate away from automatic elevation', () => {
  assert.match(controlsText, /var MEMORY_SAFE_REVISION = 4;/);
  assert.match(
    controlsText,
    /if \(fx\.memorySafetyRevision !== MEMORY_SAFE_REVISION\) \{\s*fx\.memorySystemAutoElevate = false;\s*fx\.memorySafetyRevision = MEMORY_SAFE_REVISION;\s*\}/s
  );
});

test('legacy memory safety revision survives persistence loading for migration', () => {
  assert.match(
    persistenceText,
    /memorySystemAutoElevate:\s*raw\.memorySystemAutoElevate === true,[\s\S]*?memorySafetyRevision:\s*Number\(raw\.memorySafetyRevision\) \|\| 0,/
  );
});

test('background memory cleanup does not open a privilege prompt', () => {
  assert.doesNotMatch(systemMemoryText, /pkexec[\s\S]{0,400}options\.manual !== true/);
  assert.match(systemMemoryText, /if \(autoElevate && !elevated\) return purgeSystemMemoryElevated\(mask, options\);/);
  assert.match(systemMemoryText, /execFile\('pkexec'/);
  const elevatedStart = systemMemoryText.indexOf('function purgeLinuxMemoryElevated');
  const elevatedEnd = systemMemoryText.indexOf('function purgeSystemMemoryElevated');
  assert.ok(elevatedStart > 0 && elevatedEnd > elevatedStart);
  assert.match(systemMemoryText.slice(elevatedStart, elevatedEnd), /pkexec/);
  const backgroundStart = systemMemoryText.indexOf('function purgeSystemMemory(mask');
  const backgroundEnd = systemMemoryText.indexOf('function purgeLinuxMemoryElevated');
  assert.equal(systemMemoryText.slice(backgroundStart, backgroundEnd).includes('pkexec'), false);
});

test('linux and macOS memory cleanup stay inside their own system calls', () => {
  assert.match(systemMemoryText, /function linuxMemPurgeScript\(/);
  assert.match(systemMemoryText, /function purgeDarwinMemoryPressure\(/);
  assert.match(systemMemoryText, /if \(isLinux\) return purgeLinuxMemoryElevated\(mask\);/);
  assert.match(systemMemoryText, /if \(isDarwin\) return purgeDarwinMemoryPressure\(\);/);
  assert.doesNotMatch(systemMemoryText, /System memory purge is Windows-only/);
});
