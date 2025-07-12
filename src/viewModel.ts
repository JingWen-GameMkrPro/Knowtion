import { Model } from "./model";

export class ViewModel {
  private _model: Model;

  constructor() {
    this._model = new Model();
  }

  public test(api: string, id: string, index: number) {
    this._model.getNotionPageInfo(api, id, index);
  }
}
