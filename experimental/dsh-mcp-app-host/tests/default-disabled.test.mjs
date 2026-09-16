import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('production entry does not mount experimental host or client but retains workbench and lab artifacts',async()=>{
 const {apply}=await import('../../../lib/index.js');
 const deps=[],skills=[];
 apply({tools:{},effect:()=>{},provide:()=>{},inject:names=>deps.push(names),skills:{register:s=>skills.push(s)}});
 assert.ok(deps.some(names=>names.includes('webServer')&&names.includes('storageDomain')));
 assert.equal(deps.some(names=>names.includes('connection')||names.includes('previsitSavedReports')),false);
 assert.equal(skills.length,1);
 assert.ok(!skills[0].content.includes('f24_previsit_report_open'));
 const client=await readFile(new URL('../../../lib/client.js',import.meta.url),'utf8');
 assert.ok(client.includes('dsh-pre-duediligence'));
 assert.ok(!client.includes('f24_previsit_report_open'));
 assert.ok(!client.includes('/f24-mcp-app'));
 const lab=await import('../../../lib/report-host.js');assert.equal(typeof lab.apply,'function');
});
