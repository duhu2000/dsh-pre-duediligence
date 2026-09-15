import type { HostedTask } from "./hosted-task-sync.js";
import { type CardInsights } from "./stage-insights.js";
export declare function RiskSummary({ task, insights, running }: {
    task: HostedTask | null;
    insights: CardInsights;
    running: boolean;
}): JSX.Element;
