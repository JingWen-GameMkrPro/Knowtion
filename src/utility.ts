import { Value } from "./model";

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
