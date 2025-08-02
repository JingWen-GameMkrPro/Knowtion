import { IsNullorUndefined } from "./utility";

export interface TrieNode {
  children: { [key: string]: TrieNode };
  values: Value[][];
  isEnd: boolean;
}

export function CreateTrieNode(): TrieNode {
  return {
    children: {},
    values: [],
    isEnd: true,
  };
}

export interface Trie {
  root: TrieNode;
}

export function CreateTrie(): Trie {
  return {
    root: CreateTrieNode(),
  };
}

export function InsertTrie(trie: Trie, noteLine: NoteLine) {
  let currentNode: TrieNode = trie.root;
  for (const char of noteLine.key) {
    if (!currentNode.children[char]) {
      currentNode.children[char] = CreateTrieNode();
    }
    currentNode = currentNode.children[char];
  }

  currentNode.isEnd = true;
  currentNode.values.push(noteLine.values);
}

// 要儲存到chrome storage的所有資料
export interface StorageObject {
  // USER SETTING
  notionApi: string;

  isHighlight: boolean;

  noteListIndex: number;
  // NOTE
  noteList: [NoteInfo, OriginData, Note][];

  trie: Trie;
}

export const LOCAL_STORAGE_KEY = {
  STORAGE_OBJECT: "storageObject",
} as const;

// Notion JSON 提取的 Page Info
export interface NoteInfo {
  pageId: string; //筆記ID

  title: string; //筆記標題

  lastEditedTime: Number;

  fetchTime: Number;
}

export const DEFAULT_NOTE_INFO: NoteInfo = {
  pageId: "Default",
  title: "Default",
  lastEditedTime: new Number(),
  fetchTime: new Number(),
};

// Notion JSON 提取的 Blocks
export interface OriginData {
  notionPageBlocks: string[];
}
export const DEFAULT_ORIGIN_DATA: OriginData = {
  notionPageBlocks: [],
};

export interface Note {
  noteBlocks: NoteLine[]; //筆記內容
}
export const DEFAULT_NOTE: Note = {
  noteBlocks: [],
};

export interface NoteLine {
  key: string;
  values: Value[]; //區塊內容
}
export function CreateNoteLine() {
  return {
    key: "",
    values: [],
  };
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

export interface Value {
  color: BlockValueColor; //單行顏色
  type: BlockValueType; //單行類型
  content: string; //單行內容
}
export function CreateValue() {
  return {
    color: BlockValueColor.Normal,
    type: BlockValueType.text,
    content: "",
  };
}
