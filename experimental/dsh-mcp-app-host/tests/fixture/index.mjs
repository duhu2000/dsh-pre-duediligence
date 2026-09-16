// Test-only local deterministic adapter. Never reads credentials or calls a model.
import { LlmAdapter } from '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js';
import { randomUUID } from 'node:crypto';
export const inject = ['llm', 'workspaceRegistry'];
export const name = 'f24-fixture-provider';
class Fixture extends LlmAdapter {
  async listModels(provider) { return [{provider,id:'synthetic',name:'F24 合成验收（无模型网络）',inputModalities:['text']}]; }
  async resolveModel(provider, model) { return {...(await this.listModels(provider))[0], id:model, context:{contextWindow:128000},defaultMaxTokens:2048}; }
  async *stream(options) {
    const last = options.messages.at(-1);
    const hasTool = options.tools?.some(t => t.name === 'f24_previsit_report_open');
    const toolDone = last?.source?.kind === 'tool' || last?.role === 'tool' || last?.content?.some?.(b => b.type === 'tool-result');
    const call = hasTool && !toolDone;
    const block = call ? {type:'tool-call',id:randomUUID(),name:'f24_previsit_report_open',arguments:JSON.stringify({reportId:'demo-report',reportVersion:1})} : {type:'text',text:'F24 合成报告验收完成。未调用外部模型或真实企业数据。'};
    yield {type:'block-start',index:0,blockType:block.type};
    yield {type:'block-end',index:0,block};
    yield {type:'finish',reason:{kind:call?'tool-calls':'stop'}};
  }
}
export async function apply(ctx) { await ctx.workspaceRegistry.create('/Users/qcc/Documents/Codex/f24-previsit-mcp-app/_scratch/f24-empty-workspace', 'F24 合成验收'); ctx.effect(() => ctx.llm.registerAdapter(['f24-fixture'], new Fixture())); }
