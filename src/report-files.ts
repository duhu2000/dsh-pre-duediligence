import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import PDFDocument from "pdfkit"
import type { PrevisitTaskRecord, StorageDomain } from "./previsit-workflow.js"

export type ReportFile = { id:string; taskId:string; version:number; format:"pdf"|"docx"; fileName:string; mediaType:string; sourceHash:string; sha256:string; createdAt:string; size:number }
type StoredFile = ReportFile & { base64:string }
export type DeliveryRequest = { id:string; fileId:string; taskId:string; destination:string; requestedAt:string; status:"awaiting-configuration" }
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex")
const mime = {pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

/** Text-preserving export: markdown notation stays visible; no remote images, HTML or scripts execute. */
export async function renderReportFile(task:PrevisitTaskRecord,format:"pdf"|"docx",fontPath=process.env.DSH_PREVISIT_PDF_FONT):Promise<Buffer> {
  if (!task.reportMarkdown || !task.completedAt) throw new Error("报告尚未保存")
  const lines = task.reportMarkdown.split(/\r?\n/)
  const identity = `${task.entity?.fullName ?? task.query} · V${task.reportVersion ?? 1} · ${task.id}`
  if (format === "docx") {
    const fontName=process.env.DSH_PREVISIT_DOCX_FONT ?? "Arial Unicode MS"
    return Packer.toBuffer(new Document({creator:"访前尽调",title:identity,styles:{default:{document:{run:{font:fontName,size:24,color:"000000"},paragraph:{spacing:{after:140}}}}},sections:[{
      properties:{page:{size:{width:12240,height:15840},margin:{top:1080,bottom:1080,left:1080,right:1080}}},
      children:[new Paragraph({heading:HeadingLevel.TITLE,children:[new TextRun({text:task.entity?.fullName??task.query,font:fontName,size:32,color:"000000"})]}),new Paragraph({children:[new TextRun({text:`V${task.reportVersion??1} · ${task.id}`,font:fontName,size:20,color:"000000"})]}),...lines.map(line=>new Paragraph({children:[new TextRun({text:line,font:fontName,size:24,color:"000000"})]}))],
    }]}))
  }
  // An explicit override must work; otherwise use the licensed offline font shipped with the package.
  const font = await readFile(fontPath || new URL("../assets/fonts/NotoSansCJKsc-Regular.otf", import.meta.url))
  if (font.length > 40_000_000) throw new Error("字体文件过大")
  return new Promise((resolve,reject)=>{
    const pdf = new PDFDocument({size:"LETTER",margin:54,info:{Title:identity,Creator:"访前尽调"}})
    const chunks:Buffer[]=[]
    pdf.on("data",chunk=>chunks.push(chunk)); pdf.on("error",reject); pdf.on("end",()=>resolve(Buffer.concat(chunks)))
    try { pdf.font(font).fontSize(16).text(identity).moveDown(); pdf.fontSize(11).text(task.reportMarkdown!,{lineGap:4}); pdf.end() }
    catch(error){pdf.destroy();reject(error)}
  })
}

export class ReportFiles {
  private files = new Map<string,StoredFile>()
  private deliveries = new Map<string,DeliveryRequest>()
  private table: {put(key:string,value:unknown):unknown|Promise<unknown>} | undefined
  private queue:Promise<unknown>=Promise.resolve()
  private ready:Promise<void>=Promise.resolve()
  attach(domain:StorageDomain) {this.ready=this.load(domain);return this.ready}
  private async load(domain:StorageDomain) {
    const schema={parse:(v:unknown)=>v,safeParse:(v:unknown)=>({success:true,data:v})}
    const access=await domain.open({name:"previsit_report_files_v1",version:1,tables:{files:{valueSchema:schema}}})
    const table=access.table("files")
    for(const [key,value] of table.entries()) {
      const v=value as StoredFile & DeliveryRequest
      if(v?.id!==key) continue
      if(typeof v.base64==="string" && typeof v.sourceHash==="string") this.files.set(key,v)
      else if(v.status==="awaiting-configuration") this.deliveries.set(key,v)
    }
    this.table=table
    for(const [key,value] of [...this.files,...this.deliveries]) await table.put(key,value)
  }
  list(taskId:string) { return {files:[...this.files.values()].filter(f=>f.taskId===taskId).map(({base64:_b,...metadata})=>metadata),deliveries:[...this.deliveries.values()].filter(d=>d.taskId===taskId)} }
  get(id:string,taskId:string) {const f=this.files.get(id); if(!f || f.taskId!==taskId) throw new Error("文件不存在或不属于该任务"); if(hash(Buffer.from(f.base64,"base64"))!==f.sha256) throw new Error("文件校验失败，禁止下载或交付"); return f}
  export(task:PrevisitTaskRecord,format:"pdf"|"docx"):Promise<ReportFile> {
    const operation=this.queue.then(async()=>{
      await this.ready
      if(!["completed","partial"].includes(task.state)||!task.reportMarkdown) throw new Error("只能导出已保存报告")
      const sourceHash=hash(task.reportMarkdown)
      const id=`RF-${hash(`${task.id}:${sourceHash}:${format}:text-v1`).slice(0,32)}`
      let stored=this.files.get(id)
      if(!stored) {
        const bytes=await renderReportFile(task,format)
        if(bytes.length>20_000_000) throw new Error("导出文件超过20MB")
        const name=(task.entity?.fullName??task.query).replace(/[\\/:*?"<>|\x00-\x1f]/g,"_").slice(0,100)
        stored={id,taskId:task.id,version:task.reportVersion??1,format,fileName:`访前尽调报告_${name}_V${task.reportVersion??1}_${task.id}.${format}`,mediaType:mime[format],sourceHash,sha256:hash(bytes),size:bytes.length,createdAt:new Date().toISOString(),base64:bytes.toString("base64")}
        await this.table?.put(id,stored); this.files.set(id,stored)
      }
      const {base64:_b,...metadata}=stored; return metadata
    })
    this.queue=operation.catch(()=>{}); return operation
  }
  async requestDelivery(taskId:string,fileId:string,destination:string) {
    await this.ready
    this.get(fileId,taskId)
    const url=new URL(destination)
    if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash) throw new Error("请提供无凭据、无查询参数的 HTTPS 目标；不要填写令牌")
    const id=`DR-${hash(`${fileId}:${url.href}`).slice(0,32)}`
    const prior=this.deliveries.get(id); if(prior) return prior
    const request:DeliveryRequest={id,fileId,taskId,destination:url.href,requestedAt:new Date().toISOString(),status:"awaiting-configuration"}
    await this.table?.put(id,request); this.deliveries.set(id,request); return request
  }
}
