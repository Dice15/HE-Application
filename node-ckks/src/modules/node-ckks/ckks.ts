import { CipherText } from 'node-seal/implementation/cipher-text';
import { CKKSEncoder } from 'node-seal/implementation/ckks-encoder';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { GaloisKeys } from 'node-seal/implementation/galois-keys';
import { PlainText } from 'node-seal/implementation/plain-text';
import { PublicKey } from 'node-seal/implementation/public-key';
import { RelinKeys } from 'node-seal/implementation/relin-keys';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SecretKey } from 'node-seal/implementation/secret-key';
import { CKKSPlainText } from './ckks-plain-text';
import { CKKSCipherText } from './ckks-cipher-text';


type CleanupFunction = () => void;

type DeleteFunction = () => void;

abstract class AbstractCKKS {
    protected _seal: SEALLibrary;
    private _polyModulusDegree: number;
    private _scale: number;
    private _vectorSize: number;
    private _context: Context;
    private _encoder: CKKSEncoder;
    private _publicKey: PublicKey;
    private _relinKeys: RelinKeys;
    private _galoisKeys: GaloisKeys;
    private _encryptor: Encryptor;
    private _evaluator: Evaluator;
    private static _finalizationRegistry = new FinalizationRegistry((deleteFunction: DeleteFunction) => {
        deleteFunction();
    });


    constructor(
        seal: SEALLibrary,
        polyModulusDegree: number,
        scale: number,
        vectorSize: number,
        context: Context,
        encoder: CKKSEncoder,
        publicKey: PublicKey,
        relinKeys: RelinKeys,
        galoisKeys: GaloisKeys,
        encryptor: Encryptor,
        evaluator: Evaluator
    ) {
        this._seal = seal;
        this._polyModulusDegree = polyModulusDegree;
        this._scale = scale;
        this._vectorSize = vectorSize;
        this._context = context;
        this._encoder = encoder;
        this._publicKey = publicKey;
        this._relinKeys = relinKeys;
        this._galoisKeys = galoisKeys;
        this._encryptor = encryptor;
        this._evaluator = evaluator;
        AbstractCKKS._finalizationRegistry.register(this, this.delete.bind(this));
    }


    public serializePublicKey(): Uint8Array {
        return this._publicKey.saveArray();
    }


    public serializeRelinKeys(): Uint8Array {
        return this._relinKeys.saveArray();
    }


    public serializeGaloisKey(): Uint8Array {
        return this._galoisKeys.saveArray();
    }


    public serializeCipherText(cipherText: CipherText): Uint8Array {
        return cipherText.saveArray();
    }


    public deserializeCipherText(serializedCipherText: Uint8Array): CipherText {
        const cipherText = this._seal.CipherText();
        cipherText.loadArray(this._context, serializedCipherText);
        return cipherText;
    }


    public encode(vector: number[]): CKKSPlainText {
        const plainText = this._seal.PlainText();
        const adjustedVector = vector.slice(0, this._vectorSize);
        this._encoder.encode(Float64Array.from(adjustedVector), this._scale, plainText);
        return new CKKSPlainText([plainText], this._encoder.slotCount, 1, this._vectorSize);
    }


    public encodeMany(vectors: number[][]): CKKSPlainText {
        const plainSlotCount = this._encoder.slotCount;
        const realVectorSize = Math.pow(2, Math.ceil(Math.log2(this._vectorSize)));
        const maxVectorCount = Math.floor(plainSlotCount / realVectorSize);

        const plainTexts = [] as PlainText[];
        for (let i = 0; i < vectors.length; i += maxVectorCount) {
            const mergedVector = vectors.slice(i, i + maxVectorCount).flatMap((vector: number[]) => (realVectorSize < vector.length
                ? vector.slice(0, realVectorSize)
                : vector.concat(new Array(realVectorSize - vector.length).fill(0))
            ));

            const plainText = this._seal.PlainText();
            this._encoder.encode(Float64Array.from(mergedVector), this._scale, plainText);
            plainTexts.push(plainText);
        }

        return new CKKSPlainText(plainTexts, this._encoder.slotCount * plainTexts.length, vectors.length, this._vectorSize);
    }


