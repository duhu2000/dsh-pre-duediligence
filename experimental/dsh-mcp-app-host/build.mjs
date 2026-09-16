import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('lib', { recursive: true });
await build({ entryPoints: ['src/index.mjs'], outfile: 'lib/index.js', bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node24' });
const result = await build({ entryPoints: ['src/client.jsx'], bundle: true, platform: 'browser', format: 'cjs', target: 'es2022', jsx: 'automatic', external: ['react','react/jsx-runtime','react-dom'], write: false });
await writeFile('lib/client.js', `window.__ModuleLoader__.load({id:"dsh-f24-mcp-app-host",factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});`);
