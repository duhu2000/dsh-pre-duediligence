import { PrevisitWorkflowStore } from "./previsit-workflow.js";
export declare const QUERY_ROUTES: {
    readonly entity_search: readonly ["company", "get_company_by_query"];
    readonly registration: readonly ["company", "get_company_registration_info"];
    readonly profile: readonly ["company", "get_company_profile"];
    readonly annual_reports: readonly ["company", "get_annual_reports"];
    readonly changes: readonly ["company", "get_change_records"];
    readonly shareholders: readonly ["company", "get_shareholder_info"];
    readonly beneficiaries: readonly ["company", "get_beneficial_owners"];
    readonly personnel: readonly ["company", "get_key_personnel"];
    readonly contacts: readonly ["company", "get_contact_info"];
    readonly investments: readonly ["company", "get_external_investments"];
    readonly branches: readonly ["company", "get_branches"];
    readonly risk_scan: readonly ["risk", "get_company_risk_scan"];
    readonly dishonest: readonly ["risk", "get_dishonest_info"];
    readonly enforcement: readonly ["risk", "get_judgment_debtor_info"];
    readonly terminated_cases: readonly ["risk", "get_terminated_cases"];
    readonly equity_freeze: readonly ["risk", "get_equity_freeze"];
    readonly business_exception: readonly ["risk", "get_business_exception"];
    readonly administrative_penalty: readonly ["risk", "get_administrative_penalty"];
    readonly tax_abnormal: readonly ["risk", "get_tax_abnormal"];
    readonly judicial_documents: readonly ["risk", "get_judicial_documents"];
    readonly patents: readonly ["ipr", "get_patent_info"];
    readonly software_copyright: readonly ["ipr", "get_software_copyright_info"];
    readonly financing: readonly ["operation", "get_financing_records"];
    readonly bidding: readonly ["operation", "get_bidding_info"];
    readonly recruitment: readonly ["operation", "get_recruitment_info"];
    readonly qualifications: readonly ["operation", "get_qualifications"];
    readonly licenses: readonly ["operation", "get_administrative_license"];
    readonly land: readonly ["operation", "get_land_grant_info"];
    readonly executive_risk: readonly ["executive", "get_executive_risk_scan"];
};
/** Common model-facing aliases are normalized before the fixed route guard. */
export declare const QUERY_ROUTE_ALIASES: {
    readonly key_personnel: "personnel";
};
type Agent = {
    id: string;
    session: {
        id: string;
        header?: {
            cwd?: string;
        };
    };
};
type Execution = {
    agent?: Agent;
    callId: string;
    rootCallId: string;
    name: string;
    arguments: unknown;
    signal: AbortSignal;
    token: unknown;
    parent?: unknown;
    deferContext?(context: unknown): void;
    concludeTurn?(): void;
};
type Result = {
    isError: boolean;
    value?: unknown;
    content: unknown[];
    error?: {
        message?: string;
        info?: {
            code?: string;
        };
    };
    additionalContexts?: unknown[];
    concludesTurn?: boolean;
};
type Definition = {
    name: string;
    description: string;
    parameters: object;
    output: {
        schema: object;
        render(args: unknown, value: unknown): Array<{
            type: "text";
            text: string;
        }>;
    };
    execute(args: unknown, exec: Execution): Promise<unknown>;
};
export type ToolHost = {
    tools: {
        register(definition: Definition): () => void;
        guard(check: (exec: Execution) => string | undefined): () => void;
        schemas(agent: Agent): Array<{
            name: string;
            parameters?: {
                properties?: Record<string, unknown>;
                required?: string[];
            };
        }>;
        execute(input: Omit<Execution, "token" | "deferContext" | "concludeTurn">): Promise<Result>;
    };
    get?(name: string): unknown;
};
/** Host-owned admission, entity binding, progress and bounded ToolRuntime dispatch. */
export declare function registerPrevisitTools(ctx: ToolHost, workflow?: PrevisitWorkflowStore): () => void;
export {};
