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
  blockValuesCollection: Note.BlockValue[][];
  isEnd: boolean;
}

export function CreateTrieNode(): TrieNode {
  return {
    children: {},
    blockValuesCollection: [],
    isEnd: false,
  };
}
export function InsertTrie(trie: Trie, noteLine: Note.Block) {
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

export function SearchTrie(trie: Trie, key: string): Note.BlockValue[][] | null {
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

export function MakeTrie(blockCollection: Note.Block[]): Trie {
  const newTrie = CreateTrie();
  blockCollection.forEach((block) => {
    InsertTrie(newTrie, block);
  });
  return newTrie;
}
