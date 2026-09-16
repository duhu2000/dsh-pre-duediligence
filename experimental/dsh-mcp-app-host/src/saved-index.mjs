import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { z } from 'zod';
import { createServer } from '../../mcp-app/server/app-server.mjs';
import { createSavedReader } from '../../mcp-app/server/saved-reader.mjs';
import { createBindings, PUBLIC_TOOL, REPORT_TOOL, RESOURCE, MIME, CHANNEL, APP_TOOLS } from './bindings.mjs';
export const name='f24-saved-report-host';
export const inject=['tools','connection','previsitSavedReports'];
const identity=z.object({viewId:z.string().uuid(),sessionId:z.string().min(1),callId:z.string().min(1)});
const argsSchema={type:'object',properties:{reportId:{type:'string',pattern:'^PV-\\d{8}-[A-Z0-9-]{4,40}$'},reportVersion:{type:'integer',minimum:1}},required:['reportId','reportVersion'],additionalProperties:false};
async function withClient(reader, operation) {
 const server=createServer({reader,mode:'saved',resourcePath:new URL('./report.html',import.meta.url)});
 const client=new Client({name:'DSH saved report host',version:'0.0.0'},{capabilities:{extensions:{'io.modelcontextprotocol/ui':{mimeTypes:[MIME]}}}});
 const [a,b]=InMemoryTransport.createLinkedPair();
 try {await server.connect(b);await client.connect(a);return await operation(client);} finally {await Promise.allSettled([client.close(),server.close()]);}
}
export function apply(ctx,input) {
 z.object({savedReports:z.literal(true)}).strict().parse(input);
 const views=createBindings({validateReport:(r,args)=>r?.schemaVersion==='1.0'&&r.sourceKind==='saved-task'&&r.reportId===args.reportId&&r.reportVersion===args.reportVersion&&typeof r.sourceDigest==='string'&&!!r.entity?.id});
 let disposed=false;const pending=new Set();
 ctx.effect(()=>()=>{disposed=true;pending.forEach(c=>c.abort());views.clear();});
 ctx.effect(()=>ctx.tools.register({name:PUBLIC_TOOL,description:'只读打开本会话、本工作区已保存的访前报告。必须指定已知 PV 任务 ID 和报告版本；不创建任务、不查询企业、不生成文件。',parameters:argsSchema,
  output:{schema:{type:'object',properties:{viewId:{type:'string'},sessionId:{type:'string'},callId:{type:'string'},result:{type:'object',additionalProperties:true}},required:['viewId','sessionId','callId','result'],additionalProperties:false},render:(_a,v)=>v.result.content,presentationMeta:(_a,v)=>({f24App:{...v,resourceUri:RESOURCE}})},
  async execute(args,exec){
   if(disposed)throw new Error('HOST_DISPOSED');
   const scope={sessionId:exec.agent?.session?.id,workspace:exec.agent?.session?.header?.cwd};
   if(!scope.sessionId||!scope.workspace)throw new Error('TRUSTED_SCOPE_REQUIRED');
   const result=await withClient(createSavedReader(ctx.previsitSavedReports,scope),client=>client.callTool({name:REPORT_TOOL,arguments:args},{signal:exec.signal}));
   if(result.isError)throw new Error(result.content?.[0]?.text??'READ_FAILED');
   if(disposed)throw new Error('HOST_DISPOSED');
   return views.mint({sessionId:scope.sessionId,callId:exec.callId,args,result,scope});
  }
 }));
 ctx.effect(()=>ctx.connection.rpc.handle(CHANNEL,async(endpoint,payload,signal)=>{
  const controller=new AbortController();pending.add(controller);
  try {
   if(disposed)throw new Error('HOST_DISPOSED');
   const signalBound=AbortSignal.any([signal,controller.signal]);signalBound.throwIfAborted();
   const data=(endpoint==='call'?identity.extend({name:z.enum(APP_TOOLS),arguments:z.record(z.string(),z.unknown())}):identity).strict().parse(payload);
   const view=views.get(data);
   const reader=createSavedReader(ctx.previsitSavedReports,view.scope,{expectedDigest:view.result.structuredContent.sourceDigest});
   // Reauthorize every read, including HTML resource requests. A cached view is
   // not permission to keep reading a deleted, reassigned or changed report.
   await reader.getReport(view.args);signalBound.throwIfAborted();
   if(endpoint==='resource'){
    const result=await withClient(reader,client=>client.readResource({uri:RESOURCE},{signal:signalBound}));
    return {ok:true,value:{html:result.contents[0].text}};
   }
   if(endpoint==='call'){
    views.allowCall(data,data.name,data.arguments);
    const value=await withClient(reader,client=>client.callTool({name:data.name,arguments:data.arguments},{signal:signalBound}));
    return {ok:true,value};
   }
   throw new Error('UNKNOWN_ENDPOINT');
  }catch(e){return {ok:false,error:{code:'bad-request',message:e.message,details:{issues:[]}}};}
  finally{pending.delete(controller);}
 }));
}
