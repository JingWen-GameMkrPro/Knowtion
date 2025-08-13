import * as ContentSearcher from "./contentHighlighter";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Process Highlight Task");

  if (msg.action === "HIGHLIGHT" && msg.trie) {
    try {
      console.log("Process Highlight Task");
      ContentSearcher.ProcessHighlight(document.body, msg.trie);
    } catch (e) {
      console.error("高亮時發生錯誤：", e);
    }
  }

  if (msg.action === "UNHIGHLIGHT") {
  }
  return true;
});

console.log("CONTENT.TS");
