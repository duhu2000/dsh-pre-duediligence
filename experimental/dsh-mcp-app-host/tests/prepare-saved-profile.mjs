import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const repo=new URL('../../../',import.meta.url),path=r=>fileURLToPath(new URL(r,repo));
await mkdir(path('_scratch/f24-saved-workspace'),{recursive:true});
await build({entryPoints:[path('experimental/dsh-mcp-app-host/tests/saved-fixture/source.mjs')],outfile:path('experimental/dsh-mcp-app-host/tests/saved-fixture/index.js'),bundle:true,platform:'node',format:'esm',packages:'external',external:['/opt/homebrew/*'],target:'node24'});
await writeFile(path('_scratch/f24-saved.patch.yml'),`- insert:
    - id: f24-saved-host
      name: ${JSON.stringify(path('experimental/dsh-mcp-app-host/lib/saved.js'))}
      config:
        savedReports: true
    - id: f24-saved-fixture
      name: ${JSON.stringify(path('experimental/dsh-mcp-app-host/tests/saved-fixture/index.js'))}
- id: agent-default-model
  config:
    provider: f24-saved-fixture
    model: saved
`);
console.log('Prepared isolated saved-report fixture.');
