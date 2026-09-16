// Prepares only repository-local synthetic test files. Never edits ~/.dsh.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const repo=new URL('../../../',import.meta.url);
const path=relative=>fileURLToPath(new URL(relative,repo));
await mkdir(path('_scratch/f24-empty-workspace'),{recursive:true});
await writeFile(path('_scratch/f24-host.patch.yml'),`- insert:
    - id: f24-mcp-app-host
      name: ${JSON.stringify(path('experimental/dsh-mcp-app-host/lib/index.js'))}
      config:
        syntheticOnly: true
        url: http://127.0.0.1:3001/mcp
    - id: f24-fixture-provider
      name: ${JSON.stringify(path('experimental/dsh-mcp-app-host/tests/fixture/index.mjs'))}
- id: agent-default-model
  config:
    provider: f24-fixture
    model: synthetic
`);
console.log('Prepared repository-local F24 patch and empty workspace. Use a separate DSH_HOME under _scratch/dsh-f24-profile.');
