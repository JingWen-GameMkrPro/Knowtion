import * as Chrome from "./chromeModel";

export interface Note {
  notionPageInfo: NotionPageInfo;
  notionPage: NotionPage;
  blocks: Block[];
}

export function CreateNote(): Note {
  return {
    notionPageInfo: CreateNotionPageInfo(),
    notionPage: CreateNotionPage(),
    blocks: [],
  };
}

export interface NotionPageInfo {
  pageId: string;

  title: string;

  lastEditedTime: Number;

  fetchTime: Number;
}

export function CreateNotionPageInfo(): NotionPageInfo {
  return {
    pageId: "",
    title: "",
    lastEditedTime: new Number(),
    fetchTime: new Number(),
  };
}

export interface NotionPage {
  notionBlocks: string[];
}

export function CreateNotionPage(): NotionPage {
  return {
    notionBlocks: [],
  };
}

export interface Block {
  blockKey: string;
  blockValues: BlockValue[]; //區塊內容
}

export function CreateBlock(): Block {
  return {
    blockKey: "",
    blockValues: [],
  };
}

export interface BlockValue {
  color: BlockValueColor;
  type: BlockValueType;
  value: string;
}

export enum BlockValueColor {
  Normal,
  Red,
  Blue,
  Green,
}

export enum BlockValueType {
  text,
  referenceText,
  warningText,
  exampleText,
}

export function CreateBlockValue(): BlockValue {
  return {
    color: BlockValueColor.Normal,
    type: BlockValueType.text,
    value: "",
  };
}

export function DivideStringWithSymbol(value: string, symbol: string): [string, string] | null {
  const parts = value.split(symbol);
  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  return null;
}
export function IsNullorUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

export function IsAnyNullOrUndefined<T extends readonly any[]>(...values: T): boolean {
  return values.some((value) => IsNullorUndefined(value));
}

export class Service {
  public static AddNewNote(saveData: Chrome.ChromeSaveData): Chrome.ChromeSaveData {
    saveData.notes.push(CreateNote());
    saveData.noteIndex = saveData.notes.length - 1;
    return saveData;
  }

  public static NextNoteIndex(saveData: Chrome.ChromeSaveData): Chrome.ChromeSaveData {
    saveData.noteIndex =
      saveData.noteIndex + 1 > saveData.notes.length - 1
        ? saveData.notes.length - 1
        : saveData.noteIndex + 1;
    return saveData;
  }

  public static BackNoteIndex(saveData: Chrome.ChromeSaveData): Chrome.ChromeSaveData {
    saveData.noteIndex = saveData.noteIndex - 1 < 0 ? 0 : saveData.noteIndex - 1;
    return saveData;
  }

  public static UpdateNotionApi(
    saveData: Chrome.ChromeSaveData,
    newValue: string
  ): Chrome.ChromeSaveData {
    saveData.notionApi = newValue;
    return saveData;
  }

  public static UpdateCurrentNoteNotionPageId(
    saveData: Chrome.ChromeSaveData,
    newValue: string
  ): Chrome.ChromeSaveData {
    saveData.notes[saveData.noteIndex].notionPageInfo.pageId = newValue;
    return saveData;
  }

  public static async UpdateCurrentNote(
    saveData: Chrome.ChromeSaveData
  ): Promise<Chrome.ChromeSaveData> {
    var infoJson = await this.FetchNotionPageInfo(saveData);
    var blocksJson = await this.FetchNotionPage(saveData);

    var newNoteInfo = this.transformJsonAsNotionPageInfo(infoJson);
    var newOrinData = this.transformJsonAsNotionPage(blocksJson);
    var newBlocks = this.createBlocksByNotionPage(newOrinData);

    const newNote = CreateNote();
    newNote.notionPageInfo = newNoteInfo;
    newNote.notionPage = newOrinData;
    newNote.blocks = newBlocks;

    saveData.notes[saveData.noteIndex] = newNote;
    return saveData;
  }

