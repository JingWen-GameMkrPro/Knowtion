import * as ModelTypes from "./model";
import * as Note from "./noteModel";
import * as Trie from "./trieModel";
export class ViewModel {
  private model_: ModelTypes.Model;
  // private ChromeSaveDataWatcher_: ((newValue: T.ChromeSaveData) => void)[] = [];

  constructor() {
    this.model_ = new ModelTypes.Model();
    // this.model_.WatchChromeSaveData((newValue) => this.onStorageObjectUpdate(newValue));
  }

  // public WatchChromeSaveData(callback: (newValue: T.ChromeSaveData) => void): void {
  //   this.ChromeSaveDataWatcher_.push(callback);
  // }

  // 按下Update 按鈕後
  // 1、獲取INFO
  // 2、獲取BLOCKS
  public async ClickUpdateBtn() {
    this.model_.UpdateCurrentNote();
  }

  public ClickClearBtn() {
    // this.model_.ClearChromeSaveData();
  }

  public async ClickNextBtn() {
    this.model_.NextNoteIndex();
  }

  public async ClickBackBtn() {
    this.model_.BackNoteIndex();
  }

  public async ClickAddBtn() {
    this.model_.AddNewNote();
  }

  public async ClickDebugBtn() {
    // console.log(await this.model_.getChromeSaveData());
  }

  public async ClickDebug2Btn() {
    // this.model_.InitChromeSaveData();
  }

  public ClickDebug3Btn() {
    chrome.runtime.sendMessage({ action: "NOTIFY_BACKGROUND" }, (response: String) => {
      if (response) {
        console.log("Received background message");
      }
    });
  }

  public async UpdateNotionApi(newValue: string) {
    this.model_.UpdateNotionApi(newValue);
  }

  public async UserSetNotionPageIdField(newValue: string) {
    this.model_.UpdateCurrentNoteNotionPageId(newValue);
  }

  // private onStorageObjectUpdate(newValue: T.ChromeSaveData) {
  //   this.notify(newValue);
  // }

  // private notify(newValue: T.ChromeSaveData): void {
  //   this.ChromeSaveDataWatcher_.forEach((callback) => callback(newValue));
  // }
}
