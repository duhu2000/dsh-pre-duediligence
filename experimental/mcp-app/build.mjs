import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const result = await build({ entryPoints: ['ui/app.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
const template = await readFile('ui/report.html', 'utf8');
await mkdir('dist', { recursive: true });
await writeFile('dist/report.html', template.replace('/* APP_BUNDLE */', () => result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')));
