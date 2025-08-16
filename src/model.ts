import * as B from "./commonBehavior";
import * as Chrome from "./chromeModel";
import * as Note from "./noteModel";
import * as Trie from "./trieModel";
export class Model {
  constructor() {
    this.WatchChromeSaveDataNotes(this.updateTrie);
  }

  /**
   * Chrome
   */

  // Chrome: init save data
  public async InitChromeSaveData(): Promise<void> {
    const initValue = await Chrome.InitChromeSaveData();
    this.notifyChromeSaveDataWatcher(initValue);
  }

  // Chrome: get save data
  private async getChromeSaveData(): Promise<Chrome.ChromeSaveData> {
    let saveData = await Chrome.GetChromeSaveData();

    // Local first time to use
    if (saveData == null) {
      saveData = await Chrome.InitChromeSaveData();
    }

    return saveData;
  }

  // Chrome: set save data
  private async setChromeSaveData(newValue: Chrome.ChromeSaveData): Promise<void> {
    await Chrome.SetChromeSaveData(newValue);
    this.notifyChromeSaveDataWatcher(newValue);
  }

  // UserInput: update current note
  public async UpdateCurrentNote(newNote: Note.Note) {
    const saveData = await this.getChromeSaveData();
    saveData.notes[saveData.noteIndex] = newNote;
    await this.setChromeSaveData(saveData);
    this.notifyChromeSaveDataNotesWatcher(saveData.notes);
  }

  // UserInput: add new note
  public async AddNewNote() {
    var saveData = await this.getChromeSaveData();
    saveData.notes.push(Note.CreateNote());
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
  // NOTE: This method is a callback, its 'this' context will not be the class instance, causing a 'this' binding error.
  // NOTE: Use an arrow function to auto maintain the class instance context.
  private updateTrie = async (newNotes: Note.Note[]): Promise<void> => {
    const saveData = await this.getChromeSaveData();
    const blockCollection = newNotes.flatMap((note) => note.blocks);
    saveData.trie = this.makeTrie(blockCollection);
    await this.setChromeSaveData(saveData);
  };

  /**
   * Subscribe
   */
  chromeSaveDataWatcher_: ((newValue: Chrome.ChromeSaveData) => void)[] = [];
  chromeSaveDataNotesWatcher_: ((newValue: Note.Note[]) => void)[] = [];

  public async WatchChromeSaveData(
    callback: (newValue: Chrome.ChromeSaveData) => void
  ): Promise<void> {
    this.chromeSaveDataWatcher_.push(callback);

    // NOTE: Initial
    callback(await this.getChromeSaveData());
  }

  public WatchChromeSaveDataNotes(callback: (newValue: Note.Note[]) => void): void {
    this.chromeSaveDataNotesWatcher_.push(callback);
  }

  private notifyChromeSaveDataWatcher(newValue: Chrome.ChromeSaveData): void {
    this.chromeSaveDataWatcher_.forEach((callback) => callback(newValue));
  }

  private notifyChromeSaveDataNotesWatcher(newValue: Note.Note[]): void {
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

  public transformJsonAsNotionPageInfo(json: any): Note.NotionPageInfo {
    const noteInfo = Note.CreateNotionPageInfo();

    noteInfo.fetchTime = Date.now();
    noteInfo.lastEditedTime = new Date(json.last_edited_time).getTime();
    noteInfo.pageId = json.id;
    noteInfo.title = json.properties.Name.title[0].plain_text;

    return noteInfo;
  }

  public transformJsonAsNotionPage(json: any): Note.NotionPage {
    const newNotionPage = Note.CreateNotionPage();

    json.forEach((block: any) => {
      if (block.type == "paragraph" && block.paragraph.rich_text.length !== 0) {
        const richTexts = block.paragraph.rich_text.map((text: any) => text.plain_text);
        const combinedText = richTexts.join("");
        newNotionPage.notionBlocks.push(combinedText);
      }
    });

    return newNotionPage;
  }

  public createBlocksByNotionPage(notionPage: Note.NotionPage): Note.Block[] {
    const newBlocks: Note.Block[] = [];

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

  private divideStringWithPattern(value: string): [Note.BlockValueType, string][] {
    const result: [Note.BlockValueType, string][] = [];
    const regex = /[^@~&]+|[@~&]\{[^}]*\}/g;
    const matches = value.match(regex);

    if (!matches) {
      return [];
    }

    // 映射符號到 T.BlockValueType
    const typeMap = {
      "@": Note.BlockValueType.exampleText,
      "~": Note.BlockValueType.warningText,
      "&": Note.BlockValueType.referenceText,
    };

    matches.forEach((match) => {
      let type: Note.BlockValueType = Note.BlockValueType.text;
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

  private makeBlockValue(text: [Note.BlockValueType, string]): Note.BlockValue {
    const newValue = Note.CreateBlockValue();
    newValue.type = text[0];
    newValue.value = text[1];
    switch (text[0]) {
      case Note.BlockValueType.text:
        newValue.color = Note.BlockValueColor.Normal;
        newValue.value = text[1];
        break;
      case Note.BlockValueType.exampleText:
        newValue.color = Note.BlockValueColor.Blue;
        newValue.value = text[1];
        break;
      case Note.BlockValueType.warningText:
        newValue.color = Note.BlockValueColor.Red;
        newValue.value = text[1];
        break;
      case Note.BlockValueType.referenceText:
        newValue.color = Note.BlockValueColor.Green;
        newValue.value = text[1];
        break;
    }
    return newValue;
  }

  private makeBlockByNotionBlock(notionBlock: string): Note.Block | null {
    // TODO: 分割符號先使用 '/'
    const twoParts = B.DivideStringWithSymbol(notionBlock, "/");

    // TODO: 將Values分成更細微value
    if (!B.IsNullorUndefined(twoParts)) {
      const newBlock = Note.CreateBlock();

      newBlock.blockKey = twoParts[0];

      const matchPatterns = this.divideStringWithPattern(twoParts[1]);
      matchPatterns?.forEach((pattern) => {
        newBlock.blockValues.push(this.makeBlockValue(pattern));
      });

      return newBlock;
    }

    return null;
  }

  public makeTrie(blockCollection: Note.Block[]): Trie.Trie {
    const newTrie = Trie.CreateTrie();
    blockCollection.forEach((block) => {
      Trie.InsertTrie(newTrie, block);
    });
    return newTrie;
  }
}
