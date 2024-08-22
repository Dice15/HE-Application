import SEAL from 'node-seal'
import { SEALLibrary } from "node-seal/implementation/seal";


export class SEALProvider {
    private static _seal: SEALLibrary | null = null;


    private constructor() { }


    public static async getSEAL(): Promise<SEALLibrary> {
        try {
            return this._seal ?? (this._seal = await SEAL());
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
        }
    }
}