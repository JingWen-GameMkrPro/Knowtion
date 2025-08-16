import * as HtmlHighlighter from "./htmlHighlighter";
import * as ChromeRuntimeCommon from "./chromeRuntimeCommon";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case ChromeRuntimeCommon.TabMessageType.Highlight:
      HtmlHighlighter.Highlight(document.body, msg.trie);
      console.log("h" + sender);
      break;
    case ChromeRuntimeCommon.TabMessageType.Unhighlight:
      HtmlHighlighter.ClearHighlight();
      console.log("not h" + sender);

      break;
  }
  return true;
});

console.log("content ready！");
