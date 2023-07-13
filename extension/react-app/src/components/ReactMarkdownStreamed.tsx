import { useState, useEffect } from "react";
import StyledCode from "./StyledCode";
import CodeBlock from "./CodeBlock";
import React from "react";
import { marked } from "marked";

/**
 * This function updates the old DOM node by only ever appending new nodes, instead of replacing content
 * It does this by recursively comparing the old and new DOM nodes
 * @param old - The old DOM node
 * @param new_ - The new DOM node
 */
function compareAndUpdateDomNode(old: Node, new_: Node) {
  console.log(old, new_);
  if (typeof old === "undefined" || typeof new_ === "undefined") return;

  // If the node types are completely different, replace the old node with the new node
  if (old.parentNode && old.nodeName !== new_.nodeName) {
    old.parentNode!.replaceChild(new_, old);
    return;
  } else if (old.nodeName !== new_.nodeName) {
    throw Error("old and new node names are different, but old has no parent");
  }

  // // Second base case: If all child nodes are text nodes
  // let allChildrenAreTextNodes = true;
  // for (let i = 0; i < old.childNodes.length; i++) {
  //   if (old.childNodes[i].nodeType !== Node.TEXT_NODE) {
  //     allChildrenAreTextNodes = false;
  //     break;
  //   }
  // }

  // if (allChildrenAreTextNodes) {
  //   if (old.textContent !== new_.textContent) {
  //     const deltaContent = new_.textContent!.slice(
  //       old.textContent!.length,
  //       new_.textContent!.length
  //     );
  //     const deltaNode = document.createTextNode(deltaContent);
  //     console.log(
  //       "2 delta: ",
  //       deltaContent,
  //       "|",
  //       old.textContent,
  //       "|",
  //       new_.textContent
  //     );
  //     old.appendChild(deltaNode);
  //   }
  //   return;
  // }
  // // Base case: if the old node is a text node, update it
  // if (old.nodeType === Node.TEXT_NODE) {
  //   if (old.textContent !== new_.textContent) {
  //     const deltaContent = new_.textContent!.slice(
  //       old.textContent!.length,
  //       new_.textContent!.length
  //     );
  //     const deltaNode = document.createTextNode(deltaContent);
  //     console.log("1 delta: ", deltaContent);
  //     old.parentNode!.appendChild(deltaNode);
  //   }
  //   return;
  // }

  // let i_old = 0;
  // let i_new = 0;
  // let oldTextContentBuffer = "";
  // let newTextContentBuffer = "";
  // let oldStillText = true;
  // while (i_old < old.childNodes.length || i_new < new_.childNodes.length) {
  //   if (old.childNodes[i_old].nodeType === Node.TEXT_NODE) {
  //     oldTextContentBuffer += old.childNodes[i_old].textContent!;
  //     oldStillText = true;
  //   } else {
  //     oldStillText = false;
  //   }

  //   if (oldStillText) {
  //   } else {
  //     if (new_.childNodes[i_new].nodeType === Node.TEXT_NODE) {
  //       newTextContentBuffer += new_.childNodes[i_new].textContent!;
  //       i_new++;
  //     } else {
  //     }
  //   }

  //   i_old++;
  // }

  let oldTextBuffer = "";
  let offset = 0;
  let i = 0;

  for (i; i < old.childNodes.length; i++) {
    if (old.childNodes[i].nodeType === Node.TEXT_NODE) {
      oldTextBuffer += old.childNodes[i].textContent!;
      offset++;
    } else if (oldTextBuffer.length > 0) {
      const newTextNode = new_.childNodes[i - offset];
      if (newTextNode.nodeType !== Node.TEXT_NODE)
        throw Error("new should be text node");
      const deltaContent = new_.textContent!.slice(
        oldTextBuffer.length,
        newTextNode.textContent!.length
      );
      const deltaNode = document.createTextNode(deltaContent);

      old.replaceChild(deltaNode, old.childNodes[i]);
      // old.appendChild(deltaNode);

      oldTextBuffer = "";
    } else {
      compareAndUpdateDomNode(old.childNodes[i], new_.childNodes[i - offset]);
      oldTextBuffer = "";
    }
  }

  if (oldTextBuffer.length > 0) {
    const newTextNode = new_.childNodes[i - offset];
    // if (newTextNode.nodeType !== Node.TEXT_NODE)
    //   throw Error("new should be text node");
    const deltaContent = new_.textContent!.slice(
      oldTextBuffer.length,
      newTextNode.textContent!.length
    );
    console.log("Adding text at", i - offset, deltaContent);
    const deltaNode = document.createTextNode(deltaContent);
    old.appendChild(deltaNode);
    oldTextBuffer = "";
    i++;
  }

  if (i - offset < new_.childNodes.length) {
    for (let j = i - offset; j < new_.childNodes.length; j++) {
      console.log("Appending new node: ", new_.childNodes[j]);
      // Backtrack to replace old text nodes that have become this other node

      // Initialize an empty string to accumulate the text content of the old nodes
      let accumulatedText = "";
      let newNodeText = new_.childNodes[j].textContent!;

      // Iterate over the child nodes of the old node in reverse order
      for (let i = old.childNodes.length - 1; i >= 0; i--) {
        let oldNode = old.childNodes[i];

        // Only consider text nodes
        if (oldNode.nodeType === Node.TEXT_NODE) {
          // Prepend the text content of the old node to the accumulated text
          accumulatedText = oldNode.textContent + accumulatedText;

          // If the accumulated text starts with the text content of the new node
          if (accumulatedText.endsWith(newNodeText)) {
            // Remove the old nodes that were included in the accumulated text
            for (let j = old.childNodes.length - 1; j >= i; j--) {
              old.removeChild(old.childNodes[j]);
            }

            break;
          }
        } else {
          break;
        }
      }

      old.appendChild(new_.childNodes[j]);
    }
  }

  // const numOldChildNodes = old.hasChildNodes() ? old.childNodes.length : 0;
  // console.log(numOldChildNodes);
  // for (let i = 0; i < numOldChildNodes; i++) {
  //   compareAndUpdateDomNode(old.childNodes[i], new_.childNodes[i]);
  // }
  // for (let i = numOldChildNodes; i < new_.childNodes.length; i++) {
  //   console.log("Appending new node: ", new_.childNodes[i]);
  //   old.appendChild(new_.childNodes[i]);
  // }
}

function ReactMarkdownStreamed(props: { source: string }) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    // Parse markdown to HTML string
    const html = marked.parse(props.source);
    // Create a new DOM parser
    const parser = new DOMParser();
    // Parse the new HTML
    const newDoc = parser.parseFromString(html, "text/html");
    // Get the root node of the new HTML
    if (!newDoc.body.firstChild) return;

    const newRootDiv = document.createElement("div");
    for (let child of newDoc.body.childNodes) {
      newRootDiv.appendChild(child);
    }

    console.log("Source: ", props.source);

    compareAndUpdateDomNode(rootRef.current, newRootDiv);
  }, [props.source]);

  return (
    <div>
      <div ref={rootRef} />
    </div>
  );
}

export default ReactMarkdownStreamed;
