import { CKKSEncoder } from "node-seal/implementation/ckks-encoder";
import { Context } from "node-seal/implementation/context";
import { Decryptor } from "node-seal/implementation/decryptor";
import { Encryptor } from "node-seal/implementation/encryptor";
import { Evaluator } from "node-seal/implementation/evaluator";
import { GaloisKeys } from "node-seal/implementation/galois-keys";
import { PublicKey } from "node-seal/implementation/public-key";
import { PlainText } from "node-seal/implementation/plain-text";
import { RelinKeys } from "node-seal/implementation/relin-keys";
import { SEALLibrary } from "node-seal/implementation/seal";
import { SecretKey } from "node-seal/implementation/secret-key";
import { AbstractDisposable } from "./abstract-disposable";
import { CKKSCipherText, CKKSCipherTextStorageFormat } from "./ckks-cipher-text";
import { CKKSPlainText, CKKSPlainTextStorageFormat } from "./ckks-plain-text";
import { CKKSOptions } from "./ckks-provider";


export type CKKSLibraryParams = {
    readonly seal: SEALLibrary;
    readonly options: CKKSOptions;
    readonly context: Context;
    readonly secretKey?: SecretKey;
    readonly publicKey?: PublicKey;
    readonly relinKeys?: RelinKeys;
    readonly galoisKeys?: GaloisKeys;
}


export class CKKSLibrary extends AbstractDisposable {
    private _seal: SEALLibrary;
    private _options: CKKSOptions;
    private _context: Context;
    private _secretKey?: SecretKey;
    private _publicKey?: PublicKey;
    private _relinKeys?: RelinKeys;
    private _galoisKeys?: GaloisKeys;
    private _encoder: CKKSEncoder;
    private _evaluator: Evaluator;
    private _encryptor?: Encryptor;
    private _decryptor?: Decryptor;


