import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const dir=resolve('_scratch/f24-production-fixture');await mkdir(dir,{recursive:true});
let source=await readFile('experimental/dsh-mcp-app-host/tests/saved-fixture/source.mjs','utf8');
source=source.replace("fileURLToPath(new URL('../../../../_scratch/f24-saved-workspace',import.meta.url))",JSON.stringify(resolve('_scratch/f24-saved-workspace')));
await build({stdin:{contents:source,resolveDir:resolve('experimental/dsh-mcp-app-host/tests/saved-fixture'),sourcefile:'production-fixture.mjs'},outfile:dir+'/index.js',bundle:true,platform:'node',format:'esm',packages:'external',external:['/opt/homebrew/*'],target:'node24'});
await writeFile(dir+'/package.json',JSON.stringify({name:'f24-production-test-fixture',private:true,type:'module',main:'index.js'}));
await writeFile('_scratch/f24-production.patch.yml',`- insert:
    - id: f24-production-fixture
      name: ${JSON.stringify(dir+'/index.js')}
    - id: dsh-pre-duediligence
      name: ${JSON.stringify(resolve('lib/report-host.js'))}
      config:
        savedReports: true
- id: agent-default-model
  config:
    provider: f24-saved-fixture
    model: saved
`);
