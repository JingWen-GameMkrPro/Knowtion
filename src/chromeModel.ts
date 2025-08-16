import * as Note from "./noteModel";
import * as Trie from "./trieModel";

/**
 * Chrome Data
 */
const CHROME_SAVE_DATA_KEY = "chrome_save_data";

export interface ChromeSaveData {
  // USER SETTING
  notionApi: string;

  isHighlight: boolean;

  noteIndex: number;

  notes: Note.Note[];

  trie: Trie.Trie;
}

export function CreateChromeSaveData(): ChromeSaveData {
  return {
    notionApi: "",
    isHighlight: false,
    noteIndex: 0,
    notes: [Note.CreateNote()],
    trie: Trie.CreateTrie(),
  };
}

export class Service {
  public static async GetChromeSaveData(): Promise<ChromeSaveData> {
    try {
      const result = await chrome.storage.local.get(CHROME_SAVE_DATA_KEY);
      if (result[CHROME_SAVE_DATA_KEY] !== undefined && result[CHROME_SAVE_DATA_KEY] !== null) {
        return result[CHROME_SAVE_DATA_KEY] as ChromeSaveData;
      } else {
        return await this.InitChromeSaveData();
      }
    } catch (e) {
      console.error("Fail to GetChormeData: ", e);
      throw new Error("Failed to retrieve or initialize Chrome save data.");
    }
  }

  public static async SetChromeSaveData<T>(value: ChromeSaveData): Promise<void> {
    try {
      await chrome.storage.local.set({ [CHROME_SAVE_DATA_KEY]: value });
      console.log(value);
    } catch (e) {
      console.error(`Fail to SetChormeData: `, e);
    }
  }

  public static async InitChromeSaveData(): Promise<ChromeSaveData> {
    await this.clearChromeSaveData();
    const newChromeSaveData = CreateChromeSaveData();
    await this.SetChromeSaveData(newChromeSaveData);
    return newChromeSaveData;
  }

  private static async clearChromeSaveData(): Promise<void> {
    try {
      await chrome.storage.local.remove(CHROME_SAVE_DATA_KEY);
    } catch (e) {
      console.error("Fail to ClearChormeData: ", e);
    }
  }
}
