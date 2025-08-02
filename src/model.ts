import * as Util from "./utility";
import * as T from "./commonType";

export class Model {
  private subscriberStorageObject_: ((newValue: T.StorageObject) => void)[] = [];

  public UserSetStorageObject(newValue: T.StorageObject): void {
    Util.setChromeData<T.StorageObject>(T.LOCAL_STORAGE_KEY.STORAGE_OBJECT, newValue);
    this.notify(newValue);
  }

  public GetStorageObject(): T.StorageObject | null {
    var data = Util.getChromeData<T.StorageObject>(T.LOCAL_STORAGE_KEY.STORAGE_OBJECT);

    // 本地端第一次使用插件
    if (!data) {
      data = this.setDefaultStorageObject();
    }

    return data;
  }

  public ClearStorageObject() {
    Util.clearChromeData(T.LOCAL_STORAGE_KEY.STORAGE_OBJECT);
    var newValue = this.GetStorageObject();
    if (newValue) {
      this.notify(newValue);
    }
  }

  public SubscribeStorageObject(callback: (newValue: T.StorageObject) => void): void {
    this.subscriberStorageObject_.push(callback);
  }

  public async FetchNotionPageInfo() {
    var storageObject = this.GetStorageObject();
    var notionApi = storageObject?.notionApi;
    var noteListIndex = storageObject?.noteListIndex;
    var noteList = storageObject?.noteList;

    if (Util.IsAnyNullOrUndefined(notionApi, noteListIndex, noteList)) {
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

    if (Util.IsAnyNullOrUndefined(notionApi, noteListIndex, noteList)) {
      return;
    }

    var json = await this.fetchNotionPageBlocks(notionApi!, noteList![noteListIndex!][0].pageId);

    return json ? json : null;
  }

  public TransformNotionPageInfoAsNoteInfo(json: any): T.NoteInfo {
    var noteInfo: T.NoteInfo = T.DEFAULT_NOTE_INFO;
    noteInfo.fetchTime = Date.now();
    noteInfo.lastEditedTime = new Date(json.last_edited_time).getTime();
    noteInfo.pageId = json.id;
    noteInfo.title = json.properties.Name.title[0].plain_text;
    return noteInfo;
  }

  public TransformNotionPageBlocksAsOriginData(json: any): T.OriginData {
    var originData: T.OriginData = {
      notionPageBlocks: [],
    };

    json.forEach((block: any) => {
      if (block.type == "paragraph" && block.paragraph.rich_text.length !== 0) {
        const richTexts = block.paragraph.rich_text.map((text: any) => text.plain_text);
        const combinedText = richTexts.join("");
        originData.notionPageBlocks.push(combinedText);
      }
    });
    return originData;
  }

  public TransformOriginDataAsNote(originData: T.OriginData): T.Note {
    var note: T.Note = {
      ...T.DEFAULT_NOTE,
      noteBlocks: [],
    };

    originData.notionPageBlocks.forEach((block) => {
      const newNoteLine = this.makeNoteLine(block);
      if (!Util.IsNullorUndefined(newNoteLine)) {
        note.noteBlocks.push(newNoteLine);
      }
    });
    return note;
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

  private notify(newValue: T.StorageObject): void {
    this.subscriberStorageObject_.forEach((callback) => callback(newValue));
  }

  private setDefaultStorageObject(): T.StorageObject {
    var defaultObject: T.StorageObject = {
      notionApi: "Default",

      isHighlight: false,

      noteListIndex: 0,
      // NOTE
      noteList: [[T.DEFAULT_NOTE_INFO, T.DEFAULT_ORIGIN_DATA, T.DEFAULT_NOTE]],
    };
    Util.setChromeData(T.LOCAL_STORAGE_KEY.STORAGE_OBJECT, defaultObject);

    return defaultObject;
  }

  private divideStringWithPattern(value: string): [T.BlockValueType, string][] {
    const result: [T.BlockValueType, string][] = [];
    const regex = /[^@~&]+|[@~&]\{[^}]*\}/g;
    const matches = value.match(regex);

    if (!matches) {
      return [];
    }

    // 映射符號到 T.BlockValueType
    const typeMap = {
      "@": T.BlockValueType.exampleText,
      "~": T.BlockValueType.warningText,
      "&": T.BlockValueType.referenceText,
    };

    matches.forEach((match) => {
      let type: T.BlockValueType = T.BlockValueType.text;
      let content = match;

      // 檢查字串是否以特殊符號開頭
      const firstChar = match[0];
      if (firstChar === "@" || firstChar === "~" || firstChar === "&") {
        type = typeMap[firstChar as keyof typeof typeMap];
        content = match.slice(2, -1); // 移除開頭符號、大括號和結尾大括號
      }

      result.push([type, content]);
    });

    return result;
  }

  private makeValue(text: [T.BlockValueType, string]): T.Value {
    const newValue: T.Value = T.CreateValue();
    newValue.type = text[0];
    newValue.content = text[1];
    switch (text[0]) {
      case T.BlockValueType.text:
        newValue.color = T.BlockValueColor.Normal;
        newValue.content = text[1];
        break;
      case T.BlockValueType.exampleText:
        newValue.color = T.BlockValueColor.Blue;
        newValue.content = text[1];
        break;
      case T.BlockValueType.warningText:
        newValue.color = T.BlockValueColor.Red;
        newValue.content = text[1];
        break;
      case T.BlockValueType.referenceText:
        newValue.color = T.BlockValueColor.Green;
        newValue.content = text[1];
        break;
    }
    return newValue;
  }

  private makeNoteLine(block: string): T.NoteLine | null {
    // TODO: 分割符號先使用 '/'
    const twoParts = Util.DivideStringWithSymbol(block, "/");

    // TODO: 將Values分成更細微value
    if (!Util.IsNullorUndefined(twoParts)) {
      const newNoteLine: T.NoteLine = T.CreateNoteLine();
      // Make Key
      newNoteLine.key = twoParts[0];

      // Make Value
      const matchPatterns = this.divideStringWithPattern(twoParts[1]);
      matchPatterns?.forEach((pattern) => {
        newNoteLine.values.push(this.makeValue(pattern));
      });

      return newNoteLine;
    }

    return null;
  }
}
