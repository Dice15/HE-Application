import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export default class ServerSideWeblog {
    private constructor() { }

    static async saveConnectionUrl(headers: ReadonlyHeaders, url: string): Promise<void> {
        const host = headers.get('host') || '';
        const protocol = headers.get('x-forwarded-proto') || 'http';
        const originUrl = `${protocol}://${host}`;
        const connectionUrl = originUrl + url;
        fetch(`${originUrl}/api/weblog/savelog?connectionUrl=${encodeURIComponent(connectionUrl)}`, { method: 'GET' });
    }
}
