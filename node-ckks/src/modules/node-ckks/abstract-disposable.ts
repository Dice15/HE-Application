export abstract class AbstractDisposable {
    private static _finalRegistry = new FinalizationRegistry((deleteFunction: () => void) => {
        deleteFunction();
    });


    constructor() {
        AbstractDisposable._finalRegistry.register(this, this.delete.bind(this));
    }


    public abstract delete(): void;
}