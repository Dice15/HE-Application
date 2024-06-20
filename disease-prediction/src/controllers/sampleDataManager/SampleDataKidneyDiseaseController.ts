import SampleKidneyDiseaseService from '@/services/sampleDataManager/SampleDataKidneyDiseaseService';
import { NextApiRequest, NextApiResponse } from 'next';


export default class SampleDataKidneyDiseaseController {
    private constructor() { }


    public static async handleGetSampleData(request: NextApiRequest, response: NextApiResponse): Promise<void> {
        try {
            const data = await SampleKidneyDiseaseService.getSampleData();
            response.setHeader('Content-Type', 'text/csv');
            response.setHeader('Content-Disposition', 'attachment; filename=kidney_disease.csv');
            response.status(200).send(data);
        }
        catch (error) {
            console.error(error);
            response.status(500).end(`${error}`);
        }
    }
}