import { CKKSEncoder } from 'node-seal/implementation/ckks-encoder';
import { Context } from 'node-seal/implementation/context';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SEALProvider } from './seal-provider';
import { ReceiverCKKS, SenderCKKS } from './ckks';



const CKKSPolyModulusDegree = {
    "2^11": 2048,
    "2^12": 4096,
    "2^13": 8192,
    "2^14": 16384,
    "2^15": 32768,
};



const CKKSScale = {
    "2^16": 65536,
    "2^17": 131072,
    "2^18": 262144,
    "2^19": 524288,
    "2^20": 1048576,
    "2^21": 2097152,
    "2^22": 4194304,
    "2^23": 8388608,
    "2^24": 16777216,
    "2^25": 33554432,
    "2^26": 67108864,
    "2^27": 134217728,
    "2^28": 268435456,
    "2^29": 536870912,
    "2^30": 1073741824,
    "2^31": 2147483648,
    "2^32": 4294967296,
    "2^33": 8589934592,
    "2^34": 17179869184,
    "2^35": 34359738368,
    "2^36": 68719476736,
    "2^37": 137438953472,
    "2^38": 274877906944,
    "2^39": 549755813888,
    "2^40": 1099511627776,
    "2^41": 2199023255552,
    "2^42": 4398046511104,
    "2^43": 8796093022208,
    "2^44": 17592186044416,
    "2^45": 35184372088832,
    "2^46": 70368744177664,
    "2^47": 140737488355328,
    "2^48": 281474976710656,
    "2^49": 562949953421312,
    "2^50": 1125899906842624,
};



abstract class AbstractCKKSBuilder<T extends AbstractCKKSBuilder<T>> {
    protected _securityLevel: "none" | "tc128" | "tc192" | "tc256";
    protected _polyModulusDegree: number;
    protected _bitSizes: number[];
    protected _scale: number;
    protected _vectorSize: number | "default";


    constructor() {
        this._securityLevel = "tc128";
        this._polyModulusDegree = Math.pow(2, 13);
        this._vectorSize = "default";
        this._bitSizes = [60, 40, 60];
        this._scale = Math.pow(2, 40);
    }


    protected async loadSEALLibrary(): Promise<SEALLibrary> {
        try {
            return await SEALProvider.getSEAL();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to load SEAL library for unknown reasons");
        }
    }


    protected createContext(seal: SEALLibrary): Context {
        try {
            const maxBitCount = seal.CoeffModulus.MaxBitCount(this._polyModulusDegree, seal.SecurityLevel[this._securityLevel]);
            const totalBitSize = this._bitSizes.reduce((sum, bitSize) => sum + bitSize, 0);

            if (maxBitCount < totalBitSize) {
                throw new Error(`BitSizes has been over coeffModulus's maxBitCount(${maxBitCount}).`);
            }

            const coeffModulus = seal.CoeffModulus.Create(this._polyModulusDegree, Int32Array.from(this._bitSizes));
            const encryptionParameters = seal.EncryptionParameters(seal.SchemeType.ckks);
            encryptionParameters.setPolyModulusDegree(this._polyModulusDegree);
            encryptionParameters.setCoeffModulus(coeffModulus);

            const context = seal.Context(encryptionParameters, true, seal.SecurityLevel);

            coeffModulus.delete();
            encryptionParameters.delete();

            return context;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create context for unknown reasons.");
        }
    }


    protected createCKKSEncoder(seal: SEALLibrary, context: Context): CKKSEncoder {
        try {
            const encoder = seal.CKKSEncoder(context);

            if (this._vectorSize === "default") {
                this._vectorSize = encoder.slotCount;
            }

            if (encoder.slotCount < this._vectorSize) {
                throw new Error(`VectorSize has been over encoder's slotCount(${encoder.slotCount}).`);
            }

            return encoder;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create CKKSEncoder for unknown reasons.");
        }
    }


    public setSecurityLevel(securityLevel: "none" | "tc128" | "tc192" | "tc256"): T {
        this._securityLevel = securityLevel;
        return this.getThis();
    }


    public setPolyModulusDegree(polyModulusDegree: "2^11" | "2^12" | "2^13" | "2^14" | "2^15"): T {
        this._polyModulusDegree = CKKSPolyModulusDegree[polyModulusDegree];
        return this.getThis();
    }


