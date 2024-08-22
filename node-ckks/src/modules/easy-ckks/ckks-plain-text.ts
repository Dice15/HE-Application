import { PlainText } from "node-seal/implementation/plain-text";
import { AbstractDisposable } from "./abstract-disposable";
import { CKKSOptions } from "./ckks-provider";


export type CKKSPlainTextParams = {
    readonly plains: PlainText[];
    readonly dataCount: number;
    readonly options?: CKKSOptions;
}


export type CKKSPlainTextStorageFormat = {
    readonly serializedPlains: string[];
    readonly dataCount: number;
    readonly options?: CKKSOptions;
}


export class CKKSPlainText extends AbstractDisposable {
    private _plains: PlainText[];
    private _dataCount: number;
    private _options?: CKKSOptions;


    public constructor();
    public constructor({ plains, dataCount, options }: CKKSPlainTextParams);
    public constructor(init?: CKKSPlainTextParams) {
        super();
        if (init) {
            this._plains = init.plains;
            this._dataCount = init.dataCount;
            this._options = init.options;
        } else {
            this._plains = [];
            this._dataCount = 0;
        }
    }


    public override deleteResources(): void {
        try {
            this.assertNotDisposed();

            this._plains.forEach((plain) => plain.delete());
            this._plains = [];
            this._dataCount = 0;
            this._options = undefined;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public serialize(): string {
        try {
            this.assertNotDisposed();

            return JSON.stringify({
                serializedPlains: this._plains.map(plain => plain.save()),
                dataCount: this._dataCount,
                options: this._options
            } as CKKSPlainTextStorageFormat);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public getPlains(): PlainText[] {
        try {
            this.assertNotDisposed();

            return this._plains;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public getDataCount(): number {
        try {
            this.assertNotDisposed();

            return this._dataCount;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public getOptions(): CKKSOptions | undefined {
        try {
            this.assertNotDisposed();

            return this._options;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public clone(): CKKSPlainText {
        try {
            this.assertNotDisposed();

            return new CKKSPlainText({
                plains: this._plains.map(plain => plain.clone()),
                dataCount: this._dataCount,
                options: this._options
            });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public copyTo(destination: CKKSPlainText): CKKSPlainText {
        try {
            this.assertNotDisposed();

            destination._plains.forEach((plain, index) => plain.copy(this._plains[index]));
            destination._dataCount = this._dataCount;
            destination._options = this._options;
            return destination;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public moveTo(destination: CKKSPlainText): CKKSPlainText {
        try {
            this.assertNotDisposed();

            destination._plains.forEach((plain, index) => plain.move(this._plains[index]));
            destination._dataCount = this._dataCount;
            destination._options = this._options;
            this.delete();
            return destination;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }
}