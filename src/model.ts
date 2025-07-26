export class Model {
  private subscribers_: ((newValue: StorageObject) => void)[] = [];
  private chromeStorageProcessor_ = new ChromeStorageProcessor();

  public SetStorageObject(newValue: StorageObject): void {
    this.chromeStorageProcessor_.setData<StorageObject>(
      LOCAL_STORAGE_KEY.STORAGE_OBJECT,
      newValue
    );
    this.notify(newValue);
  }

  public GetStorageObject(): StorageObject | null {
    var data = this.chromeStorageProcessor_.getData<StorageObject>(
      LOCAL_STORAGE_KEY.STORAGE_OBJECT
    );

    // 本地端第一次使用插件
    if (!data) {
      data = this.setDefaultStorageObject();
    }

    return data;
  }
  public ClearStorageObject() {
    this.chromeStorageProcessor_.clearData(LOCAL_STORAGE_KEY.STORAGE_OBJECT);
    var newValue = this.GetStorageObject();
    if (newValue) {
      this.notify(newValue);
    }
  }
  private setDefaultStorageObject(): StorageObject {
    var defaultObject: StorageObject = {
      notionApi: "Default",

      isHighlight: false,

      noteListIndex: 0,
      // NOTE
      noteList: [[DEFAULT_NOTE_INFO, DEFAULT_ORIGIN_DATA, DEFAULT_NOTE]],
    };
    this.chromeStorageProcessor_.setData(
      LOCAL_STORAGE_KEY.STORAGE_OBJECT,
      defaultObject
    );

    return defaultObject;
  }

  public Subscribe(callback: (newValue: StorageObject) => void): void {
    this.subscribers_.push(callback);
  }

  private notify(newValue: StorageObject): void {
    this.subscribers_.forEach((callback) => callback(newValue));
  }

  public async UpdateNote(
    notionApi: string,
    pageId: string,
    notebaseIndex: number
  ) {}

  public async FetchNotionPageInfo() {
    var storageObject = this.GetStorageObject();

    var notionApi = storageObject?.notionApi;
    var noteListIndex = storageObject?.noteListIndex;
    var noteList = storageObject?.noteList;

    if (!notionApi || !noteListIndex || !noteList) {
      return;
    }

    var json = await this.fetchNotionPageInfo(
      notionApi,
      noteList[noteListIndex][0].pageId
    );

    return json ? json : null;
  }

  public TransformNotionPageInfoAsNoteInfo(json: any): NoteInfo {
    var noteInfo: NoteInfo = {
      pageId: "",

      title: "",

      lastEditedTime: new Date(),

      fetchTime: new Date(),
    };
    return noteInfo;
  }

  public TransformNotionPageBlocksAsOriginData(json: any): OriginData {
    var originData: OriginData = {
      notionPageBlocks: [],
    };
    return originData;
  }

  public async FetchNotionPageBlocks() {}

  async fetchNotionPageInfo(
    notionApi: string,
    notionPageId: string
  ): Promise<any> {
    const url = `https://api.notion.com/v1/pages/${notionPageId}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${notionApi}`,
          "Notion-Version": "2022-06-28",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to fetch Notion page info:", error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Notion page info:", error);
      return null;
    }
  }
}
class ChromeStorageProcessor {
  public getData<T>(key: string): T | null {
    try {
      const result = localStorage.getItem(key);
      if (result) {
        // 解析 JSON 字串為Object
        const data = JSON.parse(result);
        return data as T;
      }
    } catch (e) {
      console.error("讀取 localStorage 失敗或資料損壞:", e);
    }
    return null;
  }

  public setData<T>(key: string, value: T): void {
    try {
      // localStorage 只能儲存字串，所以需要將物件或值轉換為 JSON 字串
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (e) {
      console.error(`儲存到 localStorage 失敗 (鍵: "${key}"):`, e);
    }
  }

  public clearData(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("清除 localStorage 失敗:", e);
    }
  }
}

// 要儲存到chrome storage的所有資料
export interface StorageObject {
  // USER SETTING
  notionApi: string;

  isHighlight: boolean;

  noteListIndex: number;
  // NOTE
  noteList: [NoteInfo, OriginData, Note][];
}

export const LOCAL_STORAGE_KEY = {
  STORAGE_OBJECT: "storageObject",
} as const;

// Notion JSON 提取的 Page Info
export interface NoteInfo {
  pageId: string; //筆記ID

  title: string; //筆記標題

  lastEditedTime: Date;

  fetchTime: Date;
}
export const DEFAULT_NOTE_INFO: NoteInfo = {
  pageId: "Default",
  title: "Default",
  lastEditedTime: new Date(0),
  fetchTime: new Date(0),
};

// Notion JSON 提取的 Blocks
export interface OriginData {
  notionPageBlocks: string[];
}
export const DEFAULT_ORIGIN_DATA: OriginData = {
  notionPageBlocks: [],
};

export interface Note {
  noteBlocks: Block[]; //筆記內容
}

export const DEFAULT_NOTE: Note = {
  noteBlocks: [],
};

export interface Block {
  key: string;
  allValues: Value[]; //區塊內容
}

export interface Value {
  color: BlockValueColor; //單行顏色
  type: BlockValueType; //單行類型
  content: string; //單行內容
}

enum BlockValueColor {
  Red,
  Blue,
  Green,
}

enum BlockValueType {
  text,
  referenceText,
  warningText,
  exampleText,
}
