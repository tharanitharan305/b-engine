import { parse } from "node-html-parser";
import * as utils from "../utils/index.js";
import * as parser from "../parser/index.js";
export function buildBookModel(html, cssText) {

  const root = parse(html);
  const body = root.querySelector("body");
  const cssMap = parser.parseCSS(cssText);
  const bodyStyle = cssMap[body.getAttribute("id")] || {};

  const page = {
    id: "page-1",
    size: {
      width: 794,
      height: 1123,
    },
    background: parser.normalizeColor(bodyStyle.background) || "#ffffff",
    layers: [
      {
        name: "content",
        elements: body.childNodes
          .map((n)=>{
const el=utils.nodeToElement(n, cssMap);
// console.log(el);
return el;
          })
          .filter(Boolean),
      },
    ],
  };

  return {
    version: "1.0",
    book: {
      pages: [page],
    },
  };
}