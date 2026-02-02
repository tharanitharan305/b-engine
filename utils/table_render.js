const {nodeToElement} =require("./htmlParser.js");
function parseTable(tableNode, cssMap) {
  const rows = [];

  const trs = tableNode.querySelectorAll("tr");

  trs.forEach(tr => {
    const row = [];

    tr.querySelectorAll("td").forEach(td => {
      const children = td.childNodes
        .map(n => nodeToElement(n, cssMap))
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
    style: cssMap[tableNode.getAttribute("id")] || {},
    rows,
  };
}
module.exports = {
  parseTable,
};