export declare const inject: readonly ["skills"];
export declare const SKILL_NAME = "qcc-previsit-onepager";
export declare const SKILL_DESCRIPTION = "\u8C03\u7528\u4F01\u67E5\u67E5\u4E94\u7C7B MCP \u6267\u884C\u4F01\u4E1A\u8BBF\u524D\u5C3D\u8C03\uFF0C\u4EE5\u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE\u8BC6\u522B\u7ECF\u8425\u72B6\u6001\u3001\u5EFA\u7ACB\u5E76\u53CD\u8BC1\u4E1A\u52A1\u5047\u8BBE\uFF0C\u4EA4\u4ED8\u53EF\u8FFD\u6EAF\u7684\u62DC\u8BBF\u4F5C\u6218\u5361\u3002";
type SkillRegistration = {
    name: string;
    description: string;
    whenToUse: string;
    content: string;
    source: "bundled";
    resourceBase: {
        kind: "directory";
        path: string;
    };
    metadata: Readonly<Record<string, unknown>>;
};
export type HostContext = {
    skills: {
        register(skill: SkillRegistration): () => void;
    };
};
export declare function loadBundledSkill(): SkillRegistration;
export declare function apply(ctx: HostContext): void;
export {};
