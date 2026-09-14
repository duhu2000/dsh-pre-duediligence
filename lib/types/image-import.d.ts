import { type ReactNode } from "react";
import { type StagedCommand } from "./image-bridge.js";
export declare function useImageImport(sessionId: string, send: (prompt: string) => Promise<void>): {
    busy: boolean;
    command: StagedCommand | null;
    error: string | undefined;
    status: string | undefined;
    accept: (file: File | undefined) => Promise<void>;
};
/** 小按钮：放在「要见谁」输入框右侧。 */
export declare function ImportButton(props: {
    busy: boolean;
    onFile: (file: File | undefined) => void;
    title?: string;
}): JSX.Element;
/** 拖入/粘贴包裹层：把整块表单当作接收区，视觉只在拖入时提示。 */
export declare function DropZone(props: {
    onFile: (file: File | undefined) => void;
    children: ReactNode;
    className?: string;
}): JSX.Element;
