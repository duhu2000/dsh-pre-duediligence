import {build} from 'esbuild';import {readFile,writeFile,mkdir,open} from 'node:fs/promises';import {resolve} from 'node:path';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {chromium} from '../../mcp-app/node_modules/playwright/index.mjs';
const dir=resolve('_scratch/f24-main-fixture');await mkdir(dir,{recursive:true});
let source=await readFile('experimental/dsh-mcp-app-host/tests/saved-fixture/source.mjs','utf8');
source=source.replace('const store=new PrevisitWorkflowStore();await store.attach(ctx.storageDomain);', '').replace("ctx.provide('previsitSavedReports',createSavedReportSource(store));",'');
source=source.replace("fileURLToPath(new URL('../../../../_scratch/f24-saved-workspace',import.meta.url))",JSON.stringify(resolve('_scratch/f24-saved-workspace')));
const start=source.indexOf('  const t=savedTask('),end=source.indexOf('  return {reportId:t.id};',start);
source=source.slice(0,start)+`const key=createHash('sha256').update(exec.agent.session.id).digest('hex').slice(0,12).toUpperCase(); const t={id:\`PV-20260916-\${key}-V2\`};\n`+source.slice(end);
await build({stdin:{contents:source,resolveDir:resolve('experimental/dsh-mcp-app-host/tests/saved-fixture')},outfile:dir+'/index.js',bundle:true,platform:'node',format:'esm',packages:'external',external:['/opt/homebrew/*'],target:'node24'});
await writeFile(dir+'/package.json',JSON.stringify({name:'f24-main-smoke-fixture',private:true,type:'module',main:'index.js'}));
await writeFile('_scratch/f24-main.patch.yml',`- insert:
    - id: dsh-pre-duediligence
      name: ${JSON.stringify(resolve('lib/index.js'))}
    - id: f24-fixture-model
      name: ${JSON.stringify(dir+'/index.js')}
- id: agent-default-model
  config:
    provider: f24-saved-fixture
    model: saved
`);
const fd=await open('_scratch/f24-main.log','w');const child=spawn(process.execPath,['/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/lib/bin.js','web','--patch',resolve('_scratch/f24-main.patch.yml'),'--host','127.0.0.1','--port','3092','--no-open'],{env:{...process.env,DSH_HOME:resolve('_scratch/dsh-f24-production-bundle-profile')},stdio:['ignore',fd.fd,fd.fd]});await fd.close();
let browser;const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{let url;for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error('boot failed');url=(await readFile('_scratch/f24-main.log','utf8')).match(/http:\/\/127[^\s]+/)?.[0];if(url)break;await delay(100);}
assert.ok(url);const bootlog=await readFile('_scratch/f24-main.log','utf8');assert.ok(!bootlog.includes('unavailable'));const previous=JSON.parse(await readFile('_scratch/f24-production-evidence/result.json'));
browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(url);await page.getByRole('button',{name:'设置',exact:true}).waitFor();await page.getByText('已保存报告适配验收完成（合成样本，无外部模型请求）。',{exact:true}).first().click();await page.getByRole('button',{name:'2 次工具调用',exact:true}).last().click();
const app=()=>page.frameLocator('iframe[title="访前报告与证据（已保存）"]').last();await app().getByRole('heading',{name:'保存格式示例公司（合成）'}).waitFor();await app().getByRole('button',{name:/保存的材料判断/}).click();await app().locator('#evidence').filter({hasText:'100 万元'}).waitFor();
await page.locator('[contenteditable=true]').fill('打开已保存报告与证据');await page.getByRole('button',{name:'发送消息',exact:true}).click();await page.getByRole('button',{name:'2 次工具调用',exact:true}).nth(1).waitFor();await page.getByRole('button',{name:'2 次工具调用',exact:true}).last().click();await app().getByRole('heading',{name:'保存格式示例公司（合成）'}).waitFor();assert.deepEqual(errors,[]);await writeFile('_scratch/f24-production-evidence/main-entry.json',JSON.stringify({passed:true,mainPlugin:true,realSavedSource:true,recoveredCard:true,newToolCall:true,errors},null,2));console.log('PASS main plugin + real saved source: recovery and new report tool call');
}catch(e){if(browser){const p=browser.contexts()[0]?.pages()[0];console.error(await p?.locator('body').innerText());}throw e;}finally{await browser?.close();child.kill('SIGINT');await new Promise(r=>{if(child.exitCode!==null||child.signalCode!==null)return r();const t=setTimeout(()=>child.kill('SIGTERM'),5000);child.once('exit',()=>{clearTimeout(t);r();});});}
