import { useState, useEffect } from "react";
import StyledCode from "./StyledCode";
import CodeBlock from "./CodeBlock";
import React from "react";
import { markdown } from "markdown";

function compareAndUpdateDomNode(old: Node, new_: Node) {
  if (typeof old === "undefined" || typeof new_ === "undefined") return;
  if (!new_.hasChildNodes()) {
    if (old.textContent !== new_.textContent) {
      const deltaContent = new_.textContent?.substring(
        old.textContent?.length || 0
      );
      if (deltaContent) {
        const deltaElement = document.createTextNode(deltaContent);
        // // Can't append to text only element, so append to parent
        old.parentNode?.appendChild(deltaElement);
      }
    }
    return;
  }
  const numOldChildNodes = old.hasChildNodes() ? old.childNodes.length : 0;
  for (let i = 0; i < numOldChildNodes; i++) {
    compareAndUpdateDomNode(old.childNodes[i], new_.childNodes[i]);
  }
  for (let i = numOldChildNodes; i < new_.childNodes.length; i++) {
    old.appendChild(new_.childNodes[i]);
  }
}

function ReactMarkdownStreamed(props: { source: string }) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    // Parse markdown to HTML string
    const html = markdown.toHTML(props.source);
    // Create a new DOM parser
    const parser = new DOMParser();
    // Parse the new HTML
    const newDoc = parser.parseFromString(html, "text/html");
    // Get the root node of the new HTML
    const newRoot = newDoc.body.firstChild;
    if (!newRoot) return;
    compareAndUpdateDomNode(rootRef.current, newRoot);
  }, [props.source]);

  return <div ref={rootRef} />;
}

export default ReactMarkdownStreamed;
