/** Bounded provider facts for live display and historical review; never executable content. */
import { type CompanyPortrait } from "./company-portrait.js";
export type ResultSummary = {
    summary: string;
    facts: string[];
    factors: {
        name: string;
        count: number;
    }[];
    portrait?: CompanyPortrait;
};
export declare function summarizeResult(value: unknown, dimension?: string): ResultSummary;
