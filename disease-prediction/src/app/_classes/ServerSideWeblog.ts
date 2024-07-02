import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export default class ServerSideWeblog {
    private constructor() { }

    static async saveConnectionUrl(headers: ReadonlyHeaders, url: string): Promise<void> {
        const host = headers.get('host') || '';
        const protocol = headers.get('x-forwarded-proto') || 'http';
        const originUrl = `${protocol}://${host}`;
        const connectionUrl = originUrl + url;
        const clientIp = (headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
        fetch(`${originUrl}/api/weblog/savelog?connectionUrl=${encodeURIComponent(connectionUrl)}&clientIp=${encodeURIComponent(clientIp)}`, { method: 'GET' });
    }
}
