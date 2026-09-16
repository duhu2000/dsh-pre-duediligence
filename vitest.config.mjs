import { defineConfig } from 'vitest/config';
// Experimental MCP suites use node:test; downloaded reference repositories are
// not part of the business plugin's regression suite.
export default defineConfig({ test: { include: ['src/**/*.test.{ts,tsx}'] } });
