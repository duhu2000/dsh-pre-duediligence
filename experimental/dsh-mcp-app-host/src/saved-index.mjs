import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { z } from 'zod';
import { createServer } from '../../mcp-app/server/app-server.mjs';
import { createSavedReader } from '../../mcp-app/server/saved-reader.mjs';
import { openReceipts } from './receipts.mjs';
import { PUBLIC_TOOL, REPORT_TOOL, RESOURCE, MIME, CHANNEL, APP_TOOLS } from './bindings.mjs';
export const name='f24-saved-report-host';
export const inject=['tools','connection','previsitSavedReports','storageDomain'];
const identity=z.object({viewId:z.string().uuid(),sessionId:z.string().min(1),callId:z.string().min(1)});
const argsSchema={type:'object',properties:{reportId:{type:'string',pattern:'^PV-\\d{8}-[A-Z0-9-]{4,40}$'},reportVersion:{type:'integer',minimum:1}},required:['reportId','reportVersion'],additionalProperties:false};
async function withClient(reader, operation) {
 const server=createServer({reader,mode:'saved',resourcePath:new URL('./report.html',import.meta.url)});
 const client=new Client({name:'DSH saved report host',version:'0.0.0'},{capabilities:{extensions:{'io.modelcontextprotocol/ui':{mimeTypes:[MIME]}}}});
 const [a,b]=InMemoryTransport.createLinkedPair();
 try {await server.connect(b);await client.connect(a);return await operation(client);} finally {await Promise.allSettled([client.close(),server.close()]);}
}
export async function apply(ctx,input) {
 z.object({savedReports:z.literal(true)}).strict().parse(input);
 const receipts=await openReceipts(ctx.storageDomain);
 let disposed=false;const pending=new Set();
 ctx.effect(()=>async()=>{disposed=true;pending.forEach(c=>c.abort());await receipts.close();});
 async function resultFor(reader,args,signal){
  const result=await withClient(reader,client=>client.callTool({name:REPORT_TOOL,arguments:args},{signal}));
  if(result.isError)throw new Error(result.content?.[0]?.text??'READ_FAILED');
  return result;
 }
 const argsOf=r=>({reportId:r.active.reportId,reportVersion:r.active.reportVersion});
 ctx.effect(()=>ctx.tools.register({name:PUBLIC_TOOL,description:'只读打开本会话、本工作区已保存的访前报告。必须指定已知 PV 任务 ID 和报告版本；不创建任务、不查询企业、不生成文件。',parameters:argsSchema,
  output:{schema:{type:'object',properties:{viewId:{type:'string'},sessionId:{type:'string'},callId:{type:'string'},result:{type:'object',additionalProperties:true}},required:['viewId','sessionId','callId','result'],additionalProperties:false},render:(_a,v)=>v.result.content,presentationMeta:(_a,v)=>({f24App:{...v,resourceUri:RESOURCE}})},
  async execute(args,exec){
   if(disposed)throw new Error('HOST_DISPOSED');
   const scope={sessionId:exec.agent?.session?.id,workspace:exec.agent?.session?.header?.cwd};
   if(!scope.sessionId||!scope.workspace)throw new Error('TRUSTED_SCOPE_REQUIRED');
   const result=await resultFor(createSavedReader(ctx.previsitSavedReports,scope),args,exec.signal);
   if(disposed)throw new Error('HOST_DISPOSED');exec.signal?.throwIfAborted();
   const receipt=await receipts.issue({sessionId:scope.sessionId,callId:exec.callId,args,scope,digest:result.structuredContent.sourceDigest});
   return {viewId:receipt.viewId,sessionId:receipt.sessionId,callId:receipt.callId,result};
  }
 }));
 ctx.effect(()=>ctx.connection.rpc.handle(CHANNEL,async(endpoint,payload,signal)=>{
  const controller=new AbortController();pending.add(controller);
  try {
   if(disposed)throw new Error('HOST_DISPOSED');
   const signalBound=AbortSignal.any([signal,controller.signal]);signalBound.throwIfAborted();
   if(!['resource','call','select-version'].includes(endpoint))throw new Error('UNKNOWN_ENDPOINT');
   const fields=endpoint==='call'?{name:z.enum(APP_TOOLS),arguments:z.record(z.string(),z.unknown())}:endpoint==='select-version'?{reportId:z.string(),reportVersion:z.number().int().positive()}:{};
   const data=identity.extend(fields).strict().parse(payload);
   return await receipts.use(data,async receipt=>{
    const args=argsOf(receipt);
    const reader=createSavedReader(ctx.previsitSavedReports,receipt.scope,{expectedDigest:receipt.active.digest});
    // Reauthorize from the business store on EVERY operation, including restart
    // recovery. Never reconstruct receipts from browser-supplied report data.
    const report=await reader.getReport(args);signalBound.throwIfAborted();
    if(endpoint==='resource'){
     let versions=[],versionError;
     try{versions=await ctx.previsitSavedReports.versions(args.reportId,args.reportVersion,receipt.scope);}catch(e){versionError=e.message;}
     const result=await resultFor(reader,args,signalBound);
     const resource=await withClient(reader,client=>client.readResource({uri:RESOURCE},{signal:signalBound}));
     return {ok:true,value:{html:resource.contents[0].text,result,versions,...(versionError?{versionError}:{})}};
    }
    if(endpoint==='select-version'){
     const target={reportId:data.reportId,reportVersion:data.reportVersion};
     const versions=await ctx.previsitSavedReports.versions(args.reportId,args.reportVersion,receipt.scope);
     if(!versions.some(v=>v.reportId===target.reportId&&v.reportVersion===target.reportVersion))throw new Error('VERSION_NOT_ACCESSIBLE');
     const old=receipt.pins.find(p=>p.reportId===target.reportId&&p.reportVersion===target.reportVersion);
     const next=await createSavedReader(ctx.previsitSavedReports,receipt.scope,{expectedDigest:old?.digest}).getReport(target);
     if(disposed)throw new Error('HOST_DISPOSED');signalBound.throwIfAborted();
     await receipts.select(receipt,target,next.sourceDigest);
     return {ok:true,value:{reportId:target.reportId,reportVersion:target.reportVersion}};
    }
    if(data.arguments.reportId!==args.reportId||data.arguments.reportVersion!==args.reportVersion)throw new Error('REPORT_SCOPE_MISMATCH');
    if(data.name==='previsit_evidence_get'&&!report.findings.some(f=>f.evidenceIds.includes(data.arguments.evidenceId)))throw new Error('EVIDENCE_NOT_IN_REPORT');
    const value=await withClient(reader,client=>client.callTool({name:data.name,arguments:data.arguments},{signal:signalBound}));
    return {ok:true,value};
   });
  }catch(e){return {ok:false,error:{code:'bad-request',message:e.message,details:{issues:[]}}};}
  finally{pending.delete(controller);}
 }));
}
