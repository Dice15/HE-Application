"use client"

import SEAL from 'node-seal'
import { BatchEncoder } from 'node-seal/implementation/batch-encoder';
import { CipherText } from 'node-seal/implementation/cipher-text';
import { Context } from 'node-seal/implementation/context';
import { Decryptor } from 'node-seal/implementation/decryptor';
import { Encryptor } from 'node-seal/implementation/encryptor';
import { Evaluator } from 'node-seal/implementation/evaluator';
import { KeyGenerator } from 'node-seal/implementation/key-generator';
import { PublicKey } from 'node-seal/implementation/public-key';
import { SEALLibrary } from 'node-seal/implementation/seal';
import { SecretKey } from 'node-seal/implementation/secret-key';
import { useEffect, useState } from 'react';

class BFVSealBuilder {
    private _polyModulusDegree: number;

    constructor() {
        this._polyModulusDegree = 13;
    }

    polyModulusDegree(polyModulusDegree: 12 | 13 | 14 | 15): BFVSealBuilder {
        this._polyModulusDegree = polyModulusDegree;
        return this;
    }

    async build() {
        const seal = await SEAL();
        const schemeType = seal.SchemeType.bfv;
        const securityLevel = seal.SecurityLevel.tc128;
        const polyModulusDegree = 1 << this._polyModulusDegree;
        const coeffModulus = seal.CoeffModulus.BFVDefault(polyModulusDegree, securityLevel);
        const plainModulus = seal.PlainModulus.Batching(polyModulusDegree, {
            12: 15,
            13: 17,
            14: 18,
            15: 20
        }[this._polyModulusDegree]!);

        const parms = seal.EncryptionParameters(schemeType);
        parms.setPolyModulusDegree(polyModulusDegree);
        parms.setCoeffModulus(coeffModulus);
        parms.setPlainModulus(plainModulus);

        try {
            const context = seal.Context(parms, true, securityLevel);
            const keyGenerator = seal.KeyGenerator(context);
            const publicKey = keyGenerator.createPublicKey();
            const secretKey = keyGenerator.secretKey();
            const encryptor = seal.Encryptor(context, publicKey);
            const decryptor = seal.Decryptor(context, secretKey);
            const evaluator = seal.Evaluator(context);
            const encoder = seal.BatchEncoder(context);

            return new BFVSeal(seal, context, encoder, keyGenerator, publicKey, secretKey, encryptor, decryptor, evaluator);
        }
        catch (e) {
            console.log(e);
        }
    }
}


class BFVSeal {
    private seal: SEALLibrary;
    private context: Context;
    private encoder: BatchEncoder;
    private keyGenerator: KeyGenerator;
    private publicKey: PublicKey;
    private secretKey: SecretKey;
    private encryptor: Encryptor;
    private decryptor: Decryptor;
    private evaluator: Evaluator;

    constructor(
        seal: SEALLibrary,
        context: Context,
        encoder: BatchEncoder,
        keyGenerator: KeyGenerator,
        publicKey: PublicKey,
        secretKey: SecretKey,
        encryptor: Encryptor,
        decryptor: Decryptor,
        evaluator: Evaluator
    ) {
        this.seal = seal;
        this.context = context;
        this.encoder = encoder;
        this.keyGenerator = keyGenerator;
        this.publicKey = publicKey;
        this.secretKey = secretKey;
        this.encryptor = encryptor;
        this.decryptor = decryptor;
        this.evaluator = evaluator;
    }

    encrypt(array: number[]): CipherText {
        const plainText = this.seal.PlainText();
        const cipherText = this.seal.CipherText();
        this.encoder.encode(Int32Array.from(array), plainText);
        this.encryptor.encrypt(plainText, cipherText);
        return cipherText;
    }

    decrypt(cipherText: CipherText): number[] {
        const plainText = this.seal.PlainText();
        this.decryptor.decrypt(cipherText, plainText);
        const decoded = this.encoder.decode(plainText);
        return Array.from(decoded);
    }

    add(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this.seal.CipherText();
        this.evaluator.add(cipherText1, cipherText2, result);
        return result;
    }

    subtract(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this.seal.CipherText();
        this.evaluator.sub(cipherText1, cipherText2, result);
        return result;
    }

    multiply(cipherText1: CipherText, cipherText2: CipherText): CipherText {
        const result = this.seal.CipherText();
        this.evaluator.multiply(cipherText1, cipherText2, result);
        return result;
    }

    negate(cipherText: CipherText): CipherText {
        const result = this.seal.CipherText();
        this.evaluator.negate(cipherText, result);
        return result;
    }
}



export default function Test() {
    const [seal, setSeal] = useState<BFVSeal>();

    useEffect(() => {
        (async () => {
            try {
                const builtSeal = await new BFVSealBuilder().build();
                setSeal(builtSeal);
            } catch (error) {
                console.error("An error occurred:", error);
            }
        })();
    }, []);


    useEffect(() => {
        if (seal) {
            let cArray0 = seal.encrypt(Array.from({ length: 10 }, () => 0));
            let cArray1 = seal.encrypt(Array.from({ length: 10 }, () => 1));
            let cArray2 = seal.encrypt(Array.from({ length: 10 }, () => 2));
            let cArray3 = seal.encrypt(Array.from({ length: 10 }, () => 4));

            // for (let i = 1; i <= 20; i++) {
            //     cArray1 = seal.multiply(cArray1, cArray2);
            //     console.log(seal.decrypt(cArray1));
            // }

            for (let i = 1; i <= 1000; i++) {
                cArray0 = seal.add(cArray0, cArray1);
                if (i % 100 === 0) {
                    console.log(seal.decrypt(cArray0));
                }
            }
        }
    }, [seal]);

    return <>
    </>
}



