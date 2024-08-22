import SEAL from 'node-seal'
import { Context } from "node-seal/implementation/context";
import { GaloisKeys } from "node-seal/implementation/galois-keys";
import { KeyGenerator } from 'node-seal/implementation/key-generator';
import { PublicKey } from "node-seal/implementation/public-key";
import { RelinKeys } from "node-seal/implementation/relin-keys";
import { SEALLibrary } from "node-seal/implementation/seal";
import { SecretKey } from "node-seal/implementation/secret-key";


export type CKKSOptions = {
    readonly securityLevel: "none" | "tc128" | "tc192" | "tc256";

    readonly coeffModulus: {
        polyModulusDegree: number;
        bitSizes: number[];
    };

    readonly scale: number;

    readonly dataLength: number;
}


export type SenderCKKSOptions = CKKSOptions & {
    readonly allowKey: {
        readonly secretKey: "enable" | "disable";
        readonly publicKey: "enable" | "disable";
        readonly relinKeys: "enable" | "disable";
        readonly galoisKeys: "enable" | "disable";
    };

    readonly loadKey?: {
        readonly savedSecretKey?: string;
        readonly savedPublicKey?: string;
        readonly savedRelinKeys?: string;
        readonly savedGaloisKeys?: string;
    };
}


export type ReceiverCKKSOptions = CKKSOptions & {
    readonly allowKey: {
        readonly publicKey: "enable" | "disable";
        readonly relinKeys: "enable" | "disable";
        readonly galoisKeys: "enable" | "disable";
    };

    readonly loadKey?: {
        readonly savedPublicKey?: string;
        readonly savedRelinKeys?: string;
        readonly savedGaloisKeys?: string;
    };
}


export class CKKSProvider {
    private static _seal?: SEALLibrary;


    private constructor() { }


    private static async loadSEAL(): Promise<SEALLibrary> {
        return this._seal ?? (this._seal = await SEAL());
    }


    private static createContext(seal: SEALLibrary, options: CKKSOptions): Context {
        const maxBitCount = seal.CoeffModulus.MaxBitCount(options.coeffModulus.polyModulusDegree, seal.SecurityLevel[options.securityLevel]);
        const totalBitCount = options.coeffModulus.bitSizes.reduce((sum, bitSize) => sum + bitSize, 0);

        if (maxBitCount < totalBitCount) {
            throw new Error(`BitSizes has been over coeffModulus's maxBitCount(${maxBitCount}).`);
        }

        const coeffModulus = seal.CoeffModulus.Create(options.coeffModulus.polyModulusDegree, Int32Array.from(options.coeffModulus.bitSizes));
        const encryptionParameters = seal.EncryptionParameters(seal.SchemeType.ckks);
        encryptionParameters.setPolyModulusDegree(options.coeffModulus.polyModulusDegree);
        encryptionParameters.setCoeffModulus(coeffModulus);

        const context = seal.Context(encryptionParameters, true, seal.SecurityLevel);

        coeffModulus.delete();
        encryptionParameters.delete();

        return context;
    }


    private static createSenderKeys(seal: SEALLibrary, context: Context, options: SenderCKKSOptions): {
        secretKey?: SecretKey,
        publicKey?: PublicKey,
        relinKeys?: RelinKeys,
        galoisKeys?: GaloisKeys
    } {

        let keyGenerator: KeyGenerator;
        let secretKey: SecretKey | undefined = undefined;
        let publicKey: PublicKey | undefined = undefined;
        let relinKeys: RelinKeys | undefined = undefined;
        let galoisKeys: GaloisKeys | undefined = undefined;

        if (options.allowKey.secretKey === "enable") {
            if (options.loadKey?.savedSecretKey) {
                secretKey = seal.SecretKey();
                secretKey.load(context, options.loadKey.savedSecretKey);
                keyGenerator = seal.KeyGenerator(context, secretKey);
            } else {
                keyGenerator = seal.KeyGenerator(context);
                secretKey = keyGenerator.secretKey();
            }
        } else {
            if (options.loadKey?.savedSecretKey) {
                const secret = seal.SecretKey();
                secret.load(context, options.loadKey.savedSecretKey);
                keyGenerator = seal.KeyGenerator(context, secret);
                secret.delete();
            } else {
                keyGenerator = seal.KeyGenerator(context);
            }
        }

        if (options.allowKey.publicKey === "enable") {
            if (options.loadKey?.savedPublicKey) {
                publicKey = seal.PublicKey();
                publicKey.load(context, options.loadKey.savedPublicKey);
            } else {
                publicKey = keyGenerator.createPublicKey();
            }
        }

        if (options.allowKey.relinKeys === "enable") {
            if (options.loadKey?.savedRelinKeys) {
                relinKeys = seal.RelinKeys();
                relinKeys.load(context, options.loadKey.savedRelinKeys);
            } else {
                relinKeys = keyGenerator.createRelinKeys();
            }
        }

        if (options.allowKey.galoisKeys === "enable") {
            if (options.loadKey?.savedGaloisKeys) {
                galoisKeys = seal.GaloisKeys();
                galoisKeys.load(context, options.loadKey.savedGaloisKeys);
            } else {
                const steps = Int32Array.from({ length: Math.ceil(Math.log2(options.dataLength)) }, (_, k) => Math.pow(2, k));
                galoisKeys = keyGenerator.createGaloisKeys(steps);
            }
        }

        keyGenerator.delete();

        return { secretKey, publicKey, relinKeys, galoisKeys };
    }


