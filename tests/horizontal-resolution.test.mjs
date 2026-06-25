import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootPath = path.resolve('src/Root.tsx');
const rootSource = fs.readFileSync(rootPath, 'utf8');

test('horizontal composition renders at 1080p', () => {
  assert.match(
    rootSource,
    /id="MyComp"[\s\S]*width=\{1920\}[\s\S]*height=\{1080\}/,
    'MyComp should render at 1920x1080'
  );
});
