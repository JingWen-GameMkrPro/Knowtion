import * as Note from "./noteModel";
import * as Trie from "./trieModel";

export function Highlight(root: Node, trie: Trie.Trie): void {
  // Use a TreeWalker to efficiently find all relevant text nodes.
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
        newMatch.values = node.blockValuesCollection;
        matches.push(newMatch);
      }
    }
  }

  return matches;
}

function highlightMatches(node: Text, matches: HtmlMatchInfo[], trie: Trie.Trie): void {
  // Sort matches to ensure they are processed in order and to handle nested matches correctly.
  matches.sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex);

  // Use a DocumentFragment for efficient DOM manipulation.
  const domCopy = document.createDocumentFragment();
  const text = node.nodeValue ?? "";
  let cursor = 0;

  for (const match of matches) {
    const { startIndex, endIndex, key, values } = match;

    // Append the original text before the current match.
    if (startIndex > cursor) {
      domCopy.appendChild(document.createTextNode(text.slice(cursor, startIndex)));
    }

    // Create the highlight span element.
    const span = document.createElement("span");
    span.textContent = text.slice(startIndex, endIndex);
    span.className = "highlight";
    span.style.backgroundColor = "yellow";

    span.addEventListener("mouseover", (e: MouseEvent) => {
      const toolTip = getSharedTooltip();
      // Assuming constructTipByInfos and getSharedTooltip are defined elsewhere
      toolTip.innerHTML = constructTipByValues(key, values, trie);

      let posX = e.pageX;
      let posY = e.pageY + 10;
      toolTip.style.left = posX + "px";
      toolTip.style.top = posY + "px";
      toolTip.style.opacity = "1";
      setTimeout(adjustTooltipPosition, 0);
    });

    // Add mouseout event listener to hide the tooltip.
    span.addEventListener("mouseout", () => {
      const tooltip = getSharedTooltip();
      tooltip.style.opacity = "0";
    });

    domCopy.appendChild(span);
    cursor = endIndex;
  }

  // Append any remaining text after the last match.
  if (cursor < text.length) {
    domCopy.appendChild(document.createTextNode(text.slice(cursor)));
  }

  // Replace the original text node with the new DOM structure.
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

function constructTipByValues(key: string, valuess: Note.BlockValue[][], trie: Trie.Trie): string {
  let tip = `<div style="padding:4px 0; margin-bottom:4px; font-weight: bold;">${key}</div>`;
  tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;

  valuess.forEach((values, i) => {
    if (i > 0) {
      tip += `<div style="border-top:1px solid rgba(255,255,255,0.2); margin:4px 0;"></div>`;
    }

    values.forEach((value) => {
      switch (value.type) {
        case Note.BlockValueType.text:
          tip += `<div style="padding:2px 0;">${value.value}</div>`;
          break;
        case Note.BlockValueType.referenceText: {
          if (key === value.value) {
            break;
          }
          const refNode = Trie.SearchTrie(trie, value.value);
          if (refNode !== null) {
            tip += `<div style="background-color: ${tipColorMap.GREEN}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">`;
            refNode.forEach((refInfosObject) => {
              refInfosObject.forEach((subInfo) => {
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
        case Note.BlockValueType.warningText: {
          if (key === value.value) {
            break;
          }
          const noticeNode = Trie.SearchTrie(trie, value.value);
          if (noticeNode !== null) {
            tip += `<div style="background-color: ${tipColorMap.RED}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">`;
            noticeNode.forEach((noticeInfosObject) => {
              noticeInfosObject.forEach((subInfo) => {
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
          tip += `<div style="background-color: ${tipColorMap.BLUE}; padding:2px 4px; margin-bottom:2px; border-radius:4px;">${value.value}</div>`;
          break;
        default:
          console.error("This info doesn't have a valid type: ", value);
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

/**
 * HTML matching Content's info
 */
export interface HtmlMatchInfo {
  startIndex: number;
  endIndex: number;
  key: string;
  values: Note.BlockValue[][];
}
export function CreateHtmlMatchInfo(): HtmlMatchInfo {
  return {
    startIndex: 0,
    endIndex: 0,
    key: "",
    values: [],
  };
}
