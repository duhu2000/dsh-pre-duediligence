import { randomUUID } from 'node:crypto';
export const REPORT_TOOL = 'previsit_report_open';
export const PUBLIC_TOOL = 'f24_previsit_report_open';
export const RESOURCE = 'ui://previsit/report-v1.html';
export const MIME = 'text/html;profile=mcp-app';
export const CHANNEL = '/f24-mcp-app';
export const APP_TOOLS = ['previsit_evidence_get', 'previsit_artifacts_list'];
const check = (ok, message) => { if (!ok) throw new Error(message); };

// Synthetic demonstration grants; not a mapping to real DSH Profile history.
export function createBindings({ ttlMs = 900000, maxViews = 100, now = Date.now } = {}) {
  const views = new Map();
  const sweep = () => { for (const [id, view] of views) if (now() >= view.expiresAt) views.delete(id); };
  return {
    mint({ sessionId, callId, args, result }) {
      sweep();
      check(sessionId && callId, 'MISSING_EXECUTION_IDENTITY');
      check(views.size < maxViews, 'VIEW_LIMIT_REACHED');
      const r = result.structuredContent;
      check(!result.isError && r?.synthetic === true && r.schemaVersion === '1.0' && r.reportId === args.reportId && r.reportVersion === args.reportVersion && r.entity?.id === 'synthetic-company-a', 'INVALID_SYNTHETIC_REPORT');
      const viewId = randomUUID();
      const view = structuredClone({ viewId, sessionId, callId, args, result, resourceUri: RESOURCE, expiresAt: now() + ttlMs });
      views.set(viewId, view);
      return { viewId, sessionId, callId, result: structuredClone(result) };
    },
    get({ viewId, sessionId, callId }) {
      sweep();
      const view = views.get(viewId);
      check(view && view.sessionId === sessionId && view.callId === callId, 'VIEW_NOT_ACCESSIBLE');
      return structuredClone(view);
    },
    allowCall(binding, name, args) {
      const view = this.get(binding);
      check(APP_TOOLS.includes(name), 'TOOL_NOT_APP_VISIBLE');
      check(args?.reportId === view.args.reportId && args?.reportVersion === view.args.reportVersion, 'REPORT_SCOPE_MISMATCH');
      if (name === 'previsit_evidence_get') check(view.result.structuredContent.findings.some(f => f.evidenceIds.includes(args.evidenceId)), 'EVIDENCE_NOT_IN_REPORT');
      return view;
    },
    clear() { views.clear(); },
  };
}
