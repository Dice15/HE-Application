import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import MongoDbProvider from '@/core/modules/database/MongoDbProvider';
import KidneyDiseasePredictionController from '@/controllers/KidneyDiseasePredictionController';


export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};


export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const db = await MongoDbProvider.connectDb(process.env.MONGODB_URI).then(() => MongoDbProvider.getDb());
    const session = await getServerSession(request, response, authOptions);

    switch (request.method) {
        case 'POST': {
            if (!session) {
                response.status(401).end('Unauthorized');
                return;
            }

            try {
                await KidneyDiseasePredictionController.handlePredictKidneyDisease(request, response, session, db);
                break;
            } catch (error) {
                console.error(error);
                response.status(500).end(`${error}`);
            }
            break;
        }
        default: {
            response.setHeader('Allow', ['POST']);
            response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    }
}