    public setVectorSize(vectorSize: number | "default"): T {
        if (typeof vectorSize === "number" && vectorSize < 1) {
            throw new Error(`The vector size must be at least 1. Received: ${vectorSize}.`);
        }
        this._vectorSize = vectorSize;
        return this.getThis();
    }


    public setBitSizes(bitSizes: number[]): T {
        this._bitSizes = bitSizes;
        return this.getThis();
    }


    public setScale(
        scale:
            "2^16" | "2^17" | "2^18" | "2^19" |
            "2^20" | "2^21" | "2^22" | "2^23" | "2^24" | "2^25" | "2^26" | "2^27" | "2^28" | "2^29" |
            "2^30" | "2^31" | "2^32" | "2^33" | "2^34" | "2^35" | "2^36" | "2^37" | "2^38" | "2^39" |
            "2^40" | "2^41" | "2^42" | "2^43" | "2^44" | "2^45" | "2^46" | "2^47" | "2^48" | "2^49" |
            "2^50"
    ): T {
        this._scale = CKKSScale[scale];
        return this.getThis();
    }


    public abstract getThis(): T;


    public abstract build(...args: Uint8Array[]): Promise<SenderCKKS | ReceiverCKKS>;
}



export class SenderCKKSBuilder extends AbstractCKKSBuilder<SenderCKKSBuilder> {
    constructor() {
        super();
    }


    public override getThis(): SenderCKKSBuilder {
        return this;
    }


    public override async build(serializedSecretKey?: Uint8Array): Promise<SenderCKKS> {
        const seal = await this.loadSEALLibrary();
        const context = this.createContext(seal);
        const encoder = this.createCKKSEncoder(seal, context);

        try {
            let keyGenerator = seal.KeyGenerator(context);
            const secretKey = keyGenerator.secretKey();

            if (serializedSecretKey !== undefined) {
                keyGenerator.delete();
                secretKey.loadArray(context, serializedSecretKey);
                keyGenerator = seal.KeyGenerator(context, secretKey);
            }

            const publicKey = keyGenerator.createPublicKey();
            const relinKeys = keyGenerator.createRelinKeys();
            const galoisKeys = keyGenerator.createGaloisKeys(
                this._polyModulusDegree < CKKSPolyModulusDegree["2^15"]
                    ? Int32Array.from({ length: Math.ceil(Math.log2(this._vectorSize as number)) }, (_, k) => Math.pow(2, k))
                    : Int32Array.from({ length: Math.ceil(Math.log2(this._vectorSize as number) / 3) }, (_, k) => Math.pow(8, k))
            );

            keyGenerator.delete();

            const encryptor = seal.Encryptor(context, publicKey);
            const decryptor = seal.Decryptor(context, secretKey);
            const evaluator = seal.Evaluator(context);

            return new SenderCKKS(seal, this._polyModulusDegree, this._scale, this._vectorSize as number, context, encoder, secretKey, publicKey, relinKeys, galoisKeys, encryptor, decryptor, evaluator);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to build for unknown reasons.");
        }
    }
}



export class ReceiverCKKSBuilder extends AbstractCKKSBuilder<ReceiverCKKSBuilder> {
    constructor() {
        super();
    }


    public override getThis(): ReceiverCKKSBuilder {
        return this;
    }


    public override async build(serializedPublicKey: Uint8Array, serializedRelinKeys: Uint8Array, serializedGaloisKeys: Uint8Array) {
        const seal = await this.loadSEALLibrary();
        const context = this.createContext(seal);
        const encoder = this.createCKKSEncoder(seal, context);

        try {
            const publicKey = seal.PublicKey();
            const relinKeys = seal.RelinKeys();
            const galoisKeys = seal.GaloisKeys();

            publicKey.loadArray(context, serializedPublicKey);
            relinKeys.loadArray(context, serializedRelinKeys);
            galoisKeys.loadArray(context, serializedGaloisKeys);

            const encryptor = seal.Encryptor(context, publicKey);
            const evaluator = seal.Evaluator(context);

            return new ReceiverCKKS(seal, this._polyModulusDegree, this._scale, this._vectorSize as number, context, encoder, publicKey, relinKeys, galoisKeys, encryptor, evaluator);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to build for unknown reasons.");
        }
    }
}