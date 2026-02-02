const { parse } = require("node-html-parser");
const css = require("css");

function parseCSS(cssText) {
  const ast = css.parse(cssText);
  const map = {};

  ast.stylesheet.rules.forEach(rule => {
    if (rule.type !== "rule") return;

    rule.selectors.forEach(sel => {
      if (!sel.startsWith("#")) return;

      const id = sel.slice(1);
      map[id] = map[id] || {};

      rule.declarations.forEach(d => {
        if (d.type === "declaration") {
          map[id][d.property] = d.value;
        }
      });
    });
  });

  return map;
}

function normalizeNumber(val, parentSize = null) {
  if (val == null) return null;

  const str = val.toString().trim();

  if (str.endsWith("%")) {
    if (parentSize == null) return null;
    const percent = parseFloat(str);
    return (percent / 100) * parentSize;
  }

  if (str.endsWith("px")) {
    return parseFloat(str);
  }

  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }

  return null;
}

function normalizeColor(value) {
  if (!value || typeof value !== "string") return null;

  const v = value.trim().toLowerCase();

  const named = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    grey: "#808080",
    transparent: "#00000000",
  };

  if (named[v]) return named[v];

  if (v.startsWith("rgb")) {
    const nums = v.match(/\d+/g);
    if (!nums || nums.length < 3) return null;
    return (
      "#" +
      nums.slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")
    );
  }

  if (v.startsWith("#") && v.length === 4) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }

  if (v.startsWith("#") && v.length === 7) {
    return v;
  }

  return null;
}

function extractTranslate(transform = "") {
  const x = transform.match(/translateX\(([-\d.]+)px\)/);
  const y = transform.match(/translateY\(([-\d.]+)px\)/);
  return {
    x: x ? Number(x[1]) : 0,
    y: y ? Number(y[1]) : 0,
  };
}

function isAbsolute(style = {}) {
  return (
    !!style.transform ||
    style.position === "absolute" ||
    style.position === "relative" ||
    style.top ||
    style.left ||
    style.right ||
    style.bottom
  );
}

function resolveLayout(style = {}) {
  if (style.display === "flex") {
    return style["flex-direction"] === "column" ? "column" : "row";
  }
  return "column";
}

function nodeToElement(node, cssMap) {
  if (node.nodeType === 3) {
    const value = node.text?.trim();
    if (!value) return null; // Skip empty whitespace
    return {
      type: "text",
      style: {
         // Inherit generic text styles or defaults here if needed
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
  const absolute = isAbsolute(rawStyle);
  const pageWidth = 794;
  const pageHeight = 1123;

  const style = {
    ...rawStyle,
    color: normalizeColor(rawStyle.color)??"#000000",
    background: normalizeColor(rawStyle.background),
    fontSize: normalizeNumber(rawStyle.fontSize),
    width:
      normalizeNumber(rawStyle.width, pageWidth) ??
      normalizeNumber(node.getAttribute("width"), pageWidth),
    height:
      normalizeNumber(rawStyle.height) ??
      normalizeNumber(node.getAttribute("height")),
  };

  const frame = absolute
    ? {
        ...extractTranslate(rawStyle.transform),
        width: style.width,
        height: style.height,
      }
    : null;
 console.log("tag name is ",node.tagName,"and the value is ",node.text);
  if (dataType === " text" || node.tagName === "P") {
    const value = node.text?.trim();
    if (!value) return null;
    console.log("tag name is ",node.tagName,"and the value is ",value);
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
    const model = node.querySelector("model-viewer");
    if (!model) return null;

    return {
      type: "model3d",
      frame,
      style,
      data: { src: model.getAttribute("src") },
    };
  }

  if (dataType === "equation") {
    const annotation = node.querySelector(
      'annotation[encoding="application/x-tex"]'
    );
    if (!annotation) return null;

    return {
      type: "math",
      frame,
      style,
      data: {
        value: annotation.text.trim(),
        format: "latex",
      },
    };
  }
  if(dataType==="table"){
    console.log("parsing table");
    const {parseTable}=require("./table_render");
    return parseTable(node,cssMap);
  } 
  const layout = resolveLayout(rawStyle);

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

function buildBookModel(html, cssText) {

  const root = parse(html);
  const body = root.querySelector("body");
  const cssMap = parseCSS(cssText);
  const bodyStyle = cssMap[body.getAttribute("id")] || {};

  const page = {
    id: "page-1",
    size: {
      width: 794,
      height: 1123,
    },
    background: normalizeColor(bodyStyle.background) || "#ffffff",
    layers: [
      {
        name: "content",
        elements: body.childNodes
          .map((n)=>{
const el=nodeToElement(n, cssMap);
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

function buildBookModelFromJSON(bookJSON) {
  
  const processedPages = bookJSON.pages.map((pageData) => {

    const htmlContent = pageData.content?.book?.pages?.[0] || pageData;

    
    return {
      page: pageData.page,
      filename: pageData.filename,
      id: pageData.id,
      size: pageData.size,
      background: pageData.background,
      layers: pageData.layers,
    };
  });

  return {
    title: bookJSON.title,
    version: bookJSON.version,
    author: bookJSON.author,
    image: bookJSON.image,
    pages: processedPages,
  };
}

module.exports = {
  parseCSS,
  normalizeNumber,
  normalizeColor,
  extractTranslate,
  isAbsolute,
  resolveLayout,
  nodeToElement,
  buildBookModel,
  buildBookModelFromJSON,
};
