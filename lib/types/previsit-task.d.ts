import { type CardSnapshot } from "./report-export.js";
import { type ToolOutcome } from "./tool-outcome.js";
export type TaskDepth = "fast" | "standard" | "deep";
export type TaskDimension = {
    dimension: string;
    label: string;
    toolName?: string;
    outcome: ToolOutcome;
    reason?: string;
    order: number;
};
export type TaskEntity = {
    fullName: string;
    creditCode: string;
};
export type TaskStage = "planning" | "anchoring" | "collecting" | "reported";
export type PlanCandidate = {
    name: string;
    source: string | undefined;
};
export type PrevisitPlan = {
    id: string;
    candidates: PlanCandidate[];
    note: string | undefined;
    createdAt: string | undefined;
    /** previsit_plan 结果所在节点下标。 */
    index: number;
    /** 本计划下已建立的任务（按发起顺序）。 */
    taskIds: string[];
};
export type PrevisitTask = {
    id: string;
    planId: string | undefined;
    query: string;
    depth: TaskDepth | undefined;
    limit: number;
    used: number;
    role: string | undefined;
    scene: string | undefined;
    focus: string[];
    output: string | undefined;
    sections: string[];
    startedAt: string | undefined;
    entity: TaskEntity | undefined;
    candidateCount: number | undefined;
    /** 发起本任务的那条用户消息（previsit_begin 之前最近的一条）。 */
    prompt: string;
    /** previsit_begin 结果所在节点下标；任务的事件从这里开始。 */
    startIndex: number;
    /** 下一任务开始的节点下标（不含）；当前任务为 undefined。 */
    endIndex: number | undefined;
    dimensions: TaskDimension[];
    report: string | null;
    stage: TaskStage;
};
export declare const DIMENSION_LABELS: Record<string, string>;
export declare const DEPTH_LABELS: Record<TaskDepth, string>;
export declare const REPORT_SECTIONS: readonly ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"];
export declare const RISK_DIMENSIONS: Set<string>;
/** 把会话快照投影成计划列表（按登记顺序）。 */
export declare function derivePlans(snapshot: CardSnapshot): PrevisitPlan[];
/** 把会话快照投影成任务列表（按发起顺序）。最后一个是当前任务。 */
export declare function deriveTasks(snapshot: CardSnapshot): PrevisitTask[];
/** 任务的对外名称：已确认主体用全称，否则用检索词。 */
export declare function taskTitle(task: PrevisitTask): string;
/** 最近一次结果为准的维度视图（重试后只显示最后一次）。 */
export declare function latestDimensions(task: PrevisitTask): TaskDimension[];
export type PlanSelection = {
    candidates: string[];
    depth: TaskDepth;
    focus: string[];
    output: string;
    sections: string[];
    role?: string;
    scene?: string;
};
/** 工作台计划卡确认后发给智能体的结构化消息；Skill 按同一格式解析。 */
export declare function planConfirmationMessage(plan: PrevisitPlan, selection: PlanSelection): string;
