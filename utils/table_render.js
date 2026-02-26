import {nodeToElement} from "./htmlParser.js";
function parseTable(tableNode, cssMap) {
  const rows = [];

  const trs = tableNode.querySelectorAll("tr");

  trs.forEach(tr => {
    const row = [];

    tr.querySelectorAll("td").forEach(td => {
      const children = td.childNodes
        .map( (n)=>{
          console.log("parsing table cell child", n.tagName, n.textContent);
          return nodeToElement(n, cssMap)})
        .filter(Boolean);

      row.push({
        type: "cell",
        style: cssMap[td.getAttribute("id")] || {},
        children,
      });
    });

    rows.push(row);
  });

  return {
    type: "table",
    style: cssMap[tableNode.getAttribute("id")] ||cssMap[tableNode.getAttribute("class")]|| {},
    rows,
  };
}
module.exports = {
  parseTable,
};