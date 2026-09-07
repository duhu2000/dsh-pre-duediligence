import type { ToolOutcome } from "./tool-outcome.js";
export type ToolEvent = {
    name: string;
    status: ToolOutcome;
};
export type StepState = "done" | "active" | "idle";
export type Step = {
    label: string;
    state: StepState;
    note?: string | undefined;
};
export type Dimension = {
    label: string;
    status: ToolOutcome;
};
export declare function opportunityDimensions(events: ToolEvent[]): Dimension[];
export declare function riskDimensions(events: ToolEvent[]): Dimension[];
export declare const BUSINESS_STATES: readonly ["产能建设期", "客户导入期", "产能爬坡期", "订单增长期", "稳定经营期", "收缩承压期", "资本运作期", "风险暴露期"];
export type Hypothesis = {
    id: string;
    priority: string;
    text: string;
};
export type RiskItem = {
    level: "红线" | "关注" | "信息";
    text: string;
};
export type CardInsights = {
    found: boolean;
    state: string | null;
    stateUndetermined: boolean;
    confidence: string | null;
    industryLink: string | null;
    hypotheses: Hypothesis[];
    risks: RiskItem[];
    riskNoRecord: boolean;
    sections: string[];
};
export declare function parseCardInsights(md: string | null): CardInsights;
export declare function opportunitySteps(events: ToolEvent[], insights: CardInsights, finished: boolean): Step[];
export declare function riskSteps(events: ToolEvent[], insights: CardInsights, finished: boolean): Step[];
