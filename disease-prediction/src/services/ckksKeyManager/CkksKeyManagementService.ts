import MongoDbProvider from "@/core/modules/database/MongoDbProvider";
import { Db } from "mongodb";


export default class CkksKeyManagementService {
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


    public static async saveCkksKey(userId: string, chunk: string, index: string, keyType: "publicKey" | "relinKeys" | "galoisKeys"): Promise<string> {
        const db = await this.connectDb();

        try {
            const result = await db.collection(keyType).insertOne({
                id: userId,
                chunk: chunk,
                index: index,
            });
            return result.insertedId.toString();
        }
        catch (error) {
            console.error(`Failed to save CKKS ${keyType}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to save CKKS ${keyType}: ${error.message}`);
            } else {
                throw new Error(`An unknown error occurred while saving the CKKS ${keyType}`);
            }
        }
    }


    public static async loadCkksKey(userId: string, keyType: "publicKey" | "relinKeys" | "galoisKeys") {
        const db = await this.connectDb();

        try {
            console.log('loadCkksKey', keyType)
            return await db.collection(keyType)
                .find({ id: userId })
                .toArray()
                .then((chunks) => {
                    chunks.sort((a, b) => a.index - b.index);
                    return this.mergeUint8Arrays(chunks.map(chunk => this.base64ToUint8Array(chunk.chunk)));
                });
        }
        catch (error) {
            console.error(`Failed to load CKKS ${keyType}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to load CKKS ${keyType}: ${error.message}`);
            } else {
                throw new Error(`An unknown error occurred while loading the CKKS ${keyType}`);
            }
        }
    }


    public static async deleteCkksKey(userId: string, keyType: "publicKey" | "relinKeys" | "galoisKeys"): Promise<number> {
        const db = await this.connectDb();

        try {
            const result = await db.collection(keyType).deleteMany({
                id: userId,
            });
            return result.deletedCount;
        }
        catch (error) {
            console.error(`Failed to delete CKKS ${keyType}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to delete CKKS ${keyType}: ${error.message}`);
            } else {
                throw new Error(`An unknown error occurred while deleting the CKKS ${keyType}`);
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
