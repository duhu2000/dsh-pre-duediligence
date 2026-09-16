import React, { useEffect, useRef, useState } from 'react';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
const CHANNEL = '/f24-mcp-app';
const PUBLIC_TOOL = 'f24_previsit_report_open';
const ALLOWED = ['previsit_evidence_get', 'previsit_artifacts_list'];
export const inject = ['connection', 'slots'];
async function rpc(connection, endpoint, payload, signal) {
  const response = await connection.rpc.call(CHANNEL, endpoint, payload, signal);
  if (!response.ok) throw new Error(response.error.message);
  return response.value;
}
function Report({ connection, sessionId, callId, block }) {
  const meta = block?.meta?.f24App;
  const [opened, setOpened] = useState(true);
  const [error, setError] = useState('');
  const container = useRef(null);
  useEffect(() => {
    if (!opened || !meta) return;
    if (meta.sessionId !== sessionId || meta.callId !== callId) { setError('报告与当前会话不匹配'); return; }
    const controller = new AbortController();
    const binding = { viewId: meta.viewId, sessionId, callId };
    let bridge, frame;
    setError('');
    const report = meta.result.structuredContent;
    (async () => {
      const { html } = await rpc(connection, 'resource', binding, controller.signal);
      if (controller.signal.aborted) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const csp = doc.createElement('meta');
      csp.httpEquiv = 'Content-Security-Policy';
      csp.content = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
      doc.head.prepend(csp);
      frame = document.createElement('iframe');
      frame.title = report.sourceKind === 'saved-task' ? '访前报告与证据（已保存）' : '访前报告与证据（合成）';
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.style.cssText = 'width:100%;height:650px;border:0;display:block;background:white';
      container.current.append(frame);
      bridge = new AppBridge(null, { name: 'DSH F24 report host', version: '0.0.0' }, { serverTools: {} });
      bridge.oncalltool = async (params) => {
        if (!ALLOWED.includes(params.name)) throw new Error('TOOL_NOT_APP_VISIBLE');
        return rpc(connection, 'call', { ...binding, name: params.name, arguments: params.arguments }, controller.signal);
      };
      bridge.oninitialized = () => {
        console.info('F24 DSH initialized');
        void bridge.sendToolInput({ arguments: { reportId: report.reportId, reportVersion: report.reportVersion } })
          .then(() => bridge.sendToolResult(meta.result)).catch(e => { if (!controller.signal.aborted) setError(e.message); });
      };
      bridge.onsizechange = ({ height }) => { if (frame && Number.isFinite(height)) frame.style.height = `${Math.min(900, Math.max(200, height))}px`; };
      await bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow));
      if (controller.signal.aborted) { await bridge.close(); frame.remove(); return; }
      frame.srcdoc = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    })().catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => {
      controller.abort();
      void (async () => {
        if (bridge) {
          await Promise.race([bridge.teardownResource({}).catch(() => {}), new Promise(r => setTimeout(r, 500))]);
          await bridge.close();
        }
        frame?.remove();
        console.info('F24 DSH disposed');
      })();
    };
  }, [opened, meta?.viewId, sessionId, callId, connection]);
  return <section data-f24-report style={{width:'100%',minWidth:0,border:'1px solid #9ca3af',borderRadius:8,overflow:'hidden'}}>
    <div style={{padding:8,display:'flex',justifyContent:'space-between',gap:8}}><strong>访前报告与证据 · {!meta ? '报告读取' : meta.result?.structuredContent?.sourceKind === 'saved-task' ? '已保存报告' : '合成数据实验'}</strong><button onClick={() => setOpened(v => !v)}>{opened ? '关闭报告' : '重新打开报告'}</button></div>
    {!meta && (block?.kind === 'tool-result' ? <p role="alert">{block.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '未获得可展示的报告，请检查访问范围和报告版本。'}</p> : <p>等待工具返回已保存报告…</p>)}
    {error && <p role="alert">{error}。若宿主已重启或授权已过期，请重新调用打开报告工具。</p>}
    <div ref={container} />
  </section>;
}
export function apply(ctx) {
  ctx.effect(() => ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({ name: 'tool.call.toolview', key: PUBLIC_TOOL }, props => <Report {...props} connection={ctx.connection} />)), 'F24 report view');
}
