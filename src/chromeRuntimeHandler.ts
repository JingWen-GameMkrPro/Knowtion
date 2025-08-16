import * as ChromeRuntimeCommon from "./chromeRuntimeCommon";

// Talk with background.ts
export class Service {
  public static SendMessage(type: ChromeRuntimeCommon.BackgroundMessageType) {
    switch (type) {
      case ChromeRuntimeCommon.BackgroundMessageType.Debug:
        this.sendDebugMessage();
        break;
      case ChromeRuntimeCommon.BackgroundMessageType.Highlight:
        this.sendHighlightMessage();
        break;
      case ChromeRuntimeCommon.BackgroundMessageType.Unhighlight:
        break;
      case ChromeRuntimeCommon.BackgroundMessageType.UpdatedTrie:
        this.sendUpdatedTrieMessage();
        break;
    }
  }

  private static sendDebugMessage() {
    console.log("Start sendDebugMessage");
    chrome.runtime.sendMessage({ type: ChromeRuntimeCommon.BackgroundMessageType.Debug });
  }

  private static sendHighlightMessage() {}
  private static sendUpdatedTrieMessage() {
    chrome.runtime.sendMessage({ type: ChromeRuntimeCommon.BackgroundMessageType.UpdatedTrie });
  }
}