    public constructor({ seal, options, context, secretKey, publicKey, relinKeys, galoisKeys }: CKKSLibraryParams) {
        try {
            super();
            this._seal = seal;
            this._options = options;
            this._context = context;
            this._secretKey = secretKey;
            this._publicKey = publicKey;
            this._relinKeys = relinKeys;
            this._galoisKeys = galoisKeys;
            this._encoder = seal.CKKSEncoder(context);
            this._evaluator = seal.Evaluator(context);
            this._encryptor = publicKey && seal.Encryptor(context, publicKey);
            this._decryptor = secretKey && seal.Decryptor(context, secretKey);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public override deleteResources(): void {
        try {
            this.assertNotDisposed();

            this._context.delete();
            this._secretKey?.delete();
            this._publicKey?.delete();
            this._relinKeys?.delete();
            this._galoisKeys?.delete();
            this._encoder.delete();
            this._evaluator.delete();
            this._encryptor?.delete();
            this._decryptor?.delete();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public serializeSecretKey(): string {
        try {
            this.assertNotDisposed();

            if (!this._secretKey) {
                throw new Error('No secret key was generated.');
            }

            return this._secretKey.save();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public serializePublicKey(): string {
        try {
            this.assertNotDisposed();

            if (!this._publicKey) {
                throw new Error('No public key was generated.');
            }

            return this._publicKey.save();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public serializeRelinKeys(): string {
        try {
            this.assertNotDisposed();

            if (!this._relinKeys) {
                throw new Error('No relin keys were generated.');
            }

            return this._relinKeys.save();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public serializeGaloisKey(): string {
        try {
            this.assertNotDisposed();

            if (!this._galoisKeys) {
                throw new Error('No galois keys were generated.');
            }

            return this._galoisKeys.save();
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public createCKKSPlain(serializedCKKSPlain?: string): CKKSPlainText {
        try {
            this.assertNotDisposed();

            if (serializedCKKSPlain) {
                const parsed = JSON.parse(serializedCKKSPlain) as CKKSPlainTextStorageFormat;

                return new CKKSPlainText({
                    plains: parsed.serializedPlains.map((serializedPlain: string) => {
                        const plain = this._seal.PlainText();
                        plain.load(this._context, serializedPlain);
                        return plain;
                    }),
                    dataCount: parsed.dataCount,
                    options: parsed.options
                });
            } else {
                return new CKKSPlainText();
            }
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public createCKKSCipher(serializedCKKSCipher?: string): CKKSCipherText {
        try {
            this.assertNotDisposed();

            if (serializedCKKSCipher) {
                const parsed = JSON.parse(serializedCKKSCipher) as CKKSCipherTextStorageFormat;

                return new CKKSCipherText({
                    ciphers: parsed.serializedCiphers.map((serializedCipher: string) => {
                        const cipher = this._seal.CipherText();
                        cipher.load(this._context, serializedCipher);
                        return cipher;
                    }),
                    dataCount: parsed.dataCount,
                    options: parsed.options
                });
            } else {
                return new CKKSCipherText();
            }
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public encode(data: number[]): CKKSPlainText {
        try {
            this.assertNotDisposed();

            const adjustedDataLength = Math.pow(2, Math.ceil(Math.log2(this._options.dataLength)));
            const adjustedData = adjustedDataLength < data.length
                ? data.slice(0, adjustedDataLength)
                : data.concat(new Array(adjustedDataLength - data.length).fill(0));

            const plain = this._seal.PlainText();
            this._encoder.encode(Float64Array.from(adjustedData), this._options.scale, plain);

            return new CKKSPlainText({
                plains: [plain],
                dataCount: 1,
                options: this._options
            });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public encodeMany(vectors: number[][]): CKKSPlainText {
        try {
            this.assertNotDisposed();

            const plainSlotCount = this._encoder.slotCount;
            const realVectorSize = Math.pow(2, Math.ceil(Math.log2(this._vectorSize)));
            const maxVectorCount = Math.floor(plainSlotCount / realVectorSize);

            const plains: PlainText[] = [];
            for (let i = 0; i < vectors.length; i += maxVectorCount) {
                const mergedVector = vectors.slice(i, i + maxVectorCount).flatMap((vector: number[]) => {
                    return realVectorSize < vector.length
                        ? vector.slice(0, realVectorSize)
                        : vector.concat(new Array(realVectorSize - vector.length).fill(0));
                });

                const plain = this._seal.PlainText();
                this._encoder.encode(Float64Array.from(mergedVector), this._scale, plain);
                plains.push(plain);
            }

            return new CKKSPlainText({
                plains: plains,
                dataCount: vectors.length,
                options: this._vectorSize
            });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * vectorSize는 미리 설정하지 않도록 수정
     * 
     * encodeMany, encryptMany 할 때, vectorSize가 모두 같지 않다면 에러 throw
     * 
     * decode, decrypt, decodeMany, decryptMany 할 때, vector를 flatMap으로 복원 하고 vectorSize 단위로 잘라서 리턴
     * decode, decrypt, decodeMany, decryptMany 할 때, CKKSOption이 같지 않다면 에러 throw
     * CKKSPlainText, CKKSChiperText에는 CKKSOptions가 필드로 가지고 있어야 함
     */

    public decode(ckksPlain: CKKSPlainText): number[] {
        try {
            this.assertNotDisposed();

            const vector = ckksPlain.getPlains().flatMap((plain) => Array.from(this._encoder.decode(plain)));

            if (vector.length < 1) {
                throw new Error('CKKSPlainText is empty.');
            }

            return Array.from(this._encoder.decode(plains[0])).slice(0, this._vectorSize);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public decodeMany(ckksPlain: CKKSPlainText): number[][] {
        try {
            this.assertNotDisposed();
            const plainSlotCount = this._encoder.slotCount;
            const realVectorSize = Math.pow(2, Math.ceil(Math.log2(this._vectorSize)));
            const maxVectorCount = Math.floor(plainSlotCount / realVectorSize);

            const plainTexts = ckksPlain.getPlains();
            const vectorCount = ckksPlain.getDataCount();

            if (plainTexts.length < 1 || vectorCount < 1) {
                throw new Error('CKKSPlainText is empty.');
            }

            if (plainTexts.length != Math.ceil((realVectorSize * vectorCount) / plainSlotCount)) {
                throw new Error('Mismatch between the number of slots in CKKSPlainText and the number of vectors.');
            }

            return plainTexts.flatMap((plainText) => {
                const decoded = Array.from(this._encoder.decode(plainText));
                return Array.from({ length: maxVectorCount }, (_, i) => decoded.slice(i * realVectorSize, this._vectorSize));
            });
        }
        catch (error) {
            throw new Error(`Failed to decode CKKSPlainText. ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    public encrypt(vector: number[]): CKKSCipherText {
        try {
            this.assertNotDisposed();

            if (!this._encryptor) {
                throw new Error('No public key was generated.');
            }

            const plainText = this._seal.PlainText();
            const cipherText = this._seal.CipherText();
            const adjustedVector = vector.slice(0, this._vectorSize);

            this._encoder.encode(Float64Array.from(adjustedVector), this._scale, plainText);
            this._encryptor.encrypt(plainText, cipherText);
            plainText.delete();

            return new CKKSCipherText([cipherText], 1, this._vectorSize);
        }
        catch (error) {
            throw new Error(`Failed to encrypt vector. ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    public encryptMany(vectors: number[][]): CKKSCipherText {
        try {
            this.assertNotDisposed();

            if (!this._encryptor) {
                throw new Error('No public key was generated.');
            }

            const ckksPlain = this.encodeMany(vectors);

            return new CKKSCipherText(
                ckksPlain.getPlains().map((plain) => this._encryptor.encrypt(plain)!),
                ckksPlain.getDataCount(),
                ckksPlain.getVectorSize()
            );
        }
        catch (error) {
            throw new Error(`Failed to encrypt vectors. ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    private cipherParamsMatching(cipherText1: CipherText, cipherText2: CipherText): [CipherText, CipherText, CleanupFunction?] {
        const paramsCmp = cipherText1.coeffModulusSize - cipherText2.coeffModulusSize;

        if (paramsCmp === 0) {
            return [cipherText1, cipherText2];
        }
        else {
            const switchedCipherText = this._seal.CipherText();
            const cleanupFunction = () => { switchedCipherText.delete(); };

            if (paramsCmp > 0) {
                this._evaluator.cipherModSwitchTo(cipherText1, cipherText2.parmsId, switchedCipherText);
                return [switchedCipherText, cipherText2, cleanupFunction];
            }
            else {
                this._evaluator.cipherModSwitchTo(cipherText2, cipherText1.parmsId, switchedCipherText);
                return [cipherText1, switchedCipherText, cleanupFunction];
            }
        }
    }


    private plainParamsMatching(cipherText: CipherText, plainText: PlainText): [CipherText, PlainText, CleanupFunction?] {
        const paramsCmp = plainText.parmsId.values[0] - cipherText.parmsId.values[0];

        if (paramsCmp === BigInt(0)) {
            return [cipherText, plainText];
        }
        else {
            if (paramsCmp > BigInt(0)) {
                const switchedCipherText = this._evaluator.cipherModSwitchTo(cipherText, plainText.parmsId)!;
                const cleanupFunction = () => { switchedCipherText.delete(); };
                return [switchedCipherText, plainText, cleanupFunction];
            }
            else {
                const switchedPlainText = this._evaluator.plainModSwitchTo(plainText, cipherText.parmsId)!;
                const cleanupFunction = () => { switchedPlainText.delete(); };
                return [cipherText, switchedPlainText, cleanupFunction];
            }
        }
    }


    private plainScaleMatching(cipherText: CipherText, plainText: PlainText): [CipherText, PlainText, CleanupFunction?] {
        if (cipherText.scale === plainText.scale) {
            return [cipherText, plainText];
        }
        else {
            const scaledPlainText = this._encoder.encode(this._encoder.decode(plainText), cipherText.scale)!;
            const cleanupFunction = () => { scaledPlainText.delete(); };
            return [cipherText, scaledPlainText, cleanupFunction];
        }
    }


    public add(cipherText1: CipherText, cipherText2: CipherText, afterDelete?: { deleteCipherText1?: boolean, deleteCipherText2?: boolean }): CipherText {
        const [paramsMatchedCipher1, paramsMatchedCipher2, paramsCleanupFunction] = this.cipherParamsMatching(cipherText1, cipherText2);

        const result = this._seal.CipherText();
        this._evaluator.add(paramsMatchedCipher1, paramsMatchedCipher2, result)

        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText1) cipherText1.delete();
        if (afterDelete?.deleteCipherText2) cipherText2.delete();

        return result;
    }


    public addPlain(cipherText: CipherText, plainText: PlainText, afterDelete?: { deleteCipherText?: boolean, deletePlainText?: boolean }): CipherText {
        const [scaleMatchedCipher, scaleMatchedPlain, scaleCleanupFunction] = this.plainScaleMatching(cipherText, plainText);
        const [paramsMatchedCipher, paramsMatchedPlain, paramsCleanupFunction] = this.plainParamsMatching(scaleMatchedCipher, scaleMatchedPlain);

        const result = this._seal.CipherText();
        this._evaluator.addPlain(paramsMatchedCipher, paramsMatchedPlain, result);

        if (scaleCleanupFunction) scaleCleanupFunction();
        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText) cipherText.delete();
        if (afterDelete?.deletePlainText) plainText.delete();

        return result;
    }


    public sub(cipherText1: CipherText, cipherText2: CipherText, afterDelete?: { deleteCipherText1?: boolean, deleteCipherText2?: boolean }): CipherText {
        const [paramsMatchedCipher1, paramsMatchedCipher2, paramsCleanupFunction] = this.cipherParamsMatching(cipherText1, cipherText2);

        const result = this._seal.CipherText();
        this._evaluator.sub(paramsMatchedCipher1, paramsMatchedCipher2, result)

        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText1) cipherText1.delete();
        if (afterDelete?.deleteCipherText2) cipherText2.delete();

        return result;
    }


    public subPlain(cipherText: CipherText, plainText: PlainText, afterDelete?: { deleteCipherText?: boolean, deletePlainText?: boolean }): CipherText {
        const [scaleMatchedCipher, scaleMatchedPlain, scaleCleanupFunction] = this.plainScaleMatching(cipherText, plainText);
        const [paramsMatchedCipher, paramsMatchedPlain, paramsCleanupFunction] = this.plainParamsMatching(scaleMatchedCipher, scaleMatchedPlain);

        const result = this._seal.CipherText();
        this._evaluator.subPlain(paramsMatchedCipher, paramsMatchedPlain, result);

        if (scaleCleanupFunction) scaleCleanupFunction();
        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText) cipherText.delete();
        if (afterDelete?.deletePlainText) plainText.delete();

        return result;
    }


    public multiply(cipherText1: CipherText, cipherText2: CipherText, afterDelete?: { deleteCipherText1?: boolean, deleteCipherText2?: boolean }): CipherText {
        const [paramsMatchedCipher1, paramsMatchedCipher2, paramsCleanupFunction] = this.cipherParamsMatching(cipherText1, cipherText2);

        const result = this._seal.CipherText();
        this._evaluator.multiply(paramsMatchedCipher1, paramsMatchedCipher2, result);
        this._evaluator.relinearize(result, this._relinKeys, result);

        if (result.coeffModulusSize > 1) {
            this._evaluator.rescaleToNext(result, result);
            result.setScale(this._scale)
        }

        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText1) cipherText1.delete();
        if (afterDelete?.deleteCipherText2) cipherText2.delete();

        return result;
    }


    public multiplyPlain(cipherText: CipherText, plainText: PlainText, afterDelete?: { deleteCipherText?: boolean, deletePlainText?: boolean }): CipherText {
        const [scaleMatchedCipher, scaleMatchedPlain, scaleCleanupFunction] = this.plainScaleMatching(cipherText, plainText);
        const [paramsMatchedCipher, paramsMatchedPlain, paramsCleanupFunction] = this.plainParamsMatching(scaleMatchedCipher, scaleMatchedPlain);

        const result = this._seal.CipherText();
        this._evaluator.multiplyPlain(paramsMatchedCipher, paramsMatchedPlain, result);
        this._evaluator.relinearize(result, this._relinKeys, result);

        if (result.coeffModulusSize > 1) {
            this._evaluator.rescaleToNext(result, result);
            result.setScale(this._scale)
        }

        if (scaleCleanupFunction) scaleCleanupFunction();
        if (paramsCleanupFunction) paramsCleanupFunction();
        if (afterDelete?.deleteCipherText) cipherText.delete();
        if (afterDelete?.deletePlainText) plainText.delete();

        return result;
    }


    public negate(cipherText: CipherText, afterDelete?: { deleteCipherText?: boolean }): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.negate(cipherText, result);

        if (afterDelete?.deleteCipherText) cipherText.delete();

        return result;
    }


    public rotate(cipherText: CipherText, steps: number, afterDelete?: { deleteCipherText?: boolean }): CipherText {
        if (this._vectorSize <= steps) {
            throw new Error(
                `The specified rotation step (${steps}) exceeds the maximum allowable step for the configured vector size (${this._vectorSize}). ` +
                `The rotation step must be less than the vector size. Please provide a step value in the range of 0 to ${this._vectorSize - 1}.`
            );
        }

        const result = cipherText.clone();
        const shiftCount = this._polyModulusDegree < 32768 ? 1 : 3;

        for (let currSteps = 1 << (Math.floor(Math.log2(steps) / shiftCount) * shiftCount); steps > 0 && currSteps > 0;) {
            if (steps >= currSteps) {
                this._evaluator.rotateVector(result, currSteps, this._galoisKeys, result);
                steps -= currSteps;
            }
            else {
                currSteps >>= shiftCount;
            }
        }

        if (afterDelete?.deleteCipherText) cipherText.delete();

        return result;
    }


    public sumElements(cipherText: CipherText, afterDelete?: { deleteCipherText?: boolean }): CipherText {
        const result = cipherText.clone();
        const rotated = this._seal.CipherText();

        if (this._polyModulusDegree < 32768) {
            for (let steps = 1 << (Math.ceil(Math.log2(this._vectorSize)) - 1); steps > 0; steps >>= 1) {
                this._evaluator.rotateVector(result, steps, this._galoisKeys, rotated);
                this._evaluator.add(result, rotated, result);
            }

        }
        else {
            for (let steps = 1 << (Math.ceil(Math.log2(this._vectorSize)) - 1), shiftCount = 3; steps > 0; steps >>= 1) {
                rotated.copy(result);

                for (let remainSteps = steps, currSteps = 1 << (Math.floor(Math.log2(steps) / shiftCount) * shiftCount); remainSteps > 0 && currSteps > 0;) {
                    if (remainSteps >= currSteps) {
                        this._evaluator.rotateVector(rotated, currSteps, this._galoisKeys, rotated);
                        remainSteps -= currSteps;
                    }
                    else {
                        currSteps >>= shiftCount;
                    }
                }

                this._evaluator.add(result, rotated, result);
            }
        }

        rotated.delete();
        if (afterDelete?.deleteCipherText) cipherText.delete();

        return result;
    }
}