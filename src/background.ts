// import * as Utility from "./utility";

// interface NoteInfo {
//   key: string;
//   infos: any[]; // 這裡的型別可以更精確，視你的資料結構而定
//   // ... 其他屬性
// }

// interface DatabaseElement {
//   name: string;
//   notes: NoteInfo[];
// }

// interface TrieInfo {
//   source: string;
//   subInfos: any[];
// }

// // ====================
// // 資料儲存和狀態管理
// // ====================

// // 使用明確的型別和初始化
// let database: DatabaseElement[] = [];
// let isHighlightMode: boolean = false;
// let trie: Trie;

// // ====================
// // Trie 資料結構
// // ====================

// class TrieNode {
//   children: { [key: string]: TrieNode };
//   infos: TrieInfo[];
//   isEnd: boolean;

//   constructor() {
//     this.children = {};
//     this.infos = [];
//     this.isEnd = false;
//   }
// }

// class Trie {
//   root: TrieNode;

//   constructor() {
//     this.root = new TrieNode();
//   }

//   insert(key: string, subInfos: any[], source: string): void {
//     let node: TrieNode = this.root;
//     for (const char of key) {
//       if (!node.children[char]) {
//         node.children[char] = new TrieNode();
//       }
//       node = node.children[char];
//     }
//     node.isEnd = true;
//     node.infos.push({ source: source, subInfos: subInfos });
//   }

//   // 你可能還需要一個 search 函式，這裡暫時沒有
//   // search(key: string): TrieInfo[] | null { ... }
// }

// // ====================
// // Chrome Storage API
// // ====================

// async function getChromeDataAsync<T>(dataType: string): Promise<T | null> {
//   return new Promise<T | null>((resolve) => {
//     chrome.storage.local.get([dataType], (res) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error getting data from chrome.storage.local:", chrome.runtime.lastError);
//         resolve(null);
//       } else {
//         // 如果 res[dataType] 存在則回傳，否則回傳 null
//         resolve(res[dataType] || null);
//       }
//     });
//   });
// }

// // ====================
// // 核心邏輯
// // ====================

// async function constructTrieByDatabase(database: DatabaseElement[] | null): Promise<Trie> {
//   let newTrie = new Trie();
//   if (database) {
//     for (const element of database) {
//       for (const note of element.notes) {
//         newTrie.insert(note.key, note.infos, element.name);
//       }
//     }
//   }
//   return newTrie;
// }

// async function onStartUp(): Promise<void> {
//     var data = Utility.getChromeData<StorageObject>(LOCAL_STORAGE_KEY.STORAGE_OBJECT);

//   const highlightModeData = await getChromeDataAsync<boolean>("IsHighlightMode");
//   const databaseData = await getChromeDataAsync<DatabaseElement[]>("Database");

//   if (highlightModeData !== null) {
//     isHighlightMode = highlightModeData;
//   }
//   if (databaseData !== null) {
//     database = databaseData;
//   }

//   // 確保 trie 在資料載入後被重新建構
//   trie = await constructTrieByDatabase(database);
// }

// function sendTabMessage(): void {
//   // 通知目前前景分頁
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     if (tabs.length === 0 || tabs[0].id === undefined) return;
//     const tabId = tabs[0].id;

//     // 如果 trie 尚未被初始化，則不發送訊息
//     if (!trie) return;

//     if (isHighlightMode === true) {
//       chrome.tabs.sendMessage(tabId, {
//         action: "HIGHLIGHT",
//         trie, // 注意: 傳送 trie 物件可能會有問題，因為它包含方法，建議只傳送 TrieNode 結構
//       });
//     } else {
//       chrome.tabs.sendMessage(tabId, {
//         action: "UNHIGHLIGHT",
//       });
//     }
//   });
// }

// // ====================
// // 事件監聽器
// // ====================

// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   // 檢查 tabId 是否有效
//   if (tabId === chrome.tabs.TAB_ID_NONE) return;

//   if (changeInfo.status === "complete" && tab.url && /^https?:/.test(tab.url)) {
//     // 確保 init 已經被呼叫並完成
//     await onStartUp();
//     sendTabMessage();
//   }
// });

// chrome.runtime.onConnect.addListener((port) => {
//   if (port.name === "popup-background") {
//     port.onMessage.addListener(async (msg: { cmd: string }) => {
//       console.log("收到");
//       switch (msg.cmd) {
//         case "MODE_UPDATE":
//           const modeData = await getChromeDataAsync<boolean>("IsHighlightMode");
//           if (modeData !== null) {
//             isHighlightMode = modeData;
//           }
//           sendTabMessage();
//           break;
//         case "NOTE_UPDATE":
//           const dbData = await getChromeDataAsync<DatabaseElement[]>("Database");
//           if (dbData !== null) {
//             database = dbData;
//             trie = await constructTrieByDatabase(database);
//           }
//           sendTabMessage();
//           break;
//       }
//     });
//   }
// });

// // 於剛開chrome時，就會拿取筆記
// chrome.runtime.onStartup.addListener(onStartUp);

// // 頁面載入後立即初始化一次，以防 onStartup 未觸發
// // init();
