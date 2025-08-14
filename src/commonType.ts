export interface Trie {
  root: TrieNode;
}

export function CreateTrie(): Trie {
  return {
    root: CreateTrieNode(),
  };
}

export interface TrieNode {
  children: { [key: string]: TrieNode };
  blockValuesCollection: BlockValue[][];
  isEnd: boolean;
}

export function CreateTrieNode(): TrieNode {
  return {
    children: {},
    blockValuesCollection: [],
    isEnd: false,
  };
}
export function InsertTrie(trie: Trie, noteLine: Block) {
  let currentNode: TrieNode = trie.root;
  for (const char of noteLine.blockKey) {
    if (!currentNode.children[char]) {
      currentNode.children[char] = CreateTrieNode();
    }
    currentNode = currentNode.children[char];
  }

  currentNode.isEnd = true;
  currentNode.blockValuesCollection.push(noteLine.blockValues);
}

export function SearchTrie(trie: Trie, key: string): BlockValue[][] | null {
  let currentNode: TrieNode = trie.root;
  for (const char of key) {
    if (!currentNode.children[char]) {
      // Can not find it
      return null;
    }
    currentNode = currentNode.children[char];
  }

  return currentNode.blockValuesCollection;
}

export interface ChromeSaveData {
  // USER SETTING
  notionApi: string;

  isHighlight: boolean;

  noteIndex: number;

  notes: Note[];

  trie: Trie;
}

export function CreateChromeSaveData(): ChromeSaveData {
  return {
    notionApi: "",
    isHighlight: false,
    noteIndex: 0,
    notes: [CreateNote()],
    trie: CreateTrie(),
  };
}

// export const LOCAL_STORAGE_KEY = {
//   STORAGE_OBJECT: "storageObject",
// } as const;

export interface Note {
  notionPageInfo: NotionPageInfo;
  notionPage: NotionPage;
  blocks: Block[];
}

export function CreateNote(): Note {
  return {
    notionPageInfo: CreateNotionPageInfo(),
    notionPage: CreateNotionPage(),
    blocks: [],
  };
}

export interface NotionPageInfo {
  pageId: string;

  title: string;

  lastEditedTime: Number;

  fetchTime: Number;
}

export function CreateNotionPageInfo(): NotionPageInfo {
  return {
    pageId: "",
    title: "",
    lastEditedTime: new Number(),
    fetchTime: new Number(),
  };
}

export interface NotionPage {
  notionBlocks: string[];
}

export function CreateNotionPage(): NotionPage {
  return {
    notionBlocks: [],
  };
}

export interface Block {
  blockKey: string;
  blockValues: BlockValue[]; //區塊內容
}

export function CreateBlock(): Block {
  return {
    blockKey: "",
    blockValues: [],
  };
}

export interface BlockValue {
  color: BlockValueColor;
  type: BlockValueType;
  value: string;
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

export function CreateBlockValue(): BlockValue {
  return {
    color: BlockValueColor.Normal,
    type: BlockValueType.text,
    value: "",
  };
}
