import { type PrevisitWorkflowStore } from "./previsit-workflow.js";
type RequestLike = AsyncIterable<Uint8Array> & {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
};
type ResponseLike = {
    writeHead(status: number, headers?: Record<string, string>): void;
    end(body?: string | Uint8Array): void;
};
export type WebServer = {
    register(input: {
        kind: "prefix";
        path: string;
        handler(req: RequestLike, res: ResponseLike): unknown;
    }): () => void;
};
export declare function mountPrevisitWebRoutes(webServer: WebServer, workflow: PrevisitWorkflowStore): () => void;
export {};
