import path from "path";
import fs from 'fs/promises';

export default class SampleKidneyDiseaseService {
    private constructor() { }


    public static async getSampleData(): Promise<Buffer> {
        try {
            const filePath = path.resolve('./public/samples', 'kidney_disease.csv');
            const data = await fs.readFile(filePath);
            return data;
        } catch (error) {
            console.error("File not found or cannot be read:", error);
            if (error instanceof Error) {
                throw new Error(`File not found or cannot be read: ${error.message}`);
            } else {
                throw new Error("An unknown error occurred during file reading");
            }
        }
    }
}
