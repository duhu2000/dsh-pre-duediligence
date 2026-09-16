import { chromium } from '../../mcp-app/node_modules/playwright/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const repo = new URL('../../../', import.meta.url);
const evidence = new URL('_scratch/dsh-evidence/', repo);
await mkdir(evidence,{recursive:true});
const url=(await readFile(new URL('_scratch/dsh-host.log',repo),'utf8')).match(/http:\/\/127[^\s]+/)[0];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(12000);
const logs=[],errors=[];
page.on('console',m=>{if(m.text().startsWith('F24')) logs.push(m.text());});
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__f24wire=[];window.addEventListener('message',e=>{if(e.data?.jsonrpc)window.__f24wire.push(e.data);});});
const expand=async()=>{ const b=page.getByRole('button',{name:'1 次工具调用',exact:true}).last(); if(await b.count()) await b.click(); };
try {
 await page.goto(url);
 await page.getByRole('button',{name:'设置',exact:true}).waitFor();
 if(await page.getByRole('button',{name:'继续',exact:true}).count()) await page.getByRole('button',{name:'继续',exact:true}).click();
 await page.locator('[contenteditable=true]').fill('打开合成访前报告 demo-report v1');
 await page.getByRole('button',{name:'发送消息',exact:true}).click();
 await page.getByRole('button',{name:'1 次工具调用',exact:true}).last().waitFor();
 console.log('Expand native tool call'); await expand();
 const iframe=page.frameLocator('iframe[title="访前报告与证据（合成）"]');
 await iframe.getByRole('heading',{name:'示例智造有限公司（合成）'}).waitFor();
 console.log('Report rendered');
 const frame=await (await iframe.locator('html').elementHandle()).ownerFrame();
 for(const [title,text] of [['扩产意向','2026-09-01'],['回款改善','两笔应收款'],['客户集中度','<script>']]) {
   await iframe.getByRole('button',{name:new RegExp(title)}).click();
   await iframe.locator('#evidence').filter({hasText:text}).waitFor();
 }
 assert.equal(await frame.evaluate(()=>window.externalInstruction),undefined);
 assert.equal(await frame.evaluate(()=>{try{return !!top.document.body;}catch{return false;}}),false);
 assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
 assert.equal(await frame.evaluate(async()=>{try{await fetch('http://127.0.0.1:3001/mcp');return true;}catch{return false;}}),false);
 async function rawCall(name,args) {
   return frame.evaluate(({name,args})=>new Promise(resolve=>{
     const id='negative-'+Math.random();const timer=setTimeout(()=>{window.removeEventListener('message',listener);resolve({timeout:true});},5000);
     const listener=e=>{if(e.data?.id===id){clearTimeout(timer);window.removeEventListener('message',listener);resolve(e.data);}};
     window.addEventListener('message',listener);parent.postMessage({jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:args}},'*');
   }),{name,args});
 }
 const args={reportId:'demo-report',reportVersion:1,evidenceId:'e1'};
 console.log('Evidence and sandbox passed');
 const negatives=[];
 for(const [name,input,expected] of [
   ['previsit_evidence_get',{...args,reportVersion:2},'REPORT_SCOPE_MISMATCH'],
   ['previsit_evidence_get',{...args,evidenceId:'not-in-report'},'EVIDENCE_NOT_IN_REPORT'],
   ['previsit_report_open',args,'TOOL_NOT_APP_VISIBLE'],
   ['bash',{},'TOOL_NOT_APP_VISIBLE']]) {
   const response=await rawCall(name,input);assert.match(JSON.stringify(response),new RegExp(expected));negatives.push({name,expected,response});
 }
 await iframe.getByRole('button',{name:/扩产意向/}).click();
 await iframe.locator('#evidence').filter({hasText:'2026-09-01'}).waitFor();
 await page.locator('[data-f24-report]').evaluate(el=>el.scrollIntoView({block:'start'}));
 await page.screenshot({path:new URL('dsh-desktop.png',evidence).pathname,fullPage:true});
 const wire=(await Promise.all(page.frames().map(f=>f.evaluate(()=>window.__f24wire??[])))).flat();
 assert.ok(wire.some(m=>m.method==='ui/initialize'));
 await page.getByRole('button',{name:'关闭报告',exact:true}).click();
 await page.locator('iframe').waitFor({state:'detached'});
 assert.ok(logs.includes('F24 teardown-complete'));
 await page.getByRole('button',{name:'重新打开报告',exact:true}).click();
 await iframe.getByRole('heading',{name:'示例智造有限公司（合成）'}).waitFor();
 await page.reload();
 await page.getByRole('button',{name:'1 次工具调用',exact:true}).last().waitFor();
 console.log('Expand native tool call'); await expand();
 await iframe.getByRole('heading',{name:'示例智造有限公司（合成）'}).waitFor();
 await iframe.getByRole('button',{name:/回款改善/}).click();
 await iframe.locator('#evidence').filter({hasText:'两笔应收款'}).waitFor();
 await page.screenshot({path:new URL('dsh-reloaded.png',evidence).pathname,fullPage:true});
 assert.deepEqual(errors,[]);
 await writeFile(new URL('result.json',evidence),JSON.stringify({passed:true,host:'DSH 0.1.2-rc.1',logs,errors,negatives,wire},null,2));
 console.log('PASS: real DSH execution, metadata, App handshake, 3 evidence, scoped refusals, sandbox, teardown/reopen, browser reload');
} catch(e) { console.error(await page.locator('body').innerText()); await page.screenshot({path:new URL('failure.png',evidence).pathname,fullPage:true}); throw e; }
finally {await browser.close();}
