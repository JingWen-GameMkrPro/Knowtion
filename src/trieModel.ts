import * as Note from "./noteModel";
import * as Chrome from "./chromeModel";

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
  blocks: Note.Block[];
  isEnd: boolean;
}

export function CreateTrieNode(): TrieNode {
  return {
    children: {},
    blocks: [],
    isEnd: false,
  };
}
export function InsertTrie(trie: Trie, block: Note.Block) {
  let currentNode: TrieNode = trie.root;
  for (const char of block.blockKey) {
    if (!currentNode.children[char]) {
      currentNode.children[char] = CreateTrieNode();
    }
    currentNode = currentNode.children[char];
  }

  currentNode.isEnd = true;
  currentNode.blocks.push(block);
}

export function SearchTrie(trie: Trie, key: string): Note.Block[] | null {
  let currentNode: TrieNode = trie.root;
  for (const char of key) {
    if (!currentNode.children[char]) {
      // Can not find it
      return null;
    }
    currentNode = currentNode.children[char];
  }

  return currentNode.blocks;
}

export class Service {
  public static UpdateTrie(saveData: Chrome.ChromeSaveData): Chrome.ChromeSaveData {
    const blockCollection = saveData.notes.flatMap((note) => note.blocks);
    saveData.trie = this.makeTrie(blockCollection);
    return saveData;
  }
  private static makeTrie(blockCollection: Note.Block[]): Trie {
    const newTrie = CreateTrie();
    blockCollection.forEach((block) => {
      InsertTrie(newTrie, block);
    });
    return newTrie;
  }
}
