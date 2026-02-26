import { parse } from "node-html-parser";
import * as parser from "../parser/index.js";

function nodeToElement(node, cssMap) {
  if (node.nodeType === 3) {
    const value = node.text?.trim();
    if (!value) return null; 
    return {
      type: "text",
      style: {
        
         fontSize: 14, 
         color: "#000000" 
      }, 
      data: { value },
    };
  }
  if (!node.tagName) return null;

  const id = node.getAttribute("id");
  const dataType = node.getAttribute("data-type");
  const rawStyle = (id && cssMap[id]) || {};
  const absolute = parser.isAbsolute(rawStyle);
  const pageWidth = 794;
  const pageHeight = 1123;

  const style = {
    ...rawStyle,
    color: parser.normalizeColor(rawStyle.color)??"#000000",
    background: parser.normalizeColor(rawStyle.background),
    fontSize: parser.normalizeNumber(rawStyle.fontSize),
    width:
      parser.normalizeNumber(rawStyle.width, pageWidth) ??
      parser.normalizeNumber(node.getAttribute("width"), pageWidth),
    height:
      parser.normalizeNumber(rawStyle.height) ??
      parser.normalizeNumber(node.getAttribute("height")),
  };

  const frame = absolute
    ? {
        ...parser.extractTranslate(rawStyle.transform),
        width: style.width,
        height: style.height,
      }
    : null;

console.log("parsing node with tag:",node.tagName," and data-type:",dataType);  

if (dataType === "spl") {
  console.log("parsing SPL");
  const titleNode = node.querySelector(
    ':scope > [data-type="Text"]'
  );
  const title = titleNode?.text
    ?.replace(/\s+/g, " ")
    .trim() ?? "";

  const points = node
    .querySelectorAll('li[data-type="Text"]')
    .map(li =>
      li.text
        ?.replace(/\s+/g, " ")
        .trim()
    ) ;

  return {
    type: "spl",
    frame,
    style,
    data: {
      title,
      points,
    },
    children: [],
  };
}






if (dataType === "qa") {
  const { parseQA } = require("./qa_parser").default;
  return parseQA(node, cssMap, style);
}

  if (dataType === " text" || node.tagName === "P") {
    const value = node.text?.trim();
    if (!value) return null;
   //console.log("tag name is",node.tagName,"and the value is ",value);
        if(node.tagName==="B"){
          console.log("bold text found");
          style.fontWeight="bold";
        }
    return {
      type: "text",
      frame,
      style,
      data: { value },
    };
  }

  if (dataType === "image") {
    console.log("parsing image");
    return {
      type: "image",
      frame,
      style,
      data: { src: node.getAttribute("src") },
    };
  }

  if (dataType === "video") {
    return {
      type: "video",
      frame,
      style,
      data: { src: node.getAttribute("src"), controls: true },
    };
  }

  if (dataType === "audio") {
    return {
      type: "audio",
      frame,
      style,
      data: { src: node.getAttribute("src"), controls: true },
    };
  }

  if (dataType === "3d_object") {
    // const model = node.querySelector("model-viewer");
    // if (!model) return null;

    return {
      type: "model3d",
      frame,
      style,
      data: { src: "https://apidev.cloud/image/view/1770297630598-element_003_lithium.glb"},
    };
  }

if (dataType === "equation") {
  console.log("parsing equation");

  const annotation = node.querySelector(
    'annotation[encoding="application/x-tex"]'
  );


  const rawLatex =
    annotation?.text ||
    node.text?.trim();

  if (!rawLatex) return null;

  return {
    type: "math",
    frame,
    style,
    data: {
      value: rawLatex.replace(/\s+/g, " "),
      format: "latex",
    },
  };
}

  if(dataType==="table"){
    console.log("parsing table");
    const {parseTable}=require("./table_render");
    return parseTable(node,cssMap);
  } 
  if(node.tagName==="HR"){
    return {
      type: "divider",
      style,
      data: {},
    };
  }
  const layout = parser.resolveLayout(rawStyle);

  const children = node.childNodes
    .map(child => nodeToElement(child, cssMap))
    .filter(Boolean);

  if (!children.length) return null;

  return {
    type: layout,
    id,
    style,
    children,
  };
}
export {
  nodeToElement,
};