    public decode(ckksPlain: CKKSPlainText): number[] {
        const plainText = ckksPlain.getPlainTextObjects()[0];
        const decoded = Array.from(this._encoder.decode(plainText));
        return decoded.slice(0, this._vectorSize);
    }


    public decodeMany(ckksPlain: CKKSPlainText): number[][] {
        const plainSlotCount = this._encoder.slotCount;
        const realVectorSize = Math.pow(2, Math.ceil(Math.log2(this._vectorSize)));
        const maxVectorCount = Math.floor(plainSlotCount / realVectorSize);

        return ckksPlain.getPlainTextObjects().flatMap((plainText) => {
            const decoded = Array.from(this._encoder.decode(plainText));
            return Array.from({ length: maxVectorCount }, (_, i) => decoded.slice(i * realVectorSize, this._vectorSize));
        });
    }


    public encrypt(vector: number[]): CKKSCipherText {
        const ckksPlain = this.encode(vector);

        return new CKKSCipherText(
            ckksPlain.getPlainTextObjects().map((plainText) => this._encryptor.encrypt(plainText)!),
            ckksPlain.getPlainSlotCount(),
            ckksPlain.getVectorCount(),
            ckksPlain.getVectorSize()
        );
    }


    public encryptMany(vectors: number[][]): CKKSCipherText {
        const ckksPlain = this.encodeMany(vectors);

        return new CKKSCipherText(
            ckksPlain.getPlainTextObjects().map((plainText) => this._encryptor.encrypt(plainText)!),
            ckksPlain.getPlainSlotCount(),
            ckksPlain.getVectorCount(),
            ckksPlain.getVectorSize()
        );
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


    public delete(): void {
        console.log(`delete${this._vectorSize}`);
        this._context.delete();
        this._encoder.delete();
        this._publicKey.delete();
        this._relinKeys.delete();
        this._galoisKeys.delete();
        this._encryptor.delete();
        this._evaluator.delete();
    }
}


export class SenderCKKS extends AbstractCKKS {
    private _secretKey: SecretKey;
    private _decryptor: Decryptor;


    constructor(
        seal: SEALLibrary,
        polyModulusDegree: number,
        scale: number,
        vectorSize: number,
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
        super(seal, polyModulusDegree, scale, vectorSize, context, encoder, publicKey, relinKeys, galoisKeys, encryptor, evaluator)
        this._secretKey = secretKey;
        this._decryptor = decryptor;
    }


    public serializeSecretKey(): Uint8Array {
        return this._secretKey.saveArray();
    }


    public decrypt(ckksCipher: CKKSCipherText): number[] {
        const ckksPlain = new CKKSPlainText(
            ckksCipher.getCipherTextObject().map((chiperText) => this._decryptor.decrypt(chiperText)!),
            ckksCipher.getPlainSlotCount(),
            ckksCipher.getVectorCount(),
            ckksCipher.getVectorSize()
        );

        return this.decode(ckksPlain);
    }


    public decryptMany(ckksCipher: CKKSCipherText): number[][] {
        const ckksPlain = new CKKSPlainText(
            ckksCipher.getCipherTextObject().map((chiperText) => this._decryptor.decrypt(chiperText)!),
            ckksCipher.getPlainSlotCount(),
            ckksCipher.getVectorCount(),
            ckksCipher.getVectorSize()
        );

        return this.decodeMany(ckksPlain);
    }


    public override delete(): void {
        super.delete();
        this._secretKey.delete();
        this._decryptor.delete();
    }
}


export class ReceiverCKKS extends AbstractCKKS {
    constructor(
        seal: SEALLibrary,
        polyModulusDegree: number,
        scale: number,
        vectorSize: number,
        context: Context,
        encoder: CKKSEncoder,
        publicKey: PublicKey,
        relinKeys: RelinKeys,
        galoisKeys: GaloisKeys,
        encryptor: Encryptor,
        evaluator: Evaluator
    ) {
        super(seal, polyModulusDegree, scale, vectorSize, context, encoder, publicKey, relinKeys, galoisKeys, encryptor, evaluator)
    }
}