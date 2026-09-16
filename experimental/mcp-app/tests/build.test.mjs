import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
test('delivered HTML contains one parseable bundled module, including SDK replacement-string tokens', async () => {
  const html = await readFile(new URL('../dist/report.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.ok(!html.includes('/* APP_BUNDLE */'));
  assert.ok(!html.includes('<script src='));
  await transform(scripts[0][1], { loader: 'js' });
});
