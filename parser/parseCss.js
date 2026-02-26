import css from "css";

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
export { parseCSS };