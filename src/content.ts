import * as HtmlHighlighter from "./htmlHighlighter";
import * as ChromeRuntimeCommon from "./chromeRuntimeCommon";

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  switch (msg.type) {
    case ChromeRuntimeCommon.TabMessageType.Highlight:
      await HtmlHighlighter.ClearHighlight();
      await HtmlHighlighter.Highlight(document.body, msg.trie);
      break;
    case ChromeRuntimeCommon.TabMessageType.Unhighlight:
      await HtmlHighlighter.ClearHighlight();
      break;
  }
  return true;
});

console.log("content ready！");
