// Read-only capability probe for the specifically audited local DSH artifact.
// This executes its extracted syncTools function with synthetic dependencies;
// it is not a running DSH browser/profile acceptance test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const root = '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/';
const packageFile = `${root}dsh-mcp-client/package.json`;
const file = `${root}dsh-mcp-client/lib/index.js`;
const source = readFileSync(file, 'utf8');
const version = JSON.parse(readFileSync(packageFile, 'utf8')).version;
test('installed DSH 0.1.2-rc.1 bridge drops UI discovery metadata and registers app-only tools as ordinary tools', async () => {
  assert.equal(version, '0.1.2-rc.1', 'Re-audit the changed installed version before using this probe');
  const start = source.indexOf('async function syncTools(');
  const end = source.indexOf('/** Keep a supported advertised schema;', start);
  assert.ok(start >= 0 && end > start, 'Pinned installed function boundaries must be present');
  const invocations = [], registered = [];
  const tools = [
    { name: 'previsit_report_open', description: 'synthetic', inputSchema: { type: 'object' }, _meta: { ui: { resourceUri: 'ui://previsit/report-v1.html', visibility: ['model', 'app'] } } },
    { name: 'previsit_evidence_get', description: 'synthetic', inputSchema: { type: 'object' }, _meta: { ui: { resourceUri: 'ui://previsit/report-v1.html', visibility: ['app'] } } },
  ];
  const sandbox = {
    Map,
    listToolsUncached: async () => ({ tools }),
    publicToolName: (server, name) => `mcp__${server}__${name}`,
    supportedOutputSchema: value => value,
    createDefinition: (...args) => { invocations.push(args); return { name: args[2] }; },
  };
  const run = vm.runInNewContext(`${source.slice(start, end)}; syncTools`, sandbox);
  const ctx = { tools: { register: d => { registered.push(d.name); return () => {}; } }, logger: { error: message => { throw new Error(message); } } };
  await run({}, ctx, { serverName: 'f24-probe', toolCallTimeoutMs: 1000, registrationFailure: 'throw' }, new Map());
  assert.equal(registered.length, 2);
  assert.ok(registered.includes('mcp__f24-probe__previsit_evidence_get'));
  assert.ok(invocations.every(args => !JSON.stringify(args.slice(2)).includes('resourceUri')));
  console.log(JSON.stringify({ installedVersion: version, artifact: file, sha256: createHash('sha256').update(source).digest('hex'), uiMetadataForwarded: false, appOnlyToolRegisteredAsOrdinaryTool: true, probe: 'extracted native syncTools with synthetic MCP listing; no running DSH profile' }));
});
test('installed renderer has keyed toolview but no openma takeover slot', () => {
  const slots = readFileSync(`${root}dsh-client-ui-tool/lib/types/client/contract/slots.d.ts`, 'utf8');
  assert.ok(slots.includes("'tool.call.toolview'"));
  assert.ok(!slots.includes("'tool.call.takeover'"));
  const rpc = readFileSync(`${root}dsh-client-connection/lib/types/rpc.d.ts`, 'utf8');
  assert.ok(rpc.includes('handle(channel: string, handler: ConnectionRpcHandler)'));
  assert.ok(!rpc.includes("authority:"));
});
