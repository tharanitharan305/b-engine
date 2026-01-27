const fs = require("fs");

const data = fs.readFileSync("./inputs/input.json", "utf-8");
const json = JSON.parse(data);

const htmll = json.html || "";
const csss = json.css || "";

module.exports = {
  htmll,
  csss
};
