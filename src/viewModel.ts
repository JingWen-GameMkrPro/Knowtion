import * as ModelTypes from "./model";

export class ViewModel {
  private model_: ModelTypes.Model;
  private subscribers: ((newValue: ModelTypes.StorageObject) => void)[] = [];

  constructor() {
    this.model_ = new ModelTypes.Model();
    this.model_.Subscribe((newValue) => this.onStorageObjectUpdate(newValue));
  }

  public GetStorageObject() {
    return this.model_.GetStorageObject();
  }

  public Subscribe(
    callback: (newValue: ModelTypes.StorageObject) => void
  ): void {
    this.subscribers.push(callback);
  }

  private onStorageObjectUpdate(newValue: ModelTypes.StorageObject) {
    this.notify(newValue);
  }

  private notify(newValue: ModelTypes.StorageObject): void {
    this.subscribers.forEach((callback) => callback(newValue));
  }

  // 按下Update 按鈕後
  // 1、獲取INFO
  // 2、獲取BLOCKS
  public ClickUpdateBtn() {
    // 獲得原始資料
    var infoJson = this.model_.FetchNotionPageInfo();
    var blocksJson = this.model_.FetchNotionPageBlocks();

    //加工
    var newNoteInfo = this.model_.TransformNotionPageInfoAsNoteInfo(infoJson);
    var newOrinData =
      this.model_.TransformNotionPageBlocksAsOriginData(blocksJson);
    var newNote = null;

    //儲存
    var storageObject = this.model_.GetStorageObject();
    if (storageObject && newNoteInfo && newOrinData && newNote) {
      storageObject.noteList[storageObject.noteListIndex] = [
        newNoteInfo,
        newOrinData,
        newNote,
      ];
      this.model_.SetStorageObject(storageObject);
    }

    // 資料庫更新
    console.log(storageObject);
  }

  public ClickClearBtn() {
    this.model_.ClearStorageObject();
  }

  public ClickNextBtn() {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteListIndex =
        storageObject.noteListIndex + 1 > storageObject.noteList.length - 1
          ? storageObject.noteList.length - 1
          : storageObject.noteListIndex + 1;
      this.model_.SetStorageObject(storageObject);
    }
  }
  public ClickBackBtn() {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteListIndex =
        storageObject.noteListIndex - 1 < 0
          ? 0
          : storageObject.noteListIndex - 1;
      this.model_.SetStorageObject(storageObject);
    }
  }
  public ClickAddBtn() {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteList.push([
        ModelTypes.DEFAULT_NOTE_INFO,
        ModelTypes.DEFAULT_ORIGIN_DATA,
        ModelTypes.DEFAULT_NOTE,
      ]);
      storageObject.noteListIndex = storageObject.noteList.length - 1;
      this.model_.SetStorageObject(storageObject);
    }
  }

  public ClickShowBtn() {
    console.log(this.model_.GetStorageObject());
  }

  public UpdateNotionApiField(newValue: string) {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.notionApi = newValue;
      this.model_.SetStorageObject(storageObject);
    }
  }

  public UpdateNotionPageIdField(newValue: string) {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteList[storageObject.noteListIndex][0].pageId = newValue;
      this.model_.SetStorageObject(storageObject);
    }
  }
}
