import { createServer as createHttpServer } from 'node:http';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { createServer } from './app-server.mjs';
// Local synthetic demonstration only; this is not remote-user authentication.
const port = 3001;
const http = createHttpServer(async (req, res) => {
  if (!['localhost:3001', '127.0.0.1:3001'].includes(req.headers.host) || (req.headers.origin && req.headers.origin !== 'http://localhost:8080')) { res.writeHead(403).end(); return; }
  if (req.url !== '/mcp') { res.writeHead(404).end(); return; }
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Protocol-Version, MCP-Session-Id, MCP-Client-Capabilities, MCP-Client-Info');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id, MCP-Protocol-Version');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const server = createServer({ audit: entry => console.info(JSON.stringify(entry)) });
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { void transport.close(); void server.close(); });
  try { await server.connect(transport); await transport.handleRequest(req, res); }
  catch { if (!res.headersSent) res.writeHead(500).end('Internal error'); }
});
http.listen(port, '127.0.0.1', () => console.info('Synthetic MCP http://localhost:3001/mcp'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => http.close());
