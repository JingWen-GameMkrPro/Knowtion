import * as B from "./commonBehavior";
import * as T from "./commonType";

export class Model {
  constructor() {
    this.WatchChromeSaveDataNotes(this.updateTrie);
  }

  /**
   * Chrome
   */

  // Chrome: init save data
  public async InitChromeSaveData(): Promise<void> {
    const initValue = await B.InitChromeSaveData();
    this.notifyChromeSaveDataWatcher(initValue);
  }

  // Chrome: get save data
  private async getChromeSaveData(): Promise<T.ChromeSaveData> {
    let saveData = await B.GetChromeSaveData();

    // Local first time to use
    if (saveData == null) {
      saveData = await B.InitChromeSaveData();
    }

    return saveData;
  }

  // Chrome: set save data
  private async setChromeSaveData(newValue: T.ChromeSaveData): Promise<void> {
    await B.SetChromeSaveData(newValue);
    this.notifyChromeSaveDataWatcher(newValue);
  }

  // UserInput: update current note
  public async UpdateCurrentNote(newNote: T.Note) {
    const saveData = await this.getChromeSaveData();
    saveData.notes[saveData.noteIndex] = newNote;
    await this.setChromeSaveData(saveData);
    this.notifyChromeSaveDataNotesWatcher(saveData.notes);
  }

  // UserInput: add new note
  public async AddNewNote() {
    var saveData = await this.getChromeSaveData();
    saveData.notes.push(T.CreateNote());
    saveData.noteIndex = saveData.notes.length - 1;
    await this.setChromeSaveData(saveData);
  }

  // UserInput: next current index
  public async NextNoteIndex() {
    const saveData = await this.getChromeSaveData();
    saveData.noteIndex =
      saveData.noteIndex + 1 > saveData.notes.length - 1
        ? saveData.notes.length - 1
        : saveData.noteIndex + 1;
    await this.setChromeSaveData(saveData);
  }

  // UserInput: back current index
  public async BackNoteIndex() {
    const saveData = await this.getChromeSaveData();
    saveData.noteIndex = saveData.noteIndex - 1 < 0 ? 0 : saveData.noteIndex - 1;
    await this.setChromeSaveData(saveData);
  }

  // UserInput: update notion api
  public async UpdateNotionApi(newValue: string) {
    const saveData = await this.getChromeSaveData();
    saveData.notionApi = newValue;
    await this.setChromeSaveData(saveData);
  }

  // UserInput: update notion page id
  public async UpdateCurrentNoteNotionPageId(newValue: string) {
    const saveData = await this.getChromeSaveData();
    saveData.notes[saveData.noteIndex].notionPageInfo.pageId = newValue;
    await this.setChromeSaveData(saveData);
  }

  // NOTE: trigger when note updated
  private updateTrie = async (newNotes: T.Note[]): Promise<void> => {
    const saveData = await this.getChromeSaveData();
    const blockCollection = newNotes.flatMap((note) => note.blocks);
    saveData.trie = this.makeTrie(blockCollection);
    await this.setChromeSaveData(saveData);
  };
  /**
   * Subscribe
   */
  chromeSaveDataWatcher_: ((newValue: T.ChromeSaveData) => void)[] = [];
  chromeSaveDataNotesWatcher_: ((newValue: T.Note[]) => void)[] = [];

  public async WatchChromeSaveData(callback: (newValue: T.ChromeSaveData) => void): Promise<void> {
    this.chromeSaveDataWatcher_.push(callback);

    // NOTE: Initial
    callback(await this.getChromeSaveData());
  }

  public WatchChromeSaveDataNotes(callback: (newValue: T.Note[]) => void): void {
    this.chromeSaveDataNotesWatcher_.push(callback);
  }

  private notifyChromeSaveDataWatcher(newValue: T.ChromeSaveData): void {
    this.chromeSaveDataWatcher_.forEach((callback) => callback(newValue));
  }

