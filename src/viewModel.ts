import * as ModelTypes from "./model";

export class ViewModel {
  private model_: ModelTypes.Model;
  private subscriberStorageObject_: ((newValue: ModelTypes.StorageObject) => void)[] = [];

  constructor() {
    this.model_ = new ModelTypes.Model();
    this.model_.SubscribeStorageObject((newValue) => this.onStorageObjectUpdate(newValue));
  }

  public GetStorageObject() {
    return this.model_.GetStorageObject();
  }

  public SubscribeStorageObject(callback: (newValue: ModelTypes.StorageObject) => void): void {
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
    var newNote = null;

    //儲存
    var storageObject = this.model_.GetStorageObject();
    if (storageObject && newNoteInfo && newOrinData && newNote) {
      storageObject.noteList[storageObject.noteListIndex] = [newNoteInfo, newOrinData, newNote];
      this.model_.UserSetStorageObject(storageObject);
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
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public ClickBackBtn() {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteListIndex =
        storageObject.noteListIndex - 1 < 0 ? 0 : storageObject.noteListIndex - 1;
      this.model_.UserSetStorageObject(storageObject);
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
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public ClickShowBtn() {
    console.log(this.model_.GetStorageObject());
  }

  public UserSetNotionApiField(newValue: string) {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.notionApi = newValue;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  public UserSetNotionPageIdField(newValue: string) {
    var storageObject = this.model_.GetStorageObject();
    if (storageObject) {
      storageObject.noteList[storageObject.noteListIndex][0].pageId = newValue;
      this.model_.UserSetStorageObject(storageObject);
    }
  }

  private onStorageObjectUpdate(newValue: ModelTypes.StorageObject) {
    this.notify(newValue);
  }

  private notify(newValue: ModelTypes.StorageObject): void {
    this.subscriberStorageObject_.forEach((callback) => callback(newValue));
  }
}