    private static createRecieverKeys(seal: SEALLibrary, context: Context, options: ReceiverCKKSOptions): {
        publicKey?: PublicKey,
        relinKeys?: RelinKeys,
        galoisKeys?: GaloisKeys
    } {

        let publicKey: PublicKey | undefined = undefined;
        let relinKeys: RelinKeys | undefined = undefined;
        let galoisKeys: GaloisKeys | undefined = undefined;

        if (options.allowKey.publicKey === "enable" && options.loadKey?.savedPublicKey) {
            publicKey = seal.PublicKey();
            publicKey.load(context, options.loadKey.savedPublicKey);
        }

        if (options.allowKey.relinKeys === "enable" && options.loadKey?.savedRelinKeys) {
            relinKeys = seal.RelinKeys();
            relinKeys.load(context, options.loadKey.savedRelinKeys);
        }

        if (options.allowKey.galoisKeys === "enable" && options.loadKey?.savedGaloisKeys) {
            galoisKeys = seal.GaloisKeys();
            galoisKeys.load(context, options.loadKey.savedGaloisKeys);
        }

        return { publicKey, relinKeys, galoisKeys };
    }


    private static getDefaultCKKSOptions(): CKKSOptions {
        return {
            securityLevel: "tc128",
            coeffModulus: {
                polyModulusDegree: Math.pow(2, 13),
                bitSizes: [60, 40, 40, 60]
            },
            scale: Math.pow(2, 40),
            dataLength: 1,
        };
    }


    public static async createSender(): Promise<void>;
    public static async createSender({ securityLevel, coeffModulus, scale, dataLength, allowKey, loadKey }: SenderCKKSOptions): Promise<void>;
    public static async createSender(options?: SenderCKKSOptions): Promise<void> {
        if (!options) {
            options = {
                ...this.getDefaultCKKSOptions(),
                allowKey: {
                    secretKey: "enable",
                    publicKey: "enable",
                    relinKeys: "enable",
                    galoisKeys: "enable"
                },
            };
        }

        const seal = await this.loadSEAL();
        const context = this.createContext(seal, options);
        const keys = this.createSenderKeys(seal, context, options);
    }


    public static async createReceiver(): Promise<void>;
    public static async createReceiver({ securityLevel, coeffModulus, scale, dataLength, allowKey, loadKey }: ReceiverCKKSOptions): Promise<void>;
    public static async createReceiver(options?: ReceiverCKKSOptions) {
        if (!options) {
            options = {
                ...this.getDefaultCKKSOptions(),
                allowKey: {
                    publicKey: "enable",
                    relinKeys: "enable",
                    galoisKeys: "enable"
                },
            };
        }

        const seal = await this.loadSEAL();
        const context = this.createContext(seal, options);
        const keys = this.createRecieverKeys(seal, context, options);
    }
}


// TODO: SenderCKKS, ReceiverCKKS


CKKSProvider.createSender({
    securityLevel: "tc128",
    coeffModulus: {
        polyModulusDegree: Math.pow(2, 14),
        bitSizes: [60, 40, 40, 40, 40, 40, 60]
    },
    scale: Math.pow(2, 40),
    dataLength: 20,
    allowKey: {
        secretKey: "enable",
        publicKey: "enable",
        relinKeys: "enable",
        galoisKeys: "disable"
    }
});


CKKSProvider.createReceiver({
    securityLevel: "tc128",
    coeffModulus: {
        polyModulusDegree: Math.pow(2, 13),
        bitSizes: [60, 40, 60]
    },
    scale: Math.pow(2, 40),
    dataLength: 20,
    allowKey: {
        publicKey: "enable",
        relinKeys: "enable",
        galoisKeys: "disable"
    }
});