  private notifyChromeSaveDataNotesWatcher(newValue: T.Note[]): void {
    this.chromeSaveDataNotesWatcher_.forEach((callback) => callback(newValue));
  }

  /**
   * Notion
   */
  public async FetchNotionPageInfo(): Promise<any | null> {
    const saveData = await this.getChromeSaveData();
    const notionApi = saveData?.notionApi;
    const pageId = saveData?.notes[saveData?.noteIndex].notionPageInfo.pageId;

    const json = await this.fetchNotionPageInfo(notionApi, pageId);

    return json ? json : null;
  }

  public async FetchNotionPage(): Promise<any | null> {
    const saveData = await this.getChromeSaveData();
    const notionApi = saveData?.notionApi;
    const pageId = saveData?.notes[saveData?.noteIndex].notionPageInfo.pageId;

    const json = await this.fetchNotionPage(notionApi, pageId);

    return json ? json : null;
  }

  public transformJsonAsNotionPageInfo(json: any): T.NotionPageInfo {
    const noteInfo = T.CreateNotionPageInfo();

    noteInfo.fetchTime = Date.now();
    noteInfo.lastEditedTime = new Date(json.last_edited_time).getTime();
    noteInfo.pageId = json.id;
    noteInfo.title = json.properties.Name.title[0].plain_text;

    return noteInfo;
  }

  public transformJsonAsNotionPage(json: any): T.NotionPage {
    const newNotionPage = T.CreateNotionPage();

    json.forEach((block: any) => {
      if (block.type == "paragraph" && block.paragraph.rich_text.length !== 0) {
        const richTexts = block.paragraph.rich_text.map((text: any) => text.plain_text);
        const combinedText = richTexts.join("");
        newNotionPage.notionBlocks.push(combinedText);
      }
    });

    return newNotionPage;
  }

  public createBlocksByNotionPage(notionPage: T.NotionPage): T.Block[] {
    const newBlocks: T.Block[] = [];

    notionPage.notionBlocks.forEach((block) => {
      const newBlock = this.makeBlockByNotionBlock(block);
      if (!B.IsNullorUndefined(newBlock)) {
        newBlocks.push(newBlock);
      }
    });

    return newBlocks;
  }

  private async fetchNotionPage(notionApi: string, notionPageId: string): Promise<any> {
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

  private async fetchNotionPageInfo(notionApi: string, notionPageId: string): Promise<any> {
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

  private makeBlockValue(text: [T.BlockValueType, string]): T.BlockValue {
    const newValue = T.CreateBlockValue();
    newValue.type = text[0];
    newValue.value = text[1];
    switch (text[0]) {
      case T.BlockValueType.text:
        newValue.color = T.BlockValueColor.Normal;
        newValue.value = text[1];
        break;
      case T.BlockValueType.exampleText:
        newValue.color = T.BlockValueColor.Blue;
        newValue.value = text[1];
        break;
      case T.BlockValueType.warningText:
        newValue.color = T.BlockValueColor.Red;
        newValue.value = text[1];
        break;
      case T.BlockValueType.referenceText:
        newValue.color = T.BlockValueColor.Green;
        newValue.value = text[1];
        break;
    }
    return newValue;
  }

  private makeBlockByNotionBlock(notionBlock: string): T.Block | null {
    // TODO: 分割符號先使用 '/'
    const twoParts = B.DivideStringWithSymbol(notionBlock, "/");

    // TODO: 將Values分成更細微value
    if (!B.IsNullorUndefined(twoParts)) {
      const newBlock = T.CreateBlock();

      newBlock.blockKey = twoParts[0];

      const matchPatterns = this.divideStringWithPattern(twoParts[1]);
      matchPatterns?.forEach((pattern) => {
        newBlock.blockValues.push(this.makeBlockValue(pattern));
      });

      return newBlock;
    }

    return null;
  }

  public makeTrie(blockCollection: T.Block[]): T.Trie {
    const newTrie = T.CreateTrie();
    blockCollection.forEach((block) => {
      T.InsertTrie(newTrie, block);
    });
    return newTrie;
  }
}
