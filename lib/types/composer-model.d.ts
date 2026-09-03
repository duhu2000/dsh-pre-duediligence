export declare const COMPANY_PLACEHOLDER = "\uFF08\u8FD9\u91CC\u8F93\u5165\u4F01\u4E1A\u540D\uFF09";
export type ComposerOption = {
    id: string;
    label: string;
    phrase: string;
    extraClause?: string;
};
export declare const ROLE_OPTIONS: readonly [{
    readonly id: "bank_rm";
    readonly label: "银行/信贷客户经理";
    readonly phrase: "银行对公客户经理";
}, {
    readonly id: "sales";
    readonly label: "销售/BD";
    readonly phrase: "销售";
}, {
    readonly id: "procure";
    readonly label: "采购/供应链";
    readonly phrase: "采购负责人";
}, {
    readonly id: "invest";
    readonly label: "投资机构";
    readonly phrase: "投资机构人员";
}, {
    readonly id: "gov";
    readonly label: "政府/园区招商";
    readonly phrase: "园区招商人员";
}, {
    readonly id: "other";
    readonly label: "其他";
    readonly phrase: "准备拜访企业的商务人员";
}];
export declare const PURPOSE_OPTIONS: readonly [{
    readonly id: "first";
    readonly label: "首次拜访";
    readonly phrase: "首次";
}, {
    readonly id: "nego";
    readonly label: "谈判前拜访";
    readonly phrase: "在商务谈判前";
}, {
    readonly id: "revisit";
    readonly label: "复访";
    readonly phrase: "复访前更新式地";
    readonly extraClause: "如有此前对该企业的尽调记录，请对比说明变化；若无记录，请照常全量尽调并注明是首次。";
}];
export declare const FOCUS_OPTIONS: readonly [{
    readonly id: "risk";
    readonly label: "风险与涉诉";
    readonly phrase: "风险与涉诉";
}, {
    readonly id: "equity";
    readonly label: "股权与实控人";
    readonly phrase: "股权与实控人";
}, {
    readonly id: "finance";
    readonly label: "经营与财务";
    readonly phrase: "经营与财务";
}, {
    readonly id: "contact";
    readonly label: "联系人与触达";
    readonly phrase: "联系人与触达路径";
}, {
    readonly id: "ipr";
    readonly label: "知识产权";
    readonly phrase: "知识产权";
}, {
    readonly id: "bidding";
    readonly label: "招投标业绩";
    readonly phrase: "招投标业绩";
}];
export declare const BUDGET_OPTIONS: readonly [{
    readonly id: "fast";
    readonly label: "3分钟速览";
    readonly phrase: "速览";
}, {
    readonly id: "standard";
    readonly label: "15分钟标准";
    readonly phrase: "标准";
}, {
    readonly id: "deep";
    readonly label: "深度尽调";
    readonly phrase: "深度";
}];
export declare const OUTPUT_OPTIONS: readonly [{
    readonly id: "onepager";
    readonly label: "一页纸简报";
    readonly phrase: "一页纸简报";
}, {
    readonly id: "questions";
    readonly label: "提问清单为主";
    readonly phrase: "以当面提问清单为主的简报";
}, {
    readonly id: "full";
    readonly label: "完整报告";
    readonly phrase: "完整尽调报告";
}, {
    readonly id: "share";
    readonly label: "可转发摘要";
    readonly phrase: "适合转发给同事的简短摘要";
}];
export type ComposerSelection = {
    role?: string;
    purpose?: string;
    focus: string[];
    budget?: string;
    output?: string;
};
export type ComposerMode = "generated" | "manual";
export type ComposerState = {
    text: string;
    lastGenerated: string;
    lastCompany: string;
    mode: ComposerMode;
};
export declare const EMPTY_SELECTION: ComposerSelection;
export declare const EMPTY_COMPOSER_STATE: ComposerState;
export declare function composeFullSentence(selection: ComposerSelection, company?: string): string;
export declare function composeImperative(selection: ComposerSelection): string;
export declare function updateManualText(state: ComposerState, text: string): ComposerState;
export declare function applySelection(state: ComposerState, selection: ComposerSelection, companyOverride?: string): ComposerState;
export declare function generateFromSelection(state: ComposerState, selection: ComposerSelection): ComposerState;
export declare function validateComposerText(text: string): string | undefined;
export declare function createTaskId(now?: Date, randomValue?: number): string;
export declare function serializePrevisitRequest(text: string, taskId: string): string;
