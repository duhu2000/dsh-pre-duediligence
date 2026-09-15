import { type SessionInputHost } from "./session-input.js";
export declare const INITIAL_DRAFT_ID = "dsh-initial-draft/previsit/1";
export declare const INITIAL_DRAFT_SHA256 = "6fcef5e766f9e54d3ff33d73bfdb3edcb7ce688759503bca0bc73cdbf8eadbdc";
export declare const INITIAL_DRAFT_TEXT = "\u8BF7\u5E2E\u6211\u51C6\u5907\u4E00\u6B21\u5BA2\u6237\u62DC\u8BBF\u3002\u8BF7\u586B\u5199\u4F01\u4E1A\u540D\u79F0\u548C\u5173\u6CE8\u91CD\u70B9\uFF0C\u4E5F\u53EF\u70B9\u51FB\u5DE6\u4E0A\u89D2\u300C\u63D0\u793A\u8BCD\u751F\u6210\u300D\u9009\u62E9\u89D2\u8272\u3001\u62DC\u8BBF\u573A\u666F\u548C\u62A5\u544A\u683C\u5F0F\u3002\u4F8B\u5982\uFF1A\u6211\u662F\u94F6\u884C\u5BA2\u6237\u7ECF\u7406\uFF0C\u51C6\u5907\u62DC\u8BBF\u3010\u4F01\u4E1A\u540D\u79F0\u3011\uFF0C\u91CD\u70B9\u4E86\u89E3\u7ECF\u8425\u60C5\u51B5\u4E0E\u98CE\u9669\uFF0C\u751F\u6210\u8BBF\u524D\u7B80\u62A5\u3002";
/** Deliberately no trimming/normalization: any edit belongs to the user. */
export declare const isInitialDraft: (text: string) => boolean;
export declare const hasUnfilledPlaceholder: (text: string) => boolean;
/** Only the business launcher calls this, after create and before open.
 * No retry on mount, restore or selection. Older inputs without attachment/revision
 * snapshots remain empty. setDraft has no public IME/no-focus option; we only write
 * to the new, not-yet-visible Session, never the mounted current editor.
 */
export declare function prefillCreatedPrevisitSession(host: SessionInputHost, sessionId: string, entryStillCurrent: () => boolean): Promise<boolean>;
export type InitialDraftSnapshot = {
    sessionId: string;
    ready: boolean;
    draft: string;
    attachmentIds: readonly string[];
    composing: boolean;
    revision: number;
};
/** Product-owned port, NOT a claimed DSH API. No supported Host adapter yet.
 * An adapter must guarantee conditional synchronous write with no focus/selection change.
 */
export type InitialDraftPort = {
    snapshot(): InitialDraftSnapshot;
    writeIfUnchanged(snapshot: InitialDraftSnapshot, text: string): boolean;
};
export type InitialDraftLedger = {
    has(sessionId: string): boolean;
    consume(sessionId: string): void;
};
export type InitialDraftResult = "initialized" | "skipped" | "unsupported" | "failed";
/** Called only from a successful business-entry create event, never a mount or restore.
 * Consuming before async work prevents retries/remounts from racing user takeover.
 * Storage failure fails closed; no timer, focus, send, task or navigation capability.
 */
export declare function initializeNewPrevisitDraft(sessionId: string, ledger: InitialDraftLedger, resolve: () => Promise<InitialDraftPort | undefined>, isCurrent: () => boolean): Promise<InitialDraftResult>;
