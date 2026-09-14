import type { PrevisitTaskRecord, StorageDomain } from "./previsit-workflow.js";
export type ReportFile = {
    id: string;
    taskId: string;
    version: number;
    format: "pdf" | "docx";
    fileName: string;
    mediaType: string;
    sourceHash: string;
    sha256: string;
    createdAt: string;
    size: number;
};
type StoredFile = ReportFile & {
    base64: string;
};
export type DeliveryRequest = {
    id: string;
    fileId: string;
    taskId: string;
    destination: string;
    requestedAt: string;
    status: "awaiting-configuration";
};
/** Text-preserving export: markdown notation stays visible; no remote images, HTML or scripts execute. */
export declare function renderReportFile(task: PrevisitTaskRecord, format: "pdf" | "docx", fontPath?: string | undefined): Promise<Buffer>;
export declare class ReportFiles {
    private files;
    private deliveries;
    private table;
    private queue;
    private ready;
    attach(domain: StorageDomain): Promise<void>;
    private load;
    list(taskId: string): {
        files: {
            id: string;
            taskId: string;
            version: number;
            format: "pdf" | "docx";
            fileName: string;
            mediaType: string;
            sourceHash: string;
            sha256: string;
            createdAt: string;
            size: number;
        }[];
        deliveries: DeliveryRequest[];
    };
    get(id: string, taskId: string): StoredFile;
    export(task: PrevisitTaskRecord, format: "pdf" | "docx"): Promise<ReportFile>;
    requestDelivery(taskId: string, fileId: string, destination: string): Promise<DeliveryRequest>;
}
export {};
