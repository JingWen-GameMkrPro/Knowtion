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

export async function GetChromeSaveData(): Promise<ChromeSaveData | null> {
  try {
    const result = await chrome.storage.local.get(CHROME_SAVE_DATA_KEY);
    if (result[CHROME_SAVE_DATA_KEY] !== undefined) {
      return result[CHROME_SAVE_DATA_KEY] as ChromeSaveData;
    }
  } catch (e) {
    console.error("Fail to GetChormeData: ", e);
  }
  return null;
}

export async function SetChromeSaveData<T>(value: ChromeSaveData): Promise<void> {
  try {
    await chrome.storage.local.set({ [CHROME_SAVE_DATA_KEY]: value });
    console.log(value);
  } catch (e) {
    console.error(`Fail to SetChormeData: `, e);
  }
}

export async function InitChromeSaveData(): Promise<ChromeSaveData> {
  await clearChromeSaveData();
  const newChromeSaveData = CreateChromeSaveData();
  await SetChromeSaveData(newChromeSaveData);
  return newChromeSaveData;
}

export async function clearChromeSaveData(): Promise<void> {
  try {
    await chrome.storage.local.remove(CHROME_SAVE_DATA_KEY);
  } catch (e) {
    console.error("Fail to ClearChormeData: ", e);
  }
}
