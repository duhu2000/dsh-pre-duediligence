export declare function processingStatus(input: {
    running: boolean | undefined;
    error: string | undefined;
    waiting: boolean;
    querying: boolean;
    secondsSinceResult: number;
}): {
    busy: boolean;
    title: string;
    detail: string;
};
