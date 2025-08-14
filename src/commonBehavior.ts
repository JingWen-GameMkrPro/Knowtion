import * as T from "./commonType";

export function IsNullorUndefined<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

export function IsAnyNullOrUndefined<T extends readonly any[]>(...values: T): boolean {
  return values.some((value) => IsNullorUndefined(value));
}

export function DivideStringWithSymbol(value: string, symbol: string): [string, string] | null {
  const parts = value.split(symbol);
  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  return null;
}

/**
 * Chrome Data
 */
const CHROME_SAVE_DATA_KEY = "chrome_save_data";

export async function GetChromeSaveData(): Promise<T.ChromeSaveData | null> {
  try {
    const result = await chrome.storage.local.get(CHROME_SAVE_DATA_KEY);
    if (result[CHROME_SAVE_DATA_KEY] !== undefined) {
      return result[CHROME_SAVE_DATA_KEY] as T.ChromeSaveData;
    }
  } catch (e) {
    console.error("Fail to GetChormeData: ", e);
  }
  return null;
}

export async function SetChromeSaveData<T>(value: T.ChromeSaveData): Promise<void> {
  try {
    await chrome.storage.local.set({ [CHROME_SAVE_DATA_KEY]: value });
  } catch (e) {
    console.error(`Fail to SetChormeData: `, e);
  }
}

export async function InitChromeSaveData(): Promise<T.ChromeSaveData> {
  await clearChromeSaveData();
  const newChromeSaveData = T.CreateChromeSaveData();
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
