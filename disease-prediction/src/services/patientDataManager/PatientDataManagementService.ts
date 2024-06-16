import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { Db } from "mongodb";


export default class PatientDataManagementService {
    private constructor() { }


    private static async connectDb(): Promise<Db> {
        try {
            return await MongoDbProvider.connectDb(process.env.MONGODB_URI).then(() => MongoDbProvider.getDb());
        }
        catch (error) {
            console.error("Database connection failed:", error);
            if (error instanceof Error) {
                throw new Error(`Database connection failed: ${error.message}`);
            } else {
                throw new Error("An unknown error occurred during database connection");
            }
        }
    }


    public static async savePatientData(userId: string, chunk: string, index: string): Promise<string> {
        const db = await this.connectDb();

        try {
            const result = await db.collection('patientData').insertOne({
                id: userId,
                chunk: chunk,
                index: index,
            });
            return result.insertedId.toString();
        }
        catch (error) {
            console.error('Failed to save patientData:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to save patientData: ${error.message}`);
            } else {
                throw new Error('An unknown error occurred while saving the patientData');
            }
        }
    }


    public static async loadPatientData(userId: string): Promise<Uint8Array> {
        const db = await this.connectDb();

        try {
            const serializedPublickey = await db.collection('patientData')
                .find({ id: userId })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return this.mergeUint8Arrays(chunks.map(chunk => this.base64ToUint8Array(chunk.chunk)));
                });
            return serializedPublickey;
        }
        catch (error) {
            console.error('Failed to load patientData:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to load patientData: ${error.message}`);
            } else {
                throw new Error('An unknown error occurred while loading the patientData');
            }
        }
    }


    public static async deletePatientData(userId: string): Promise<number> {
        const db = await this.connectDb();

        try {
            const result = await db.collection('patientData').deleteMany({
                id: userId,
            });
            return result.deletedCount;
        }
        catch (error) {
            console.error('Failed to delete patientData:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to delete patientData: ${error.message}`);
            } else {
                throw new Error('An unknown error occurred while deleting the patientData');
            }
        }
    }


    private static base64ToUint8Array(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }


    private static mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
        const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
        const mergedArray = new Uint8Array(totalLength);

        let offset = 0;
        for (const arr of arrays) {
            mergedArray.set(arr, offset);
            offset += arr.length;
        }
        return mergedArray;
    }
}
