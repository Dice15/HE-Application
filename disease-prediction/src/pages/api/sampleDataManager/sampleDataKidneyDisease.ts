import { NextApiRequest, NextApiResponse } from 'next';
import SampleDataKidneyDiseaseController from '@/controllers/sampleDataManager/SampleDataKidneyDiseaseController';


export const config = {
    api: {
        bodyParser: false,
    }
};


export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    switch (request.method) {
        case 'GET': {
            try {
                await SampleDataKidneyDiseaseController.handleGetSampleData(request, response);
            } catch (error) {
                console.error(error);
                response.status(500).end(`Error processing request: ${error}`);
            }
            break;
        }
        default: {
            response.setHeader('Allow', ['GET']);
            response.status(405).end(`Method ${request.method} Not Allowed`);
        }
    }
}