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
 * 從 chrome.storage.local 讀取資料。
 * @template T 讀取資料的預期型別。
 * @param {string} key 要讀取的資料鍵值。
 * @returns {Promise<T | null>} 包含資料的 Promise，如果沒有找到或發生錯誤則回傳 null。
 */
export async function getChromeData<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    // chrome.storage.get 回傳一個物件，鍵為 key，值為儲存的資料
    if (result[key] !== undefined) {
      // 在這裡不需要 JSON.parse，因為 chrome.storage.local.get 會自動處理
      return result[key] as T;
    }
  } catch (e) {
    console.error("讀取 chrome.storage 失敗:", e);
  }
  return null;
}

export async function setChromeData<T>(key: string, value: T): Promise<void> {
  try {
    // chrome.storage API 可以直接儲存物件，不需要 JSON.stringify
    await chrome.storage.local.set({ [key]: value });
  } catch (e) {
    console.error(`儲存到 chrome.storage 失敗 (鍵: "${key}"):`, e);
  }
}

/**
 * 從 chrome.storage.local 移除資料。
 * @param {string} key 要移除的資料鍵值。
 * @returns {Promise<void>} 移除操作完成後解析的 Promise。
 */
export async function clearChromeData(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key);
  } catch (e) {
    console.error("清除 chrome.storage 失敗:", e);
  }
}
