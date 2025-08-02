import * as Utility from "./utility";

export class Model {
  private subscriberStorageObject_: ((newValue: StorageObject) => void)[] = [];
  private chromeStorageProcessor_ = new ChromeStorageProcessor();

  public UserSetStorageObject(newValue: StorageObject): void {
    this.chromeStorageProcessor_.setData<StorageObject>(LOCAL_STORAGE_KEY.STORAGE_OBJECT, newValue);
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

  public SubscribeStorageObject(callback: (newValue: StorageObject) => void): void {
    this.subscriberStorageObject_.push(callback);
  }

  public async FetchNotionPageInfo() {
    var storageObject = this.GetStorageObject();
    var notionApi = storageObject?.notionApi;
    var noteListIndex = storageObject?.noteListIndex;
    var noteList = storageObject?.noteList;

    if (Utility.IsAnyNullOrUndefined(notionApi, noteListIndex, noteList)) {
      return;
    }

    var json = await this.fetchNotionPageInfo(notionApi!, noteList![noteListIndex!][0].pageId);

    return json ? json : null;
  }

  public async FetchNotionPageBlocks() {
    var storageObject = this.GetStorageObject();
    var notionApi = storageObject?.notionApi;
    var noteListIndex = storageObject?.noteListIndex;
    var noteList = storageObject?.noteList;

    if (Utility.IsAnyNullOrUndefined(notionApi, noteListIndex, noteList)) {
      return;
    }

    var json = await this.fetchNotionPageBlocks(notionApi!, noteList![noteListIndex!][0].pageId);

    return json ? json : null;
  }

  public TransformNotionPageInfoAsNoteInfo(json: any): NoteInfo {
    var noteInfo: NoteInfo = DEFAULT_NOTE_INFO;
    noteInfo.fetchTime = Date.now();
    noteInfo.lastEditedTime = new Date(json.last_edited_time).getTime();
    noteInfo.pageId = json.id;
    noteInfo.title = json.properties.Name.title[0].plain_text;
    return noteInfo;
  }

  public TransformNotionPageBlocksAsOriginData(json: any): OriginData {
    var originData: OriginData = DEFAULT_ORIGIN_DATA;
    originData.notionPageBlocks = json;
    return originData;
  }

  async fetchNotionPageBlocks(notionApi: string, notionPageId: string): Promise<any> {
    const blocks: any[] = [];
    let nextCursor: string | null = null;
    let hasMore = true;

    try {
      while (hasMore) {
        const url = new URL(`https://api.notion.com/v1/blocks/${notionPageId}/children`);

        url.searchParams.set("page_size", "100");
        if (nextCursor) {
          url.searchParams.set("start_cursor", nextCursor);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${notionApi}`,
            "Notion-Version": "2022-06-28",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to fetch Notion page blocks:", error);
          return null;
        }

        const data = await response.json();

        blocks.push(...data.results);

        hasMore = data.has_more;
        nextCursor = data.next_cursor;
      }

      return blocks;
    } catch (error) {
      console.error("Error fetching Notion page blocks:", error);
      return null;
    }
  }

  async fetchNotionPageInfo(notionApi: string, notionPageId: string): Promise<any> {
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

  private notify(newValue: StorageObject): void {
    this.subscriberStorageObject_.forEach((callback) => callback(newValue));
  }

  private setDefaultStorageObject(): StorageObject {
    var defaultObject: StorageObject = {
      notionApi: "Default",

      isHighlight: false,

      noteListIndex: 0,
      // NOTE
      noteList: [[DEFAULT_NOTE_INFO, DEFAULT_ORIGIN_DATA, DEFAULT_NOTE]],
    };
    this.chromeStorageProcessor_.setData(LOCAL_STORAGE_KEY.STORAGE_OBJECT, defaultObject);

    return defaultObject;
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

  lastEditedTime: Number;

  fetchTime: Number;
}
export const DEFAULT_NOTE_INFO: NoteInfo = {
  pageId: "Default",
  title: "Default",
  lastEditedTime: new Number(),
  fetchTime: new Number(),
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
