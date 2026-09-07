import type { ToolEvent } from "./stage-insights.js";
export declare const PREVISIT_PHASES: readonly ["target", "scope", "collect", "verify", "output"];
export type PrevisitPhase = (typeof PREVISIT_PHASES)[number];
export type PhaseProgress = "idle" | "active" | "done" | "failed";
export type WorkbenchStatus = "empty" | "waiting-agent" | "running" | "ready" | "failed";
export type SessionProgressInput = {
    hasTask: boolean;
    running: boolean;
    seenRunning: boolean;
    lastAgentError: string | null;
    partial: boolean;
    toolNames: string[];
    /** 只在捕获到符合报告结构的真实输出后为 true。 */
    reportReady: boolean;
    toolEvents?: ToolEvent[];
};
export type PhaseState = {
    id: PrevisitPhase;
    progress: PhaseProgress;
};
export declare function isOpportunityTool(name: string): boolean;
export declare function isRiskTool(name: string): boolean;
export declare function deriveWorkbenchStatus(input: SessionProgressInput): WorkbenchStatus;
export declare function derivePhaseStates(input: SessionProgressInput): PhaseState[];
