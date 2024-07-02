import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import MongoDbProvider from '@/core/modules/database/MongoDbProvider';
import { getToken } from 'next-auth/jwt';


export const config = {
    maxDuration: 60,
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: '2mb'
        }
    }
};


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
    const { requestUrl, ip, city, country } = request.query;

    if (typeof requestUrl !== 'string' || typeof ip !== 'string' || typeof city !== 'string' || typeof country !== 'string') {
        console.error('Missing required query parameter.');
        response.status(400).end();
        return;
    }

    switch (request.method) {
        case 'GET': {
            try {
                const db = await MongoDbProvider.connectDb(process.env.MONGODB_URI).then(() => MongoDbProvider.getDb());
                const result = await db.collection('weblog').insertOne({
                    time: getKST(),
                    requestUrl,
                    ip,
                    city,
                    country
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