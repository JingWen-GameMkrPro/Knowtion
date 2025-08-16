import * as Chrome from "./chromeModel";
import * as ChromeRuntimeCommon from "./chromeRuntimeCommon";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && /^https?:/.test(tab.url)) {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });

    const saveData = await Chrome.Service.GetChromeSaveData();
    if (saveData.isHighlight) {
      chrome.tabs.sendMessage(tabId, {
        type: ChromeRuntimeCommon.TabMessageType.Highlight,
        trie: saveData.trie,
      });
    } else {
      chrome.tabs.sendMessage(tabId, {
        type: ChromeRuntimeCommon.TabMessageType.Unhighlight,
      });
    }
  }
  return true;
});

//Source from model
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  switch (msg && msg.type) {
    case ChromeRuntimeCommon.BackgroundMessageType.Debug:
      console.log("Received sendDebugMessage");
      break;
    case ChromeRuntimeCommon.BackgroundMessageType.UpdatedMode:
    case ChromeRuntimeCommon.BackgroundMessageType.UpdatedTrie:
      const tabId = await getCurrentActiveTabId();
      if (tabId !== null) {
        const saveData = await Chrome.Service.GetChromeSaveData();
        if (saveData.isHighlight) {
          chrome.tabs.sendMessage(tabId, {
            type: ChromeRuntimeCommon.TabMessageType.Highlight,
            trie: saveData.trie,
          });
        } else {
          chrome.tabs.sendMessage(tabId, {
            type: ChromeRuntimeCommon.TabMessageType.Unhighlight,
          });
        }
      }
      break;
  }
  return true;
});

async function getCurrentActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (activeTab && activeTab.id) {
    return activeTab.id;
  }

  return null;
}

console.log("background ready！");
