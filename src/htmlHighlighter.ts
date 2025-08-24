import * as Note from "./noteModel";
import * as Trie from "./trieModel";

export async function Highlight(root: Node, trie: Trie.Trie): Promise<void> {
  const startTime = performance.now();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Text): number => {
      // 1. Reject nodes that only contain whitespace.
      if (!/\S/.test(node.nodeValue ?? "")) {
        return NodeFilter.FILTER_REJECT;
      }

      // 2. Reject nodes that are inside an <input>, <textarea>, or any editable element.
      let el: HTMLElement | null = node.parentElement;
      while (el) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) {
          return NodeFilter.FILTER_REJECT;
        }
        el = el.parentElement;
      }

      // 3. Accept all other text nodes.
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Collect all acceptable text nodes.
  const textNodes: Text[] = [];
  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    textNodes.push(currentNode as Text);
  }

  // Analyze each text node for matches using the Trie.
  for (const textNode of textNodes) {
    const matches = collectMatchesInNode(textNode.nodeValue ?? "", trie.root);
    if (matches.length) {
      highlightMatches(textNode, matches, trie);
    }
  }

  // Record the end time
  const endTime = performance.now();

  // Calculate the execution time in milliseconds and seconds
  const executionTimeMs = endTime - startTime;
  const executionTimeSeconds = executionTimeMs / 1000;

  // Log the results to the console
  console.log(`執行開始時間 (毫秒): ${startTime.toFixed(2)}`);
  console.log(`執行完成時間 (毫秒): ${endTime.toFixed(2)}`);
  console.log(`總執行時間 (秒): ${executionTimeSeconds.toFixed(4)}`);
}

function collectMatchesInNode(text: string, trieRoot: Trie.TrieNode): HtmlMatchInfo[] {
  const matches: HtmlMatchInfo[] = [];
  const lowerText = text.toLowerCase();

  for (let i = 0; i < lowerText.length; i++) {
    let node: Trie.TrieNode = trieRoot;
    for (let j = i; j < lowerText.length; j++) {
      const currentChar = lowerText[j];
      if (!node.children?.[currentChar]) {
        break;
      }
      node = node.children[currentChar];
      if (node.isEnd) {
        const newMatch = CreateHtmlMatchInfo();
        newMatch.startIndex = i;
        newMatch.endIndex = j + 1;
        newMatch.key = lowerText.slice(i, j + 1);
        newMatch.blocks = node.blocks;
        matches.push(newMatch);
      }
    }
  }

  return matches;
}

function highlightMatches(node: Text, matches: HtmlMatchInfo[], trie: Trie.Trie): void {
  // Sort matches to ensure they are processed in order and to handle nested matches correctly.
  matches.sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex);

  let index2ValuesMap: { [key: number]: HtmlMatchInfo[] } = {};
  for (const match of matches) {
    for (let i = match.startIndex; i < match.endIndex; i++) {
      if (!index2ValuesMap[i]) {
        index2ValuesMap[i] = [];
      }
      index2ValuesMap[i].push(match);
    }
  }

  const domCopy = document.createDocumentFragment();
  const text = node.nodeValue ?? "";
  let cursor = 0;

  const indexs = Object.keys(index2ValuesMap);
  indexs.forEach((indexStr) => {
    const indexNum = Number(indexStr);
    const matches = index2ValuesMap[indexNum];

    if (indexNum > cursor) {
      domCopy.appendChild(document.createTextNode(text.slice(cursor, indexNum)));
    }

    let matchValues = "";
    matches.forEach((match, index) => {
      matchValues += constructTipByValues(match.key, match.blocks, trie);
      if (index < matches.length - 1) {
        matchValues += "<br>";
      }
    });

    const span = document.createElement("span");
    span.textContent = text[indexNum];
    span.className = "highlight";
    span.style.backgroundColor = "yellow";

    span.addEventListener("mouseover", (e: MouseEvent) => {
      const toolTip = getSharedTooltip();
      toolTip.innerHTML = matchValues;
      let posX = e.pageX;
      let posY = e.pageY + 10;
      toolTip.style.left = posX + "px";
      toolTip.style.top = posY + "px";
      toolTip.style.opacity = "1";
      setTimeout(adjustTooltipPosition, 0);
    });

    span.addEventListener("mouseout", () => {
      const tooltip = getSharedTooltip();
      tooltip.style.opacity = "0";
    });

    domCopy.appendChild(span);
    cursor = indexNum + 1;
  });

  // Append any remaining text after the last match.
  if (cursor < text.length) {
    domCopy.appendChild(document.createTextNode(text.slice(cursor)));
  }

  if (node.parentNode) {
    node.parentNode.replaceChild(domCopy, node);
  }
}

function adjustTooltipPosition(): void {
  const tooltip = getSharedTooltip();
  const rect: DOMRect = tooltip.getBoundingClientRect();
  let currentLeft: number = parseInt(tooltip.style.left, 10) || 0;
  let currentTop: number = parseInt(tooltip.style.top, 10) || 0;
  const margin: number = 10;

  if (rect.right > window.innerWidth) {
    currentLeft -= rect.right - window.innerWidth + margin;
  }
  if (rect.left < 0) {
    currentLeft = margin;
  }
  if (rect.bottom > window.innerHeight) {
    currentTop -= rect.bottom - window.innerHeight + margin;
  }
  if (rect.top < 0) {
    currentTop = margin;
  }

  tooltip.style.left = `${currentLeft}px`;
  tooltip.style.top = `${currentTop}px`;
}
declare global {
  interface Window {
    sharedTooltip: HTMLDivElement;
  }
}

