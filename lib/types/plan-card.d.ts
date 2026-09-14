import { type PrevisitPlan } from "./previsit-task.js";
export declare function PlanCard(props: {
    plan: PrevisitPlan;
    onConfirm: (message: string) => Promise<void>;
    onDismiss?: () => void;
}): JSX.Element;
