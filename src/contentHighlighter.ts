import * as T from "./commonType";

export function ProcessHighlight(root: Node, trie: T.Trie): void {
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

function collectMatchesInNode(text: string, trieRoot: T.TrieNode): T.HtmlMatchInfo[] {
  const matches: T.HtmlMatchInfo[] = [];
  const lowerText = text.toLowerCase();

  for (let i = 0; i < lowerText.length; i++) {
    let node: T.TrieNode = trieRoot;
    for (let j = i; j < lowerText.length; j++) {
      const currentChar = lowerText[j];
      if (!node.children?.[currentChar]) {
        break;
      }
      node = node.children[currentChar];
      if (node.isEnd) {
        const newMatch = T.CreateHtmlMatchInfo();
        newMatch.startIndex = i;
        newMatch.endIndex = j + 1;
        newMatch.key = lowerText.slice(i, j + 1);
        newMatch.values = node.values;
        matches.push(newMatch);
      }
    }
  }

  return matches;
}

function highlightMatches(node: Text, matches: T.HtmlMatchInfo[], trie: T.Trie): void {
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

    // Add mouseover event listener for the tooltip.
    // span.addEventListener("mouseover", (e: MouseEvent) => {
    //   const toolTip = getSharedTooltip();
    //   // Assuming constructTipByInfos and getSharedTooltip are defined elsewhere
    //   toolTip.innerHTML = constructTipByInfos(key, values, trie);

    //   let posX = e.pageX;
    //   let posY = e.pageY + 10;
    //   toolTip.style.left = posX + "px";
    //   toolTip.style.top = posY + "px";
    //   toolTip.style.opacity = "1";
    //   setTimeout(adjustTooltipPosition, 0);
    // });

    // Add mouseout event listener to hide the tooltip.
    // span.addEventListener("mouseout", () => {
    //   const tooltip = getSharedTooltip();
    //   tooltip.style.opacity = "0";
    // });

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
