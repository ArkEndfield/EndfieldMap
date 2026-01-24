export abstract class BaseDisposer {
  public disposers: (() => void)[] = [];

  addDisposer(disposer: () => void) {
    this.disposers.push(disposer);
  }

  dispose() {
    this.disposers.forEach((disposer) => disposer());
    this.disposers = [];
  }
}

export class Disposer extends BaseDisposer {
  constructor() {
    super();
  }
}
