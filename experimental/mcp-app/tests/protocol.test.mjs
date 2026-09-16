import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
test('real HTTP discovery, resource, result, text fallback, errors and parameter boundaries', async () => {
  const client = new Client({ name: 'F24 protocol verification', version: '0.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost:3001/mcp')));
    const tools = (await client.listTools()).tools;
    assert.equal(tools.length, 3);
    assert.ok(tools.every(t => t.annotations.readOnlyHint));
    const tool = tools.find(t => t.name === 'previsit_report_open');
    const resource = await client.readResource({ uri: tool._meta.ui.resourceUri });
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
    assert.ok(resource.contents[0].text.includes('访前尽调'));
    const args = { reportId: 'demo-report', reportVersion: 1 };
    const report = await client.callTool({ name: tool.name, arguments: args });
    assert.equal(report.structuredContent.reportVersion, 1);
    assert.ok(report.content[0].text.includes('现场必问'));
    for (const [arguments_, expected] of [[{ ...args, reportId: 'other' }, 'NOT_ACCESSIBLE'], [{ ...args, reportVersion: 99 }, 'VERSION_NOT_FOUND']]) {
      const result = await client.callTool({ name: tool.name, arguments: arguments_ });
      assert.equal(result.isError, true); assert.equal(result.structuredContent.error.code, expected);
    }
    const forged = await client.callTool({ name: tool.name, arguments: { ...args, principal: 'admin', entityId: 'other' } });
    assert.equal(forged.isError, true);
    const missing = await client.callTool({ name: 'previsit_evidence_get', arguments: { ...args, evidenceId: 'other' } });
    assert.equal(missing.structuredContent.error.code, 'EVIDENCE_NOT_FOUND');
    assert.deepEqual((await client.callTool({ name: 'previsit_artifacts_list', arguments: args })).structuredContent.artifacts, []);
  } finally { await client.close(); }
});
