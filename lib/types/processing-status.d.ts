export declare function processingStatus(input: {
    running: boolean | undefined;
    error: string | undefined;
    waiting: boolean;
    querying: boolean;
    secondsSinceResult: number;
    activity?: {
        phase: "analysis" | "verification" | "writing";
        summary: string;
        updatedAt: string;
    };
    now?: number;
    lastResultAt?: number;
}): {
    busy: boolean;
    title: string;
    detail: string;
};
