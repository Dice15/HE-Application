import { NextApiRequest, NextApiResponse } from 'next';
import MongoDbProvider from '@/core/modules/database/MongoDbProvider';


export const config = {
    maxDuration: 60,
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: '2mb'
        }
    }
};


function getClientIp(request: NextApiRequest): string {
    const xForwardedFor = request.headers['x-forwarded-for'] as string | undefined;
    if (xForwardedFor) {
        const ips = xForwardedFor.split(',').map(ip => ip.trim());
        return ips[0];
    }
    return request.socket.remoteAddress || 'unknown';
}


async function getGeoLocation(ip: string) {
    if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
        return { city: 'Local', country: 'Local' };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (!response.ok) {
        console.error('Failed to fetch geo location');
        return { city: 'Unknown', country: 'Unknown' };
    }
    const data = await response.json();
    return { city: data.city, country: data.country };
}


function getKST(): string {
    const currentUtcTime = new Date();
    const currentKSTTime = new Date(currentUtcTime.getTime() + 9 * 60 * 60 * 1000);

    const year = currentKSTTime.getUTCFullYear();
    const month = String(currentKSTTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentKSTTime.getUTCDate()).padStart(2, '0');
    let hours = currentKSTTime.getUTCHours();
    const minutes = String(currentKSTTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(currentKSTTime.getUTCSeconds()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedHours = String(hours).padStart(2, '0');

    return `${year}-${month}-${day} ${ampm} ${formattedHours}:${minutes}:${seconds}`;
}



export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const connectionUrl = request.query.connectionUrl;

    if (typeof connectionUrl !== 'string') {
        console.error('Missing required query parameter.');
        response.status(400).end();
        return;
    }

    switch (request.method) {
        case 'GET': {
            try {
                const time = getKST();
                const ip = getClientIp(request);
                const geoLocation = await getGeoLocation(ip);

                const db = await MongoDbProvider.connectDb(process.env.MONGODB_URI).then(() => MongoDbProvider.getDb());
                const result = await db.collection('weblog').insertOne({
                    connectionTime: time,
                    connectionUrl: connectionUrl,
                    clientIp: ip,
                    clientCity: geoLocation.city,
                    clientCountry: geoLocation.country
                });
                response.status(200).end();
            } catch (error) {
                console.error(error);
                response.status(200).end();
            }
            break;
        }
        default: {
            response.status(405).end();
        }
    }
}