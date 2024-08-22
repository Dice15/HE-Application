import { CipherText } from "node-seal/implementation/cipher-text";
import { AbstractDisposable } from "./abstract-disposable";
import { CKKSOptions } from "./ckks-provider";


export type CKKSCipherTextParams = {
    readonly ciphers: CipherText[];
    readonly dataCount: number;
    readonly options?: CKKSOptions;
}


export type CKKSCipherTextStorageFormat = {
    readonly serializedCiphers: string[];
    readonly dataCount: number;
    readonly options?: CKKSOptions;
}


export class CKKSCipherText extends AbstractDisposable {
    private _ciphers: CipherText[];
    private _dataCount: number;
    private _options?: CKKSOptions;


    public constructor();
    public constructor({ ciphers, dataCount, options }: CKKSCipherTextParams);
    public constructor(init?: CKKSCipherTextParams) {
        super();
        if (init) {
            this._ciphers = init.ciphers;
            this._dataCount = init.dataCount;
            this._options = init.options;
        } else {
            this._ciphers = [];
            this._dataCount = 0;
        }
    }


    public override deleteResources(): void {
        try {
            this.assertNotDisposed();

            this._ciphers.forEach((ciphers) => ciphers.delete());
            this._ciphers = [];
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
                serializedCiphers: this._ciphers.map(cipher => cipher.save()),
                dataCount: this._dataCount,
                options: this._options
            } as CKKSCipherTextStorageFormat);
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public getCiphers(): CipherText[] {
        try {
            this.assertNotDisposed();

            return this._ciphers;
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


    public clone(): CKKSCipherText {
        try {
            this.assertNotDisposed();

            return new CKKSCipherText({
                ciphers: this._ciphers.map(cipher => cipher.clone()),
                dataCount: this._dataCount,
                options: this._options
            });
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public copyTo(destination: CKKSCipherText): CKKSCipherText {
        try {
            this.assertNotDisposed();

            destination._ciphers.forEach((cipher, index) => cipher.copy(this._ciphers[index]));
            destination._dataCount = this._dataCount;
            destination._options = this._options;
            return destination;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }


    public moveTo(destination: CKKSCipherText): CKKSCipherText {
        try {
            this.assertNotDisposed();

            destination._ciphers.forEach((cipher, index) => cipher.move(this._ciphers[index]));
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