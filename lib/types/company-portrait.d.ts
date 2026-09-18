/** Optional, bounded source fields; not analysis or a replacement for the original result. */
export type CompanyPortrait = {
    region?: string;
    areaCode?: string;
    nationalIndustry?: string;
    qccIndustry?: string;
    products?: string[];
    scale?: string;
    introduction?: string;
    overview?: string;
    status?: string;
    capital?: string;
};
export declare function collectPortrait(target: CompanyPortrait, row: Record<string, unknown>): void;
