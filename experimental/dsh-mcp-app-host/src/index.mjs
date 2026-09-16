import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { z } from 'zod';
import { createBindings, REPORT_TOOL, PUBLIC_TOOL, RESOURCE, MIME, CHANNEL, APP_TOOLS } from './bindings.mjs';
export const name = 'f24-mcp-app-host';
export const inject = ['tools', 'connection'];
const configSchema = z.object({ syntheticOnly: z.literal(true), url: z.enum(['http://127.0.0.1:3001/mcp', 'http://localhost:3001/mcp']), ttlMs: z.number().int().positive().default(900000) }).strict();
const bindingSchema = z.object({ viewId: z.string().uuid(), sessionId: z.string().min(1), callId: z.string().min(1) });
const callSchema = bindingSchema.extend({ name: z.enum(APP_TOOLS), arguments: z.record(z.string(), z.unknown()) }).strict();
export async function apply(ctx, input) {
  const config = configSchema.parse(input);
  const client = new Client({ name: 'DSH F24 synthetic host', version: '0.0.0' }, { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: [MIME] } } } });
  const bindings = createBindings({ ttlMs: config.ttlMs });
  let disposed = false;
  const pending = new Set();
  ctx.effect(() => async () => { disposed = true; for (const c of pending) c.abort(); bindings.clear(); await client.close(); }, 'F24 connection lifecycle');
  await client.connect(new StreamableHTTPClientTransport(new URL(config.url)));
  const tools = (await client.listTools()).tools;
  const reportTool = tools.find(t => t.name === REPORT_TOOL);
  if (reportTool?._meta?.ui?.resourceUri !== RESOURCE) throw new Error('F24 report UI metadata missing');
  for (const name of APP_TOOLS) if (!tools.find(t => t.name === name)?._meta?.ui?.visibility?.includes('app')) throw new Error(`F24 app tool missing: ${name}`);
  ctx.effect(() => ctx.tools.register({
    name: PUBLIC_TOOL, description: '打开已经保存的合成访前报告，demo-report 版本 1。只读，不查询企业数据。',
    parameters: reportTool.inputSchema,
    output: {
      schema: { type: 'object', properties: { viewId: { type: 'string' }, sessionId: { type: 'string' }, callId: { type: 'string' }, result: { type: 'object', additionalProperties: true } }, required: ['viewId', 'sessionId', 'callId', 'result'], additionalProperties: false },
      render: (_args, value) => value.result.content,
      presentationMeta: (_args, value) => ({ f24App: { ...value, resourceUri: RESOURCE } }),
    },
    async execute(args, exec) {
      if (disposed || !exec.agent?.session?.id) throw new Error('F24 requires an active DSH session');
      const result = await client.callTool({ name: REPORT_TOOL, arguments: args }, { signal: exec.signal, timeout: 15000 });
      return bindings.mint({ sessionId: exec.agent.session.id, callId: exec.callId, args, result });
    },
  }), 'F24 report tool only');
  ctx.effect(() => ctx.connection.rpc.handle(CHANNEL, async (endpoint, payload, signal) => {
    const controller = new AbortController(); pending.add(controller);
    const requestSignal = AbortSignal.any([signal, controller.signal]);
    try {
      if (disposed) throw new Error('HOST_DISPOSED');
      requestSignal.throwIfAborted();
      if (endpoint === 'resource') {
        const binding = bindingSchema.strict().parse(payload); bindings.get(binding);
        const response = await client.readResource({ uri: RESOURCE }, { signal: requestSignal, timeout: 15000 });
        if (response.contents.length !== 1 || response.contents[0].mimeType !== MIME || typeof response.contents[0].text !== 'string') throw new Error('INVALID_UI_RESOURCE');
        return { ok: true, value: { html: response.contents[0].text } };
      }
      if (endpoint === 'call') {
        const { name, arguments: args, ...binding } = callSchema.parse(payload);
        bindings.allowCall(binding, name, args);
        const value = await client.callTool({ name, arguments: args }, { signal: requestSignal, timeout: 15000 });
        ctx.logger.info(`F24 app call ${name} ${value.isError ? 'error' : 'ok'}`);
        return { ok: true, value };
      }
      throw new Error('UNKNOWN_ENDPOINT');
    } catch (e) { return { ok: false, error: { code: 'bad-request', message: e.message, details: { issues: [] } } }; }
    finally { pending.delete(controller); }
  }), 'F24 scoped RPC');
  ctx.logger.info('F24 synthetic MCP Apps Host ready; one model tool, two app-only tools');
}
