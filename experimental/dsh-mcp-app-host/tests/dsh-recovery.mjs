import {chromium} from '../../mcp-app/node_modules/playwright/index.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const repo=new URL('../../../',import.meta.url),path=r=>fileURLToPath(new URL(r,repo));
const home=path('_scratch/dsh-f24-recovery-profile'),out=path('_scratch/dsh-recovery-evidence');
await mkdir(out,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let child,bootCount=0;
async function boot(){
 const log=path(`_scratch/dsh-recovery-boot-${++bootCount}.log`),fd=await open(log,'w');
 child=spawn(process.execPath,['/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/lib/bin.js','web','--patch',path('_scratch/f24-saved.patch.yml'),'--host','127.0.0.1','--port','3091','--no-open'],{cwd:path('.'),env:{...process.env,DSH_HOME:home},stdio:['ignore',fd.fd,fd.fd]});
 await fd.close();
 for(let i=0;i<200;i++){if(child.exitCode!==null)throw new Error('DSH_BOOT_FAILED (see local log)');const url=(await readFile(log,'utf8')).match(/http:\/\/127[^\s]+/)?.[0];if(url)return url;await delay(100);}
 throw new Error('DSH_BOOT_TIMEOUT');
}
async function stop(){
 if(!child||child.exitCode!==null||child.signalCode!==null)return;
 const current=child;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{current.kill('SIGTERM');reject(new Error('DSH_STOP_TIMEOUT'));},10000);current.once('exit',()=>{clearTimeout(timer);resolve();});current.kill('SIGINT');});
}
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});page.setDefaultTimeout(15000);
const logs=[],errors=[];page.on('console',m=>{if(m.text().startsWith('F24'))logs.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
const digest=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const taskPath=home+'/storages/previsit_tasks_v1.json',receiptPath=home+'/storages/f24_saved_views_v1.json';
const app=()=>page.frameLocator('iframe[title="访前报告与证据（已保存）"]').last();
async function expand(){await page.getByRole('button',{name:'2 次工具调用',exact:true}).last().waitFor();if(!await page.locator('[data-f24-report]').last().isVisible())await page.getByRole('button',{name:'2 次工具调用',exact:true}).last().click();}
try{
 await page.goto(await boot());await page.getByRole('button',{name:'设置',exact:true}).waitFor();
 await page.getByRole('button',{name:'继续',exact:true}).waitFor({timeout:2500}).catch(()=>{});
 if(await page.getByRole('button',{name:'继续',exact:true}).count())await page.getByRole('button',{name:'继续',exact:true}).click();
 if(await page.locator('[contenteditable=true]').getAttribute('aria-label')==='选择工作区'){await page.getByRole('button',{name:'选择工作区',exact:true}).click();await page.getByText('F24 已保存报告验收',{exact:true}).last().click();}
 await page.getByRole('button',{name:'选择模型，当前 F24 保存格式验收（合成）',exact:true}).waitFor();await delay(800);
 await page.locator('[contenteditable=true]').click();await page.locator('[contenteditable=true]').pressSequentially('验证历史版本与宿主重启恢复（合成样本）',{delay:15});await page.getByRole('button',{name:'发送消息',exact:true}).click();
 await expand();await app().getByRole('heading',{name:'保存格式示例公司（合成）'}).waitFor();
 const versions=page.getByRole('combobox',{name:'报告版本'}).last();assert.equal(await versions.locator('option').count(),2);
 const entries=await versions.locator('option').evaluateAll(es=>es.map(e=>({id:e.value,label:e.textContent})));
 assert.match(entries[0].label,/V1/);assert.match(entries[1].label,/V2/);
 const taskBefore=await digest(taskPath);
 await versions.selectOption(entries[0].id);await app().locator('#meta').filter({hasText:'报告版本 1'}).waitFor();
 await app().getByRole('button',{name:/保存的材料判断/}).click();await app().locator('#evidence').filter({hasText:'2026-07-01'}).waitFor();assert.match(await app().locator('#evidence').innerText(),/50 万元/);
 await page.getByRole('button',{name:'关闭报告',exact:true}).click();await page.locator('iframe').waitFor({state:'detached'});
 await page.getByRole('button',{name:'重新打开报告',exact:true}).click();await app().locator('#meta').filter({hasText:'报告版本 1'}).waitFor();
 const sessionURL=page.url(),receiptBefore=await digest(receiptPath);
 assert.equal(await digest(taskPath),taskBefore);
 console.log('Version switch/ownership filtering passed; stopping real DSH process');
 await stop();
 const fresh=new URL(await boot()),restore=new URL(sessionURL);restore.searchParams.set('token',fresh.searchParams.get('token'));
 await page.goto(restore.href);await expand();await app().locator('#meta').filter({hasText:'报告版本 1'}).waitFor();
 assert.equal(await versions.inputValue(),entries[0].id);
 await app().getByRole('button',{name:/保存的材料判断/}).click();await app().locator('#evidence').filter({hasText:'2026-07-01'}).waitFor();
 assert.equal(await digest(receiptPath),receiptBefore);assert.equal(await digest(taskPath),taskBefore);
 await page.locator('[data-f24-report]').last().evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:out+'/restored-v1.png',fullPage:true});
 await versions.selectOption(entries[1].id);await app().locator('#meta').filter({hasText:'报告版本 2'}).waitFor();await app().getByRole('button',{name:/保存的材料判断/}).click();await app().locator('#evidence').filter({hasText:'2026-08-01'}).waitFor();assert.match(await app().locator('#evidence').innerText(),/100 万元/);
 await page.reload();await expand();await app().locator('#meta').filter({hasText:'报告版本 2'}).waitFor();
 assert.equal(await digest(taskPath),taskBefore);assert.deepEqual(errors,[]);
 await writeFile(out+'/result.json',JSON.stringify({passed:true,realDSHRestarts:1,filteredVersions:entries.map(e=>e.label),restoredVersion:1,switchedBackVersion:2,taskStorageUnchanged:true,receiptRecoveryReadOnly:true,taskSHA256:taskBefore,logs,errors},null,2));
 console.log('PASS: real process restart restores selected V1, evidence dates, V2 switchback, receipt read-only recovery and unchanged task bytes');
}catch(e){console.error(await page.locator('body').innerText().catch(()=>''));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser.close();await stop();}
