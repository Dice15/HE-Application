

export type DisposableClassState = "alive" | "disposed";


export abstract class AbstractDisposable {
    private _classState: DisposableClassState;
    private static _finalRegistry = new FinalizationRegistry((deleteFunction: () => void) => {
        deleteFunction();
    });


    constructor() {
        this._classState = "alive";
        AbstractDisposable._finalRegistry.register(this, this.delete.bind(this));
    }


    protected assertNotDisposed(): void {
        if (this._classState === "disposed") {
            throw new Error("Cannot perform this operation: the class has been disposed.");
        }
    }


    protected abstract deleteResources(): void;


    public delete(): void {
        this.assertNotDisposed();
        this.deleteResources();
        this._classState = "disposed";
    }
}