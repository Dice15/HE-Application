import { CipherText } from "node-seal/implementation/cipher-text";
import { AbstractDisposable } from "./abstract-disposable";



export class CKKSCipherText extends AbstractDisposable {
    private _cipherTexts: CipherText[];
    private _cipherSlotCount: number;
    private _vectorCount: number;
    private _vectorSize: number;


    constructor(cipherTexts: CipherText[], cipherSlotCount: number, vectorCount: number, vectorSize: number) {
        super();
        this._cipherTexts = cipherTexts;
        this._cipherSlotCount = cipherSlotCount;
        this._vectorCount = vectorCount;
        this._vectorSize = vectorSize;
    }


    public getPlainSlotCount(): number {
        return this._cipherSlotCount;
    }


    public getVectorCount(): number {
        return this._vectorCount;
    }


    public getVectorSize(): number {
        return this._vectorSize;
    }


    public override delete(): void {
        for (let i = 0; i < this._cipherTexts.length; i++) {
            this._cipherTexts[i].delete();
        }
    }


    public clone(): CKKSCipherText {
        return new CKKSCipherText(
            this._cipherTexts.map(cipherText => cipherText.clone()),
            this._cipherSlotCount,
            this._vectorCount,
            this._vectorSize
        );
    }


    public copyTo(destination: CKKSCipherText): CKKSCipherText {
        destination._cipherTexts.forEach((cipher, index) => cipher.copy(this._cipherTexts[index]));
        destination._cipherSlotCount = this._cipherSlotCount;
        destination._vectorCount = this._vectorCount;
        destination._vectorSize = this._vectorSize;
        return destination;
    }


    public moveTo(destination: CKKSCipherText): CKKSCipherText {
        destination._cipherTexts.forEach((cipher, index) => cipher.move(this._cipherTexts[index]));
        destination._cipherSlotCount = this._cipherSlotCount;
        destination._vectorCount = this._vectorCount;
        destination._vectorSize = this._vectorSize;
        return destination;
    }


    public getCipherTextObject(): CipherText[] {
        return this._cipherTexts;
    }
}