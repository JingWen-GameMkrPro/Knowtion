import * as Chrome from "./chromeModel";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && /^https?:/.test(tab.url)) {
    // 在發送訊息之前，先確保 content script 已被注入
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });

    // 確保 content script 載入後再發送訊息
    const chromeData = await Chrome.Service.GetChromeSaveData();
    chrome.tabs.sendMessage(tabId, {
      action: "HIGHLIGHT",
      trie: chromeData?.trie,
    });
  }
});

// DEBUG
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 透過屬性檢查來確認訊息的意圖
  if (message && message.action === "NOTIFY_BACKGROUND") {
    console.log("從 popup 接收到訊息: ", message);
    sendResponse("背景腳本已收到訊息並處理完成！");
  }
});
console.log("background");
