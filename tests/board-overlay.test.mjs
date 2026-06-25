import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const boardPath = path.resolve('src/components/Board.jsx');
const boardSource = fs.readFileSync(boardPath, 'utf8');

test('board renders river labels without using the full river band image overlay', () => {
  assert.doesNotMatch(
    boardSource,
    /staticFile\('assets\/new-board\/new-board-images\/board-lines\.svg'\)/,
    'Board should not overlay the full board-lines.svg image for the river labels'
  );

  assert.doesNotMatch(
    boardSource,
    /clipPath:\s*'inset\(44\.25% 0 44\.25% 0\)'/,
    'Board should not crop a river-band image into place'
  );
});