  public static async FetchNotionPageInfo(saveData: Chrome.ChromeSaveData): Promise<any | null> {
    const notionApi = saveData?.notionApi;
    const pageId = saveData?.notes[saveData?.noteIndex].notionPageInfo.pageId;
    const json = await this.fetchNotionPageInfo(notionApi, pageId);
    return json ? json : null;
  }

  public static async FetchNotionPage(saveData: Chrome.ChromeSaveData): Promise<any | null> {
    const notionApi = saveData?.notionApi;
    const pageId = saveData?.notes[saveData?.noteIndex].notionPageInfo.pageId;
    const json = await this.fetchNotionPage(notionApi, pageId);
    return json ? json : null;
  }

  private static async fetchNotionPage(notionApi: string, notionPageId: string): Promise<any> {
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

  private static async fetchNotionPageInfo(notionApi: string, notionPageId: string): Promise<any> {
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

  private static transformJsonAsNotionPageInfo(json: any): NotionPageInfo {
    const noteInfo = CreateNotionPageInfo();

    noteInfo.fetchTime = Date.now();
    noteInfo.lastEditedTime = new Date(json.last_edited_time).getTime();
    noteInfo.pageId = json.id;
    noteInfo.title = json.properties.Name.title[0].plain_text;

    return noteInfo;
  }

  private static transformJsonAsNotionPage(json: any): NotionPage {
    const newNotionPage = CreateNotionPage();

    json.forEach((block: any) => {
      if (block.type == "paragraph" && block.paragraph.rich_text.length !== 0) {
        const richTexts = block.paragraph.rich_text.map((text: any) => text.plain_text);
        const combinedText = richTexts.join("");
        newNotionPage.notionBlocks.push(combinedText);
      }
    });

    return newNotionPage;
  }

  private static createBlocksByNotionPage(notionPage: NotionPage): Block[] {
    const newBlocks: Block[] = [];

    notionPage.notionBlocks.forEach((block) => {
      const newBlock = this.makeBlockByNotionBlock(block);
      if (!IsNullorUndefined(newBlock)) {
        newBlocks.push(newBlock);
      }
    });

    return newBlocks;
  }

  private static divideStringWithPattern(value: string): [BlockValueType, string][] {
    const result: [BlockValueType, string][] = [];
    const regex = /[^@~&]+|[@~&]\{[^}]*\}/g;
    const matches = value.match(regex);

    if (!matches) {
      return [];
    }

    // 映射符號到 T.BlockValueType
    const typeMap = {
      "@": BlockValueType.exampleText,
      "~": BlockValueType.warningText,
      "&": BlockValueType.referenceText,
    };

    matches.forEach((match) => {
      let type: BlockValueType = BlockValueType.text;
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

  private static makeBlockValue(text: [BlockValueType, string]): BlockValue {
    const newValue = CreateBlockValue();
    newValue.type = text[0];
    newValue.value = text[1];
    switch (text[0]) {
      case BlockValueType.text:
        newValue.color = BlockValueColor.Normal;
        newValue.value = text[1];
        break;
      case BlockValueType.exampleText:
        newValue.color = BlockValueColor.Blue;
        newValue.value = text[1];
        break;
      case BlockValueType.warningText:
        newValue.color = BlockValueColor.Red;
        newValue.value = text[1];
        break;
      case BlockValueType.referenceText:
        newValue.color = BlockValueColor.Green;
        newValue.value = text[1];
        break;
    }
    return newValue;
  }

  private static makeBlockByNotionBlock(notionBlock: string): Block | null {
    // TODO: 分割符號先使用 '/'
    const twoParts = DivideStringWithSymbol(notionBlock, "/");

    // TODO: 將Values分成更細微value
    if (!IsNullorUndefined(twoParts)) {
      const newBlock = CreateBlock();

      newBlock.blockKey = twoParts[0];

      const matchPatterns = this.divideStringWithPattern(twoParts[1]);
      matchPatterns?.forEach((pattern) => {
        newBlock.blockValues.push(this.makeBlockValue(pattern));
      });

      return newBlock;
    }

    return null;
  }
}
