import { CipherText } from 'node-seal/implementation/cipher-text';
import { CKKSEncoder } from 'node-seal/implementation/ckks-encoder';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { GaloisKeys } from 'node-seal/implementation/galois-keys';
import { KeyGenerator } from 'node-seal/implementation/key-generator';
import { PlainText } from 'node-seal/implementation/plain-text';
import { PublicKey } from 'node-seal/implementation/public-key';
import { RelinKeys } from 'node-seal/implementation/relin-keys';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SecretKey } from 'node-seal/implementation/secret-key';


export class CKKSSealBuilder {
    private _seal: SEALLibrary;
    private _scale: number;
    private _context: Context;
    private _keyGenerator: KeyGenerator;
    private _secretKey: SecretKey | null;
    private _publicKey: PublicKey;
    private _relinKeys: RelinKeys;
    private _galoisKeys: GaloisKeys;

    constructor(seal: SEALLibrary, securityLevel: any, polyModulusDegree: number, bitSizes: number[], scale: number) {
        if (bitSizes.length === 0) {
            throw new Error("BitSizes array is empty.");
        }
        else {
            const totalBitSize = bitSizes.reduce((sum, bitSize) => sum + bitSize, 0);
            const maxBitCount = seal.CoeffModulus.MaxBitCount(polyModulusDegree, securityLevel);

            if (totalBitSize > maxBitCount) {
                throw new Error(`BitSizes has been over CoeffModulus's MaxBitCount(${maxBitCount}).`);
            }
            else {
                const schemeType = seal.SchemeType.ckks;
                const coeffModulus = seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes));
                const contextParms = seal.EncryptionParameters(schemeType);
                contextParms.setPolyModulusDegree(polyModulusDegree);
                contextParms.setCoeffModulus(coeffModulus);
                const context = seal.Context(contextParms, true, securityLevel);
                const keyGenerator = seal.KeyGenerator(context);

                this._seal = seal;
                this._scale = scale;
                this._context = context;
                this._keyGenerator = keyGenerator;
                this._secretKey = null;
                this._publicKey = seal.PublicKey();
                this._relinKeys = seal.RelinKeys();
                this._galoisKeys = seal.GaloisKeys();

                coeffModulus.delete();
                contextParms.delete();
            }
        }
    }

    public createSecretKey() {
        this._secretKey = this._keyGenerator.secretKey();
        return this;
    }

    public createPublicKey() {
        this._publicKey = this._keyGenerator.createPublicKey();
        return this;
    }

    public createRelinKeys() {
        this._relinKeys = this._keyGenerator.createRelinKeys();
        return this;
    }

    public createGaloisKeys(rotationSteps?: number[]) {
        this._galoisKeys = this._keyGenerator.createGaloisKeys(rotationSteps && Int32Array.from(rotationSteps));
        return this;
    }

    public loadPublicKey(serializedPublicKey: Uint8Array) {
        console.log('loadPublicKey', serializedPublicKey.length);
        this._publicKey.loadArray(this._context, serializedPublicKey);
        return this;
    }

    public loadRelinKeys(serializedRelinKeys: Uint8Array) {
        console.log('loadRelinKeys', serializedRelinKeys.length);
        this._relinKeys.loadArray(this._context, serializedRelinKeys);
        return this;
    }

    public loadGaloisKeys(serializedGaloisKeys: Uint8Array) {
        console.log('loadGaloisKeys', serializedGaloisKeys.length);
        this._galoisKeys.loadArray(this._context, serializedGaloisKeys);
        return this;
    }

    build() {
        try {
            const encryptor = this._seal.Encryptor(this._context, this._publicKey);
            const decryptor = this._secretKey ? this._seal.Decryptor(this._context, this._secretKey) : null;
            const evaluator = this._seal.Evaluator(this._context);
            const encoder = this._seal.CKKSEncoder(this._context);
            this._keyGenerator.delete();

            return new CKKSSeal(this._seal, this._scale, this._context, encoder, this._publicKey, this._relinKeys, this._galoisKeys, encryptor, decryptor, evaluator);
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
    private _publicKey: PublicKey;
    private _relinKeys: RelinKeys;
    private _galoisKeys: GaloisKeys;
    private _encryptor: Encryptor;
    private _decryptor: Decryptor | null;
    private _evaluator: Evaluator;

    constructor(
        seal: SEALLibrary,
        scale: number,
        context: Context,
        encoder: CKKSEncoder,
        publicKey: PublicKey,
        relinKeys: RelinKeys,
        galoisKeys: GaloisKeys,
        encryptor: Encryptor,
        decryptor: Decryptor | null,
        evaluator: Evaluator
    ) {
        this._seal = seal;
        this._scale = scale;
        this._context = context;
        this._encoder = encoder;
        this._publicKey = publicKey;
        this._relinKeys = relinKeys;
        this._galoisKeys = galoisKeys;
        this._encryptor = encryptor;
        this._decryptor = decryptor;
        this._evaluator = evaluator;
    }

    public delete(): void {
        try {
            this._context.delete();
            this._encoder.delete();
            this._publicKey.delete();
            this._relinKeys.delete();
            this._galoisKeys.delete();
            this._encryptor.delete();
            this._decryptor?.delete();
            this._evaluator.delete();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
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

    public encode(array: number[]): PlainText {
        const plainText = this._seal.PlainText();
        this._encoder.encode(Float64Array.from(array), this._scale, plainText);
        return plainText;
    }

    public decode(plainText: PlainText): number[] {
        const decoded = Array.from(this._encoder.decode(plainText));
        return decoded;
    }

    public encrypt(array: number[]): CipherText {
        const plainText = this._seal.PlainText();
        const cipherText = this._seal.CipherText();

        this._encoder.encode(Float64Array.from(array), this._scale, plainText);
        this._encryptor.encrypt(plainText, cipherText);

        plainText.delete();

        return cipherText;
    }

    public encryptPlain(plainText: PlainText): CipherText {
        const cipherText = this._seal.CipherText();
        this._encryptor.encrypt(plainText, cipherText);
        return cipherText;
    }

    public decrypt(cipherText: CipherText): number[] {
        if (this._decryptor === null) throw new Error("Decryptor is null");
        const plainText = this._seal.PlainText();

        this._decryptor.decrypt(cipherText, plainText);
        const decoded = Array.from(this._encoder.decode(plainText));

        plainText.delete();

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
            const rotated = this._seal.CipherText();
            const rotationCount = Math.ceil(Math.log2(steps));

            for (let cnt = 0, step = 1; cnt < rotationCount; cnt++, step *= 2) {
                this._evaluator.rotateVector(result, step, this._galoisKeys, rotated);
                this._evaluator.add(result, rotated, result);
            }

            rotated.delete();

            return result;
        }
        else {
            const result = this._seal.CipherText();
            this._evaluator.sumElements(cipherText, this._galoisKeys, this._seal.SchemeType.ckks, result);
            return result;
        }
    }

    private cipherParamsMatching(cipherText1: CipherText, cipherText2: CipherText): void {
        const paramsCmp = cipherText1.coeffModulusSize - cipherText2.coeffModulusSize;

        if (paramsCmp !== 0) {
            if (paramsCmp > 0) {
                this._evaluator.cipherModSwitchTo(cipherText1, cipherText2.parmsId, cipherText1);
            }
            else {
                this._evaluator.cipherModSwitchTo(cipherText2, cipherText1.parmsId, cipherText2);
            }
        }
    }

    private plainParamsMatching(cipherText: CipherText, plainText: PlainText): void {
        this._evaluator.plainModSwitchTo(plainText, cipherText.parmsId, plainText);
    }

    public add(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const cipher1 = cipherText1.clone();
        const cipher2 = cipherText2.clone();

        this.cipherParamsMatching(cipher1, cipher2);
        this._evaluator.add(cipher1, cipher2, cipher1);

        cipher2.delete();

        return cipher1;
    }

    public addPlain(cipherText: CipherText, plainText: PlainText): CipherText {
        const cipher = cipherText.clone();
        const plain = plainText.clone();

        this.plainParamsMatching(cipher, plain);
        this._evaluator.addPlain(cipher, plain, cipher);

        plain.delete();

        return cipher;
    }

    public sub(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const cipher1 = cipherText1.clone();
        const cipher2 = cipherText2.clone();

        this.cipherParamsMatching(cipher1, cipher2);
        this._evaluator.sub(cipher1, cipher2, cipher1);

        cipher2.delete();

        return cipher1;
    }

    public subPlain(cipherText: CipherText, plainText: PlainText): CipherText {
        const cipher = cipherText.clone();
        const plain = plainText.clone();

        this.plainParamsMatching(cipher, plain);
        this._evaluator.subPlain(cipher, plain, cipher);

        plain.delete();

        return cipher;
    }

    public multiply(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const cipher1 = cipherText1.clone();
        const cipher2 = cipherText2.clone();

        this.cipherParamsMatching(cipher1, cipher2);
        this._evaluator.multiply(cipher1, cipher2, cipher1);
        this._evaluator.relinearize(cipher1, this._relinKeys, cipher1);

        if (cipher1.coeffModulusSize > 1) {
            this._evaluator.rescaleToNext(cipher1, cipher1);
            cipher1.setScale(this._scale);
        }

        cipher2.delete();

        return cipher1;
    }

    public multiplyPlain(cipherText: CipherText, plainText: PlainText): CipherText {
        const cipher = cipherText.clone();
        const plain = plainText.clone();

        this.plainParamsMatching(cipher, plain);
        this._evaluator.multiplyPlain(cipher, plain, cipher);
        this._evaluator.relinearize(cipher, this._relinKeys, cipher);

        if (cipher.coeffModulusSize > 1) {
            this._evaluator.rescaleToNext(cipher, cipher);
            cipher.setScale(this._scale);
        }

        plain.delete();

        return cipher;
    }

    public negate(cipherText: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.negate(cipherText, result);
        return result;
    }
}