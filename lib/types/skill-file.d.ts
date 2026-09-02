export type ParsedSkillFile = {
    content: string;
    frontmatter: string | null;
};
export declare function parseSkillFile(source: string): ParsedSkillFile;
