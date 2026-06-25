import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const scriptPath = path.resolve('scripts/prepareData.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

test('prepareData derives the output mp4 name from the input json file', () => {
  assert.match(
    scriptSource,
    /path\.basename\(resolvedPath,\s*path\.extname\(resolvedPath\)\)/,
    'prepareData should derive a basename from the resolved JSON path'
  );

  assert.match(
    scriptSource,
    /path\.join\(__dirname,\s*'\.\.',\s*'out',\s*`\$\{outputBaseName\}\.mp4`\)/,
    'prepareData should render into out/<json-name>.mp4'
  );
});
