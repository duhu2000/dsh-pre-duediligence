import { useEffect, useState } from "react"
import type { ReportFile, DeliveryRequest } from "./report-files.js"
export function ReportFilesPanel({taskId,sessionId}:{taskId:string;sessionId:string}) {
  const [files,setFiles]=useState<ReportFile[]>([]),[deliveries,setDeliveries]=useState<DeliveryRequest[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState("")
  const url=`/previsit/api/tasks/${encodeURIComponent(taskId)}/files?sessionId=${encodeURIComponent(sessionId)}`
  useEffect(()=>{let active=true;setFiles([]);setDeliveries([]);setError(""); void fetch(url).then(async res=>{const body=await res.json();if(!res.ok||!body.ok||!Array.isArray(body.files)||!Array.isArray(body.deliveries))throw new Error(body.message??"文件读取失败：返回结构不完整");if(active){setFiles(body.files);setDeliveries(body.deliveries)}}).catch(e=>{if(active)setError(String(e))});return()=>{active=false}},[url])
  const generate=async(format:"pdf"|"docx")=>{
    setBusy(true);setError("")
    try {const res=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({format})});const body=await res.json();if(!res.ok||!body.ok)throw new Error(body.message??"导出失败");setFiles(previous=>[...previous.filter(f=>f.id!==body.file.id),body.file])}
    catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  }
  return <section className="qccPwCard" aria-label="报告衍生文件"><h3>报告衍生文件</h3>
    <p>转换格式不改变报告版本。正文及 Markdown 标记保留，排版不等同于 HTML；PDF 需要管理员配置中文字体。</p>
    <button type="button" className="qccPwSecondary" disabled={busy} onClick={()=>void generate("docx")}>生成 Word</button>
    <button type="button" className="qccPwSecondary" disabled={busy} onClick={()=>void generate("pdf")}>生成 PDF</button>
    {busy?<p role="status">正在转换，原报告保持不变…</p>:null}
    {error?<p role="alert">{error}</p>:null}
    {files.map(file=><p key={file.id}><a href={`/previsit/api/tasks/${encodeURIComponent(taskId)}/files/${file.id}?sessionId=${encodeURIComponent(sessionId)}`} download={file.fileName}>{file.fileName}</a> · {file.size} 字节</p>)}
    {deliveries.map(d=><p key={d.id}>交付申请：{d.destination} · 待配置，尚未上传</p>)}
  </section>
}
