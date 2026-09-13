/** Bounded provider facts for live display and historical review; never executable content. */
export type ResultSummary = {
    summary: string;
    facts: string[];
    factors: {
        name: string;
        count: number;
    }[];
};
export declare function summarizeResult(value: unknown): ResultSummary;
