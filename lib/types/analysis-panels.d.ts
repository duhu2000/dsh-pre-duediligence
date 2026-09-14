import type { HostedTask } from "./hosted-task-sync.js";
import type { Hypothesis } from "./stage-insights.js";
export declare const verificationDimension: (dimension: string) => boolean;
export declare function CollectionCards({ task, verification }: {
    task: HostedTask | null;
    verification?: boolean;
}): JSX.Element;
export declare function AnalysisPanel({ task, kind, legacy }: {
    task: HostedTask | null;
    kind: "verification" | "hypothesis";
    legacy?: Hypothesis[];
}): JSX.Element;
