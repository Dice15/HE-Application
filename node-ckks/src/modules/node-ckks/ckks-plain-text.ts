import { PlainText } from "node-seal/implementation/plain-text";
import { AbstractDisposable } from "./abstract-disposable";



export class CKKSPlainText extends AbstractDisposable {
    private _plainTexts: PlainText[];
    private _plainSlotCount: number;
    private _vectorCount: number;
    private _vectorSize: number;


    constructor(plainTexts: PlainText[], plainSlotCount: number, vectorCount: number, vectorSize: number) {
        super();
        this._plainTexts = plainTexts;
        this._plainSlotCount = plainSlotCount;
        this._vectorCount = vectorCount;
        this._vectorSize = vectorSize;
    }


    public getPlainSlotCount(): number {
        return this._plainSlotCount;
    }


    public getVectorCount(): number {
        return this._vectorCount;
    }


    public getVectorSize(): number {
        return this._vectorSize;
    }


    public override delete(): void {
        for (let i = 0; i < this._plainTexts.length; i++) {
            this._plainTexts[i].delete();
        }
    }


    public clone(): CKKSPlainText {
        return new CKKSPlainText(
            this._plainTexts.map(plainText => plainText.clone()),
            this._plainSlotCount,
            this._vectorCount,
            this._plainSlotCount
        );
    }


    public copyTo(destination: CKKSPlainText): CKKSPlainText {
        destination._plainTexts.forEach((plain, index) => plain.copy(this._plainTexts[index]));
        destination._plainSlotCount = this._plainSlotCount;
        destination._vectorCount = this._vectorCount;
        destination._vectorSize = this._vectorSize;
        return destination;
    }


    public moveTo(destination: CKKSPlainText): CKKSPlainText {
        destination._plainTexts.forEach((plain, index) => plain.move(this._plainTexts[index]));
        destination._plainSlotCount = this._plainSlotCount;
        destination._vectorCount = this._vectorCount;
        destination._vectorSize = this._vectorSize;
        return destination;
    }


    public getPlainTextObjects(): PlainText[] {
        return this._plainTexts;
    }
}