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

export function getChromeData<T>(key: string): T | null {
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

export function setChromeData<T>(key: string, value: T): void {
  try {
    // localStorage 只能儲存字串，所以需要將物件或值轉換為 JSON 字串
    const data = JSON.stringify(value);
    localStorage.setItem(key, data);
  } catch (e) {
    console.error(`儲存到 localStorage 失敗 (鍵: "${key}"):`, e);
  }
}

export function clearChromeData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("清除 localStorage 失敗:", e);
  }
}
