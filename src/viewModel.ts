import * as ModelTypes from "./model";
import * as T from "./commonType";

export class ViewModel {
  private model_: ModelTypes.Model;
  private subscriberStorageObject_: ((newValue: T.StorageObject) => void)[] = [];

  constructor() {
    this.model_ = new ModelTypes.Model();
    this.model_.SubscribeStorageObject((newValue) => this.onStorageObjectUpdate(newValue));
  }

  public async GetStorageObject() {
    return await this.model_.GetStorageObject();
  }

  public SubscribeStorageObject(callback: (newValue: T.StorageObject) => void): void {
    this.subscriberStorageObject_.push(callback);
  }

  // 按下Update 按鈕後
  // 1、獲取INFO
  // 2、獲取BLOCKS
  public async ClickUpdateBtn() {
    // 獲得原始資料
    var infoJson = await this.model_.FetchNotionPageInfo();
    var blocksJson = await this.model_.FetchNotionPageBlocks();

    //加工
    var newNoteInfo = this.model_.TransformNotionPageInfoAsNoteInfo(infoJson);
    var newOrinData = this.model_.TransformNotionPageBlocksAsOriginData(blocksJson);
    var newNote = this.model_.TransformOriginDataAsNote(newOrinData);

    //儲存
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject && newNoteInfo && newOrinData && newNote) {
      storageObject.noteList[storageObject.noteListIndex] = [newNoteInfo, newOrinData, newNote];
      this.model_.UserSetStorageObject(storageObject);
    }

    // DEBUG: 資料庫更新
    console.log(storageObject);
  }

  public ClickClearBtn() {
    this.model_.ClearStorageObject();
  }

  public async ClickNextBtn() {
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteListIndex =
        storageObject.noteListIndex + 1 > storageObject.noteList.length - 1
          ? storageObject.noteList.length - 1
          : storageObject.noteListIndex + 1;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public async ClickBackBtn() {
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteListIndex =
        storageObject.noteListIndex - 1 < 0 ? 0 : storageObject.noteListIndex - 1;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public async ClickAddBtn() {
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteList.push([T.DEFAULT_NOTE_INFO, T.DEFAULT_ORIGIN_DATA, T.DEFAULT_NOTE]);
      storageObject.noteListIndex = storageObject.noteList.length - 1;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public async ClickDebugBtn() {
    console.log(await this.model_.GetStorageObject());
  }

  public async ClickDebug2Btn() {
    var storageObject = await this.model_.GetStorageObject();
    const allNote: T.Note[] = (storageObject?.noteList || []).map(([info, origin, note]) => note);
    var newTrie = this.model_.rebuildTrie(allNote);
    storageObject!.trie = newTrie;
    this.model_.UserSetStorageObject(storageObject!);
    console.log(await this.model_.GetStorageObject());
  }
  public ClickDebug3Btn() {
    chrome.runtime.sendMessage({ action: "NOTIFY_BACKGROUND" }, (response: String) => {
      if (response) {
        console.log("Received background message");
      }
    });
  }

  public async UserSetNotionApiField(newValue: string) {
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.notionApi = newValue;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public async UserSetNotionPageIdField(newValue: string) {
    var storageObject = await this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteList[storageObject.noteListIndex][0].pageId = newValue;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  private onStorageObjectUpdate(newValue: T.StorageObject) {
    this.notify(newValue);
  }

  private notify(newValue: T.StorageObject): void {
    this.subscriberStorageObject_.forEach((callback) => callback(newValue));
  }
}