function getSharedTooltip(): HTMLDivElement {
  if (!window.sharedTooltip) {
    const tooltip = document.createElement("div");
    tooltip.className = "shared-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.padding = "8px 12px";
    tooltip.style.background = "linear-gradient(135deg, #000000, #1a1a1a)";
    tooltip.style.color = "#f0f0f0";
    tooltip.style.borderRadius = "8px";
    tooltip.style.fontSize = "14px";
    tooltip.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    tooltip.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.5)";
    tooltip.style.zIndex = "10000";
    tooltip.style.pointerEvents = "none";
    tooltip.style.whiteSpace = "pre-line";
    tooltip.style.transition = "opacity 0.2s ease";
    tooltip.style.opacity = "0";
    document.body.appendChild(tooltip);
    window.sharedTooltip = tooltip;
  }
  return window.sharedTooltip;
}

function constructTipByValues(key: string, blocks: Note.Block[], trie: Trie.Trie): string {
  // Key
  let tip = `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold;">${key}</div>`;

  // Source
  if (blocks[0].sourceNoteInfo?.title) {
    tip += `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold; color: gray; font-size: 8px;">${blocks[0].sourceNoteInfo?.title}</div>`;
  }
  tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;

  blocks.forEach((block, i) => {
    if (i > 0) {
      tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;
    }

    block.blockValues.forEach((blockValue) => {
      switch (blockValue.type) {
        case Note.BlockValueType.text:
          tip += `<div style="padding:2px 0;">${blockValue.value}</div>`;
          break;
        case Note.BlockValueType.referenceText: {
          if (key === blockValue.value) {
            break;
          }
          const refNode = Trie.SearchTrie(trie, blockValue.value);
          if (refNode !== null) {
            tip += `<div style="background-color: ${tipColorMap.GREEN}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">`;
            refNode.forEach((refInfosObject) => {
              // Key
              tip += `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold;">${refInfosObject.blockKey}</div>`;

              // Source
              if (refInfosObject.sourceNoteInfo?.title) {
                tip += `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold; color: gray; font-size: 8px;">${refInfosObject.sourceNoteInfo?.title}</div>`;
              }
              tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;

              refInfosObject.blockValues.forEach((blockValue) => {
                switch (blockValue.type) {
                  case Note.BlockValueType.referenceText:
                  case Note.BlockValueType.warningText:
                    break;
                  case Note.BlockValueType.text:
                    tip += `<div style="padding:2px 0;">${blockValue.value}</div>`;
                    break;
                  case Note.BlockValueType.exampleText:
                    tip += `<div style="background-color: ${tipColorMap.BLUE}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">${blockValue.value}</div>`;
                    break;
                }
              });
            });
            tip += `</div>`;
          }
          break;
        }
        case Note.BlockValueType.warningText: {
          if (key === blockValue.value) {
            break;
          }
          const noticeNode = Trie.SearchTrie(trie, blockValue.value);
          if (noticeNode !== null) {
            tip += `<div style="background-color: ${tipColorMap.RED}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">`;
            noticeNode.forEach((noticeInfosObject) => {
              // Key
              tip += `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold;">${noticeInfosObject.blockKey}</div>`;

              // Source
              if (noticeInfosObject.sourceNoteInfo?.title) {
                tip += `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold; color: gray; font-size: 8px;">${noticeInfosObject.sourceNoteInfo?.title}</div>`;
              }
              tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;
              noticeInfosObject.blockValues.forEach((subInfo) => {
                switch (subInfo.type) {
                  case Note.BlockValueType.referenceText:
                  case Note.BlockValueType.warningText:
                    break;
                  case Note.BlockValueType.text:
                    tip += `<div style="padding:2px 0;">${subInfo.value}</div>`;
                    break;
                  case Note.BlockValueType.exampleText:
                    tip += `<div style="background-color: ${tipColorMap.BLUE}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">${subInfo.value}</div>`;
                    break;
                }
              });
            });
            tip += `</div>`;
          }
          break;
        }
        case Note.BlockValueType.exampleText:
          tip += `<div style="background-color: ${tipColorMap.BLUE}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">${blockValue.value}</div>`;
          break;
        default:
          console.error("This info doesn't have a valid type: ", blockValue);
          break;
      }
    });
  });

  return tip;
}
const tipColorMap = {
  GREEN: "rgb(0, 69, 0)",
  RED: "rgb(92, 0, 0)",
  BLUE: "rgb(0, 32, 65)",
};

export async function ClearHighlight() {
  const highlighted = document.querySelectorAll("span.highlight");
  highlighted.forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(span.textContent ?? "");
    parent.replaceChild(textNode, span);
    parent.normalize();
  });
}

/**
 * HTML matching Content's info
 */
export interface HtmlMatchInfo {
  startIndex: number;
  endIndex: number;
  key: string;
  blocks: Note.Block[];
}
export function CreateHtmlMatchInfo(): HtmlMatchInfo {
  return {
    startIndex: 0,
    endIndex: 0,
    key: "",
    blocks: [],
  };
}
