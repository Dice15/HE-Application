import { ReceiverCKKS, SenderCKKS } from "./ckks";
import { ReceiverCKKSBuilder, SenderCKKSBuilder } from "./ckks-builder";



type FloatPrecisionType = 'lower' | 'low' | 'medium' | 'high' | 'higher';



type MaxMultiplyCountType<F extends FloatPrecisionType> =
    F extends 'lower' ? '1'
    : F extends 'low' ? '3'
    : F extends 'medium' ? '1' | '5' | '12' | '16'
    : F extends 'high' ? '3' | '8' | '12'
    : F extends 'higher' ? '2' | '6' | '10'
    : never;



abstract class AbstractCKKSBuilderAuto<T extends AbstractCKKSBuilderAuto<T, F, M>, F extends FloatPrecisionType, M extends MaxMultiplyCountType<F>> {
    protected _vectorSize: number | "default";
    protected _floatPrecision: F;
    protected _maxMultiplyCount: M;


    constructor(floatPrecision: F, maxMultiplyCount: M) {
        this._vectorSize = "default";
        this._floatPrecision = floatPrecision;
        this._maxMultiplyCount = maxMultiplyCount;
    }


    public setVectorSize(vectorSize: number | "default"): T {
        if (typeof vectorSize === "number" && vectorSize < 1) {
            throw new Error(`The vector size must be at least 1. Received: ${vectorSize}.`);
        }
        this._vectorSize = vectorSize;
        return this.getThis();
    }


    protected configCKKSBuilder(CKKSBuilder: SenderCKKSBuilder | ReceiverCKKSBuilder): void {
        switch (this._floatPrecision) {
            case "lower": {
                CKKSBuilder
                    .setPolyModulusDegree("2^11")
                    .setBitSizes([19, 16, 19])
                    .setScale("2^16");
                break;
            }
            case "low": {
                CKKSBuilder
                    .setPolyModulusDegree("2^12")
                    .setBitSizes([24, 20, 20, 20, 24])
                    .setScale("2^20");
                break;
            }
            case "medium": {
                if (this._maxMultiplyCount as MaxMultiplyCountType<"medium"> === "1") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^12")
                        .setBitSizes([39, 30, 39])
                        .setScale("2^30")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"medium"> === "5") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^13")
                        .setBitSizes([34, 30, 30, 30, 30, 30, 34])
                        .setScale("2^30")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"medium"> === "12") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^14")
                        .setBitSizes([39, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 39])
                        .setScale("2^30")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"medium"> === "16") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^15")
                        .setBitSizes([40, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 40])
                        .setScale("2^30")
                }
                else {
                    throw new Error(`Invalid maxMultiplyCount (${this._maxMultiplyCount})`);
                }
                break;
            }
            case "high": {
                if (this._maxMultiplyCount as MaxMultiplyCountType<"high"> === "3") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^13")
                        .setBitSizes([49, 40, 40, 40, 49])
                        .setScale("2^40")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"high"> === "8") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^14")
                        .setBitSizes([50, 40, 40, 40, 40, 40, 40, 40, 40, 50])
                        .setScale("2^40")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"high"> === "12") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^15")
                        .setBitSizes([50, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 50])
                        .setScale("2^40")
                }
                else {
                    throw new Error(`Invalid maxMultiplyCount (${this._maxMultiplyCount})`);
                }
                break;
            }
            case "higher": {
                if (this._maxMultiplyCount as MaxMultiplyCountType<"higher"> === "2") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^13")
                        .setBitSizes([59, 50, 50, 59])
                        .setScale("2^50")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"higher"> === "6") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^14")
                        .setBitSizes([60, 50, 50, 50, 50, 50, 50, 60])
                        .setScale("2^50")
                }
                else if (this._maxMultiplyCount as MaxMultiplyCountType<"higher"> === "10") {
                    CKKSBuilder
                        .setPolyModulusDegree("2^15")
                        .setBitSizes([60, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 60])
                        .setScale("2^50")
                }
                else {
                    throw new Error(`Invalid maxMultiplyCount (${this._maxMultiplyCount})`);
                }
                break;
            }
            default: {
                throw new Error(`Invalid floatPrecision (${this._floatPrecision})`);
            }
        }
    }


    public abstract getThis(): T;


    public abstract build(...args: any[]): Promise<SenderCKKS | ReceiverCKKS>;
}



export class SenderCKKSBuilderAuto<F extends 'lower' | 'low' | 'medium' | 'high' | 'higher', M extends MaxMultiplyCountType<F>> extends AbstractCKKSBuilderAuto<SenderCKKSBuilderAuto<F, M>, F, M> {
    constructor(floatPrecision: F, maxMultiplyCount: M) {
        super(floatPrecision, maxMultiplyCount);
    }


    public override getThis(): SenderCKKSBuilderAuto<F, M> {
        return this;
    }


    public override async build(serializedSecretKey?: Uint8Array): Promise<SenderCKKS> {
        const senderCKKSBuilder = new SenderCKKSBuilder()

        this.configCKKSBuilder(senderCKKSBuilder);

        return await senderCKKSBuilder
            .setSecurityLevel("tc128")
            .setVectorSize(this._vectorSize)
            .build(serializedSecretKey);
    }
}



export class ReceiverCKKSBuilderAuto<F extends 'lower' | 'low' | 'medium' | 'high' | 'higher', M extends MaxMultiplyCountType<F>> extends AbstractCKKSBuilderAuto<ReceiverCKKSBuilderAuto<F, M>, F, M> {
    constructor(floatPrecision: F, maxMultiplyCount: M) {
        super(floatPrecision, maxMultiplyCount);
    }


    public override getThis(): ReceiverCKKSBuilderAuto<F, M> {
        return this;
    }


    public override async build(serializedPublicKey: Uint8Array, serializedRelinKeys: Uint8Array, serializedGaloisKeys: Uint8Array): Promise<ReceiverCKKS> {
        const receiverCKKSBuilder = new ReceiverCKKSBuilder()

        this.configCKKSBuilder(receiverCKKSBuilder);

        return await receiverCKKSBuilder
            .setSecurityLevel("tc128")
            .setVectorSize(this._vectorSize)
            .build(serializedPublicKey, serializedRelinKeys, serializedGaloisKeys);
    }
}