import { BatchEncoder } from 'node-seal/implementation/batch-encoder';
import { CipherText } from 'node-seal/implementation/cipher-text';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { GaloisKeys } from 'node-seal/implementation/galois-keys';
import { KeyGenerator } from 'node-seal/implementation/key-generator';
import { PublicKey } from 'node-seal/implementation/public-key';
import { RelinKeys } from 'node-seal/implementation/relin-keys';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SecretKey } from 'node-seal/implementation/secret-key';


export class BFVSealBuilder {
    private _polyModulusDegree: number;
    private _serializedPublicKey: any | null;

    constructor() {
        this._polyModulusDegree = 12;
        this._serializedPublicKey = null;
    }

    setPolyModulusDegree(polyModulusDegree: number): BFVSealBuilder {
        this._polyModulusDegree = polyModulusDegree;
        return this;
    }

    deserializePublicKey(serializedPublicKey: string): BFVSealBuilder {
        this._serializedPublicKey = serializedPublicKey;
        return this;
    }

    build(seal: SEALLibrary) {
        const schemeType = seal.SchemeType.bfv;
        const securityLevel = seal.SecurityLevel.tc128;
        const polyModulusDegree = Math.pow(2, this._polyModulusDegree);
        const coeffModulus = seal.CoeffModulus.BFVDefault(polyModulusDegree, securityLevel);
        const plainModulus = seal.PlainModulus.Batching(polyModulusDegree, this._polyModulusDegree < 15 ? 17 : 20);

        const contextParms = seal.EncryptionParameters(schemeType);
        contextParms.setPolyModulusDegree(polyModulusDegree);
        contextParms.setCoeffModulus(coeffModulus);
        contextParms.setPlainModulus(plainModulus);

        try {
            const context = seal.Context(contextParms, true, securityLevel);

            const keyGenerator = seal.KeyGenerator(context);
            const publicKey = keyGenerator.createPublicKey();
            this._serializedPublicKey && publicKey.load(context, this._serializedPublicKey);
            const secretKey = keyGenerator.secretKey();
            const relinKeys = keyGenerator.createRelinKeys();
            const galoisKey = keyGenerator.createGaloisKeys();

            const encryptor: Encryptor = seal.Encryptor(context, publicKey);
            const decryptor = seal.Decryptor(context, secretKey);
            const evaluator = seal.Evaluator(context);
            const encoder = seal.BatchEncoder(context);

            return new BFVSeal(seal, context, encoder, keyGenerator, publicKey, secretKey, galoisKey, relinKeys, encryptor, decryptor, evaluator);
        }
        catch (e) {
            throw e;
        }
    }
}


export class BFVSeal {
    private _seal: SEALLibrary;
    private _context: Context;
    private _encoder: BatchEncoder;
    private _keyGenerator: KeyGenerator;
    private _publicKey: PublicKey;
    private _secretKey: SecretKey;
    private _galoisKey: GaloisKeys;
    private _relinKeys: RelinKeys;
    private _encryptor: Encryptor;
    private _decryptor: Decryptor;
    private _evaluator: Evaluator;

    constructor(
        seal: SEALLibrary,
        context: Context,
        encoder: BatchEncoder,
        keyGenerator: KeyGenerator,
        publicKey: PublicKey,
        secretKey: SecretKey,
        galoisKey: GaloisKeys,
        relinKeys: RelinKeys,
        encryptor: Encryptor,
        decryptor: Decryptor,
        evaluator: Evaluator
    ) {
        this._seal = seal;
        this._context = context;
        this._encoder = encoder;
        this._keyGenerator = keyGenerator;
        this._publicKey = publicKey;
        this._secretKey = secretKey;
        this._galoisKey = galoisKey;
        this._relinKeys = relinKeys;
        this._encryptor = encryptor;
        this._decryptor = decryptor;
        this._evaluator = evaluator;
    }

    serializePublicKey() {
        return this._publicKey.save();
    }

    deserializeCipherText(serializedCipherText: string) {
        const cipherText = this._seal.CipherText();
        cipherText.load(this._context, serializedCipherText);
        return cipherText;
    }

    encrypt(array: number[]): CipherText {
        const plainText = this._seal.PlainText();
        const cipherText = this._seal.CipherText();
        this._encoder.encode(Int32Array.from(array), plainText);
        this._encryptor.encrypt(plainText, cipherText);
        return cipherText;
    }

    decrypt(cipherText: CipherText) {
        const plainText = this._seal.PlainText();
        this._decryptor!.decrypt(cipherText, plainText);
        const decoded = this._encoder.decode(plainText);
        return Array.from(decoded);
    }

    rotate(cipherText: CipherText, steps: number): CipherText {
        this._evaluator.rotateRows(cipherText, -steps, this._galoisKey, cipherText);
        return cipherText;
    }

    sum(cipherText: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.sumElements(cipherText, this._galoisKey, this._seal.SchemeType.bfv, result);
        return result;
    }

    add(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.add(cipherText1, cipherText2, result);
        return result;
    }

    subtract(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.sub(cipherText1, cipherText2, result);
        return result;
    }

    multiply(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this.encrypt([]);
        this._evaluator.multiply(cipherText1, cipherText2, result);
        this._evaluator.relinearize(result, this._relinKeys, result);
        return result;
    }

    negate(cipherText: CipherText): CipherText {
        const result = this._seal.CipherText();
        this._evaluator.negate(cipherText, result);
        return result;
    }
}