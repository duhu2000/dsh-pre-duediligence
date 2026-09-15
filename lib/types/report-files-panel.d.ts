export declare function downloadReportFormat(taskId: string, sessionId: string, format: "pdf" | "docx"): Promise<void>;
export declare function ReportFilesPanel({ taskId, sessionId, onHtml }: {
    taskId: string;
    sessionId: string;
    onHtml?: () => void;
}): import("react").JSX.Element;
