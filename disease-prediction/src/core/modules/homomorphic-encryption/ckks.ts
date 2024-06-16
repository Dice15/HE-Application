import { CipherText } from 'node-seal/implementation/cipher-text';
import { CKKSEncoder } from 'node-seal/implementation/ckks-encoder';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { GaloisKeys } from 'node-seal/implementation/galois-keys';
import { PublicKey } from 'node-seal/implementation/public-key';
import { RelinKeys } from 'node-seal/implementation/relin-keys';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SecretKey } from 'node-seal/implementation/secret-key';


export class CKKSSealBuilder {
    private _seal: SEALLibrary;
    private _securityLevel: any;
    private _polyModulusDegree: number | null;
    private _bitSizes: number[] | null;
    private _scale: number | null;
    private _rotationSteps: number[] | null;
    private _serializedPublicKey: Uint8Array | null;
    private _serializedGaloisKey: Uint8Array | null;
    private _serializedRelinKeys: Uint8Array | null;

    constructor(seal: SEALLibrary, securityLevel: any) {
        this._seal = seal;
        this._securityLevel = securityLevel;
        this._polyModulusDegree = null;
        this._bitSizes = null;
        this._scale = null;
        this._rotationSteps = null;
        this._serializedPublicKey = null;
        this._serializedGaloisKey = null;
        this._serializedRelinKeys = null;
    }

    public setCoeffModulus(polyModulusDegree: number, bitSizes: number[]) {
        this._polyModulusDegree = polyModulusDegree;

        if (bitSizes.length === 0) {
            throw new Error("BitSizes array is empty.");
        } else {
            const totalBitSize = bitSizes.reduce((sum, bitSize) => sum + bitSize, 0);
            const maxBitCount = this._seal.CoeffModulus.MaxBitCount(this._polyModulusDegree, this._securityLevel);

            if (totalBitSize > maxBitCount) {
                throw new Error(`BitSizes has been over CoeffModulus's MaxBitCount(${maxBitCount}).`);
            } else {
                this._bitSizes = bitSizes;
            }
        }

        return this;
    }

    public setScale(scale: number) {
        this._scale = scale;
        return this;
    }

    public setRotationSteps(rotationSteps: number[]) {
        this._rotationSteps = rotationSteps;
        return this;
    }

    public deserializePublicKey(serializedPublicKey: Uint8Array): CKKSSealBuilder {
        this._serializedPublicKey = serializedPublicKey;
        return this;
    }

    public deserializeGaloisKey(serializedGaloisKey: Uint8Array): CKKSSealBuilder {
        this._serializedGaloisKey = serializedGaloisKey;
        return this;
    }

    public deserializeRelinKeys(serializedRelinKeys: Uint8Array): CKKSSealBuilder {
        this._serializedRelinKeys = serializedRelinKeys;
        return this;
    }

