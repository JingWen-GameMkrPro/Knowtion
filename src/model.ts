export class Model {
  public async updateNote(
    notionApi: string,
    pageId: string,
    notebaseIndex: number
  ) {}

  public async getNotionPageInfo(
    notionApi: string,
    pageId: string,
    notebaseIndex: number
  ) {
    var json = await this.fetchNotionPageInfo(notionApi, pageId);
    console.log(json);
  }

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

export interface NotionPageInfo {
  title: string;
  lastEditedTime: Date;
}

export interface NotionPageBlocks {
  notionBlocks: string[];
}

export interface UserSetting {
  notionApi: string;
  currentMode: string;
}

export interface Notebase {
  allNotes: Note[];
}

export interface Note {
  name: string; //筆記標題
  updateTime: Date; //筆記日期
  pageId: string; //筆記ID
  allBlocks: Block[]; //筆記內容
}

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
