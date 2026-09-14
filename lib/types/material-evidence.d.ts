export type Material = {
    id: string;
    taskId: string;
    title: string;
    kind: "onsite" | "file" | "web" | "provider";
    locator: string;
    sourceDate: string;
    importedAt: string;
    sha256: string;
    text: string;
    provenance: "supplied-text";
};
export type EvidenceFact = {
    id: string;
    materialId: string;
    entity: string;
    field: string;
    period: string;
    unit: string;
    value: string;
    quote: string;
    location: string;
};
export type EvidenceComparison = {
    id: string;
    leftId: string;
    rightId: string;
    status: "consistent" | "conflict" | "incomparable" | "same-source";
    independence: "not-established";
    createdAt: string;
};
export declare function boundedText(value: unknown, max?: number): string;
export declare function createMaterial(input: Record<string, unknown>, taskId: string): Material;
export declare function createFact(input: Record<string, unknown>, materials: Material[], entity: string): EvidenceFact;
export declare function compareFacts(leftId: string, rightId: string, facts: EvidenceFact[], materials: Material[]): EvidenceComparison;