    build() {
        if (this._polyModulusDegree === null) {
            throw new Error("Polynomial modulus degree is not set. Please call setCoeffModulus with a valid degree.");
        }
        if (this._bitSizes === null) {
            throw new Error("Coefficient modulus bit sizes are not set. Please call setCoeffModulus with valid bit sizes.");
        }
        if (this._scale === null) {
            throw new Error("Scale is not set. Please call setScale with a valid scale value.");
        }

        const schemeType = this._seal.SchemeType.ckks;
        const coeffModulus = this._seal.CoeffModulus.Create(this._polyModulusDegree, Int32Array.from((this._bitSizes)));

        console.log(this._polyModulusDegree);
        console.log(this._securityLevel, typeof this._securityLevel);
        console.log(this._seal.CoeffModulus.MaxBitCount(this._polyModulusDegree, this._securityLevel));
        console.log(this._bitSizes);

        const contextParms = this._seal.EncryptionParameters(schemeType);
        contextParms.setPolyModulusDegree(this._polyModulusDegree);
        contextParms.setCoeffModulus(coeffModulus);

        try {
            const context = this._seal.Context(contextParms, true, this._securityLevel);

            const keyGenerator = this._seal.KeyGenerator(context);
            const secretKey = keyGenerator.secretKey();
            const publicKey = keyGenerator.createPublicKey();
            const relinKeys = keyGenerator.createRelinKeys();
            const galoisKeys = keyGenerator.createGaloisKeys(this._rotationSteps ? Int32Array.from(this._rotationSteps) : undefined);

            if (this._serializedPublicKey) {
                publicKey.loadArray(context, this._serializedPublicKey);
            }
            if (this._serializedRelinKeys) {
                relinKeys.loadArray(context, this._serializedRelinKeys);
            }
            if (this._serializedGaloisKey) {
                galoisKeys.loadArray(context, this._serializedGaloisKey);
            }

            const encryptor = this._seal.Encryptor(context, publicKey);
            const decryptor = this._seal.Decryptor(context, secretKey);
            const evaluator = this._seal.Evaluator(context);
            const encoder = this._seal.CKKSEncoder(context);

            return new CKKSSeal(this._seal, this._scale, context, encoder, secretKey, publicKey, relinKeys, galoisKeys, encryptor, decryptor, evaluator);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to build CKKSSeal: ${error.message}`);
            } else {
                throw new Error("Failed to build CKKSSeal: An unknown error occurred.");
            }
        }
    }
}


export class CKKSSeal {
    private _seal: SEALLibrary;
    private _scale: number;
    private _context: Context;
    private _encoder: CKKSEncoder;
    private _secretKey: SecretKey;
    private _publicKey: PublicKey;
    private _relinKeys: RelinKeys;
    private _galoisKeys: GaloisKeys;
    private _encryptor: Encryptor;
    private _decryptor: Decryptor;
    private _evaluator: Evaluator;

    constructor(
        seal: SEALLibrary,
        scale: number,
        context: Context,
        encoder: CKKSEncoder,
        secretKey: SecretKey,
        publicKey: PublicKey,
        relinKeys: RelinKeys,
        galoisKeys: GaloisKeys,
        encryptor: Encryptor,
        decryptor: Decryptor,
        evaluator: Evaluator
    ) {
        this._seal = seal;
        this._scale = scale;
        this._context = context;
        this._encoder = encoder;
        this._secretKey = secretKey;
        this._publicKey = publicKey;
        this._relinKeys = relinKeys;
        this._galoisKeys = galoisKeys;
        this._encryptor = encryptor;
        this._decryptor = decryptor;
        this._evaluator = evaluator;
    }

    public serializeSecretKey(): Uint8Array {
        return this._secretKey.saveArray();
    }

    public serializePublicKey(): Uint8Array {
        return this._publicKey.saveArray();
    }

    public serializeGaloisKey(): Uint8Array {
        return this._galoisKeys.saveArray();
    }

    public serializeRelinKeys(): Uint8Array {
        return this._relinKeys.saveArray();
    }

    public serializeCipherText(cipherText: CipherText): Uint8Array {
        return cipherText.saveArray();
    }

    public deserializeCipherText(serializedCipherText: Uint8Array): CipherText {
        const cipherText = this._seal.CipherText();
        cipherText.loadArray(this._context, serializedCipherText);
        return cipherText;
    }

    public arrayZipper(arrays: any[][]): {
        zippedData: any[][];
        chunkSize: number;
    } {
        const slotCount = this._encoder.slotCount;
        const chunkSize = Math.pow(2, Math.ceil(Math.log2(arrays.reduce((maxLen, array) => Math.max(maxLen, array.length), 0))));
        const sliceCount = Math.floor(slotCount / chunkSize);

        let arrayIndex = 0;
        return {
            zippedData: Array.from({ length: Math.ceil(arrays.length / sliceCount) }, () => {
                const newArray = new Array(slotCount).fill(0);

                for (let cnt = 0; cnt < sliceCount && arrayIndex < arrays.length; cnt++, arrayIndex++) {
                    const startIndex = cnt * chunkSize;
                    arrays[arrayIndex].forEach((value, index) => {
                        newArray[startIndex + index] = value;
                    });
                }

                return newArray;
            }),
            chunkSize: chunkSize
        };
    }

    public arrayUnZipper(arrays: any[][], chunkSize: number): any[][] {
        const slotCount = this._encoder.slotCount;
        const result: any[][] = [];
        const sliceCount = Math.floor(slotCount / chunkSize);

        arrays.forEach(array => {
            for (let cnt = 0; cnt < sliceCount; cnt++) {
                const startIndex = cnt * chunkSize;
                const chunk = array.slice(startIndex, startIndex + chunkSize);
                if (chunk.length > 0) {
                    result.push(chunk);
                }
            }
        });

        return result;
    }

    public createCipherText(): CipherText {
        return this._seal.CipherText();
    }

    public getSlotCount(): number {
        return this._encoder.slotCount;
    }

    public encrypt(array: number[]): CipherText {
        const plainText = this._seal.PlainText();
        const cipherText = this._seal.CipherText();
        this._encoder.encode(Float64Array.from(array), this._scale, plainText);
        this._encryptor.encrypt(plainText, cipherText);
        return cipherText;
    }

    public decrypt(cipherText: CipherText): number[] {
        const plainText = this._seal.PlainText();
        this._decryptor.decrypt(cipherText, plainText);
        const decoded = Array.from(this._encoder.decode(plainText));
        return decoded;
    }

    public rotate(cipherText: CipherText, step: number): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.rotateVector(cipherText, step, this._galoisKeys, result);
        return result;
    }

    public sumElements(cipherText: CipherText, steps?: number): CipherText {
        if (steps) {
            const result = cipherText.clone();
            const rotationCount = Math.ceil(Math.log2(steps));

            for (let cnt = 0, step = 1; cnt < rotationCount; cnt++, step *= 2) {
                this._evaluator.add(result, this.rotate(result, step), result);
            }
            return result;
        }
        else {
            const result = this._seal.CipherText();
            this._evaluator.sumElements(cipherText, this._galoisKeys, this._seal.SchemeType.ckks, result);
            return result;
        }
    }

    public parameterMatching(cipherText1: CipherText, cipherText2: CipherText) {
        if (cipherText1.coeffModulusSize !== cipherText2.coeffModulusSize) {
            if (cipherText1.coeffModulusSize > cipherText2.coeffModulusSize) {
                const temp = cipherText1;
                cipherText1 = cipherText2;
                cipherText2 = temp;
            }

            cipherText2 = cipherText2.clone();
            while (cipherText1.coeffModulusSize < cipherText2.coeffModulusSize) {
                this._evaluator.modReduceToNext(cipherText2, cipherText2);
            }
        }
        return [cipherText1, cipherText2];
    }

    public add(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        [cipherText1, cipherText2] = this.parameterMatching(cipherText1, cipherText2);
        const result = this._seal.CipherText();
        this._evaluator.add(cipherText1, cipherText2, result);
        return result;
    }

    public subtract(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        [cipherText1, cipherText2] = this.parameterMatching(cipherText1, cipherText2);
        const result = this._seal.CipherText();
        this._evaluator.sub(cipherText1, cipherText2, result);
        return result;
    }

    public multiply(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        [cipherText1, cipherText2] = this.parameterMatching(cipherText1, cipherText2);
        const result = this._seal.CipherText();
        this._evaluator.multiply(cipherText1, cipherText2, result);
        this._evaluator.relinearize(result, this._relinKeys, result);
        this._evaluator.rescaleToNext(result, result);
        result.setScale(this._scale);
        return result;
    }

    public negate(cipherText: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.negate(cipherText, result);
        return result;
    }
}