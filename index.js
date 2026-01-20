/**
 * index.js
 * HTML + CSS → Book Page Model Compiler
 * FLOW + ABSOLUTE aware (FINAL)
 */

const express = require("express")
const cors = require("cors");
const { parse } = require("node-html-parser");
const css = require("css");
const {htmll,csss} = require('./inputParser.js')

const app = express();
app.use(cors());
app.use(express.json());

/* ======================================================
   CSS PARSER
====================================================== */

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

/* ======================================================
   NORMALIZERS
====================================================== */

function normalizeNumber(val) {
  if (val == null) return null;
  const m = val.toString().match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
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

/* ======================================================
   FLOW vs ABSOLUTE DETECTION  🔥 CORE FIX
====================================================== */

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

/* ======================================================
   LAYOUT HELPERS
====================================================== */

function resolveLayout(style = {}) {
  if (style.display === "flex") {
    return style["flex-direction"] === "column" ? "column" : "row";
  }
  return "column";
}

/* ======================================================
   NODE → ELEMENT COMPILER
====================================================== */

function nodeToElement(node, cssMap) {
  if (!node.tagName) return null;

  const id = node.getAttribute("id");
  const dataType = node.getAttribute("data-type");
  const rawStyle = (id && cssMap[id]) || {};
  const absolute = isAbsolute(rawStyle);

  const style = {
    ...rawStyle,
    color: normalizeColor(rawStyle.color),
    background: normalizeColor(rawStyle.background),
    fontSize: normalizeNumber(rawStyle.fontSize),
    width: normalizeNumber(rawStyle.width),
    height: normalizeNumber(rawStyle.height),
  };

  const frame = absolute
    ? {
        ...extractTranslate(rawStyle.transform),
        width: style.width,
        height: style.height,
      }
    : null;

  /* ---------- TEXT ---------- */
  if (dataType === "text" || node.tagName === "P") {
    const value = node.text?.trim();
    if (!value) return null;

    return {
      type: "text",
      frame,
      style,
      data: { value },
    };
  }

  /* ---------- IMAGE ---------- */
  if (dataType === "image") {
    return {
      type: "image",
      frame,
      style,
      data: { src: node.getAttribute("src") },
    };
  }

  /* ---------- VIDEO ---------- */
  if (dataType === "video") {
    return {
      type: "video",
      frame,
      style,
      data: { src: node.getAttribute("src"), controls: true },
    };
  }

  /* ---------- AUDIO ---------- */
  if (dataType === "audio") {
    return {
      type: "audio",
      frame,
      style,
      data: { src: node.getAttribute("src"), controls: true },   
    };
  }

  /* ---------- 3D MODEL ---------- */
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

  /* ---------- MATH ---------- */
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

  /* ---------- CONTAINER (FLOW) ---------- */
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

/* ======================================================
   HTML + CSS → BOOK MODEL
====================================================== */

function buildBookModel(html, cssText) {
  const root = parse(html);
  const body = root.querySelector("body");
  const cssMap = parseCSS(cssText);

  const bodyStyle = cssMap[body.getAttribute("id")] || {};

  const page = {
    id: "page-1",
    size: {
      width: normalizeNumber(bodyStyle.width) || 794,
      height: normalizeNumber(bodyStyle.height) || 1123,
    },
    background: normalizeColor(bodyStyle.background) || "#ffffff",
    layers: [
      {
        name: "content",
        elements: body.childNodes
          .map(n => nodeToElement(n, cssMap))
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

/* ======================================================
   API
====================================================== */
app.get("",(req,res)=>{
  res.status(200).json({data:"hai"});

})
app.post("/parse", (req, res) => {
  console.log("server running");
  try {
   
    console.log("got css and html");
    if (!htmll || !csss) {
      return res.status(400).json({ error: "html and css are required" });
    }

    res.json(buildBookModel(htmll, csss));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Parsing failed" });
  }
});

/* ======================================================
   START SERVER
====================================================== */

app.listen(3000, () => {
  console.log("📘 Book compiler running at http://localhost:3000");
});
