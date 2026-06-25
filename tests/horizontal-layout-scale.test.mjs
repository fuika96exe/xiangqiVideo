import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const compositionPath = path.resolve('src/Composition.tsx');
const compositionSource = fs.readFileSync(compositionPath, 'utf8');

test('horizontal 1080p layout scales the main elements with the canvas size', () => {
  assert.match(
    compositionSource,
    /top-\[60px\] left-\[84px\].*gap-\[18px\]/s,
    'Top-left brand block should scale up for 1080p'
  );

  assert.match(
    compositionSource,
    /top-\[60px\] right-\[84px\]/,
    'Top-right title block should scale up for 1080p'
  );

  assert.match(
    compositionSource,
    /top-\[38px\][\s\S]*scale\(1\.5\)/,
    'Board should be repositioned and scaled for 1080p'
  );

  assert.match(
    compositionSource,
    /bottom-\[45px\][\s\S]*padding: '15px 30px'/,
    'Subtitle container should scale up for 1080p'
  );
});
