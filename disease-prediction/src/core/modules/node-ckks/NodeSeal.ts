import SEAL from 'node-seal'
import { SEALLibrary } from "node-seal/implementation/seal";

export class NodeSealProvider {
    private static _seal: SEALLibrary | null = null;

    private constructor() { }

    static async getSeal(): Promise<SEALLibrary> {
        return this._seal ?? (this._seal = await SEAL());
    }
}