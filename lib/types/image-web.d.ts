import { type ImageIntakeStore } from "./image-intake.js";
type WebRequest = {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    [Symbol.asyncIterator](): AsyncIterator<Uint8Array>;
};
type WebResponse = {
    writeHead(status: number, headers: Record<string, string>): void;
    end(body: string): void;
};
type ImageWebServer = {
    register(route: {
        kind: "prefix";
        path: string;
        handler: (req: WebRequest, res: WebResponse) => void | Promise<void>;
    }): () => void;
};
/** 图片暂存路由：POST 暂存（返回凭证与回填说明）、GET 状态、DELETE 移除。只接受本机来源。 */
export declare function mountImageRoutes(server: ImageWebServer, images: ImageIntakeStore): () => void;
export {};
