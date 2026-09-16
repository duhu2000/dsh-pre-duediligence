import { McpServer } from '@modelcontextprotocol/server';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { createReader, ReadError, textReport } from './service.mjs';
import { snapshot, grant } from './snapshot.mjs';
export const resourceUri = 'ui://previsit/report-v1.html';
const scope = { reportId: z.string().min(1).max(80), reportVersion: z.number().int().positive() };
export function createServer({ reader = createReader(snapshot, grant), audit = () => {}, mode = 'synthetic', resourcePath = new URL('../dist/report.html', import.meta.url) } = {}) {
  const server = new McpServer({ name: mode === 'saved' ? 'Previsit saved report reader' : 'Previsit synthetic P1', version: '0.0.0' });
  const tools = [
    ['previsit_report_open', z.object(scope).strict(), a => reader.getReport(a), textReport, ['model', 'app']],
    ['previsit_evidence_get', z.object({ ...scope, evidenceId: z.string().min(1).max(80) }).strict(), a => reader.getEvidence(a), d => `${d.evidence.quote}\n来源：${d.evidence.source} · ${d.evidence.sourceDate ?? '日期未记录'}\n${d.evidence.limitation}`, ['app']],
    ['previsit_artifacts_list', z.object(scope).strict(), a => reader.listArtifacts(a), d => d.artifacts.length ? `已有 ${d.artifacts.length} 个文件登记；只读元数据，未生成或下载。` : '没有已登记文件；未发起生成或下载。', ['app']]
  ];
  for (const [name, inputSchema, read, text, visibility] of tools) {
    registerAppTool(server, name, {
      description: mode === 'saved' ? '只读本会话已保存报告；不查询企业数据。' : '只读合成报告快照；不查询企业数据。报告示例 demo-report，版本 1。', inputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri, visibility } }
    }, async args => {
      try {
        const data = await read(args); audit({ method: name, outcome: 'ok' });
        return { content: [{ type: 'text', text: text(data) }], structuredContent: data };
      } catch (e) {
        const internal = e instanceof ReadError ? e.code : 'INTERNAL_ERROR';
        audit({ method: name, outcome: internal });
        const code = ['ACCESS_DENIED', 'REPORT_NOT_FOUND'].includes(internal) ? 'NOT_ACCESSIBLE' : internal;
        return { isError: true, content: [{ type: 'text', text: `读取未完成：${code}。请核对报告版本与访问范围。` }], structuredContent: { schemaVersion: '1.0', error: { code } } };
      }
    });
  }
  const meta = { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] }, prefersBorder: true } };
  registerAppResource(server, '合成访前报告', resourceUri, { mimeType: RESOURCE_MIME_TYPE, _meta: meta }, async () => {
    audit({ method: 'resources/read', outcome: 'ok' });
    return { contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, _meta: meta, text: await readFile(resourcePath, 'utf8') }] };
  });
  return server;
}
