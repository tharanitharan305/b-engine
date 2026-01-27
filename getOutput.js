const fs = require("fs");

function getOutput() {
  const data = fs.readFileSync("./outputs/output.json", "utf-8");
  return JSON.parse(data);
}

module.exports = getOutput;
