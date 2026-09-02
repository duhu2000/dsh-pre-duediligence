export declare const PREVISIT_PHASES: readonly ["prepare", "opportunity", "risk", "delivery"];
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
};
export type PhaseState = {
    id: PrevisitPhase;
    progress: PhaseProgress;
};
export declare function isOpportunityTool(name: string): boolean;
export declare function isRiskTool(name: string): boolean;
export declare function deriveWorkbenchStatus(input: SessionProgressInput): WorkbenchStatus;
export declare function derivePhaseStates(input: SessionProgressInput): PhaseState[];
