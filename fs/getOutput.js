const fs = require("fs");
const path = require("path");

function getOutput() {
  const outputDir = "./outputs";
  const allOutputs = {};

  try {
    const files = fs.readdirSync(outputDir);

    files.forEach((file) => {
      const filePath = path.join(outputDir, file);
      const stat = fs.statSync(filePath);

      // Only process files, not directories
      if (stat.isFile() && (file.endsWith(".json") || file.endsWith(".txt"))) {
        const data = fs.readFileSync(filePath, "utf-8");
        try {
          allOutputs[file] = JSON.parse(data);
        } catch (e) {
          // If not valid JSON, store as string
          allOutputs[file] = data;
        }
      }
    });

    return allOutputs;
  } catch (error) {
    console.error("Error reading outputs directory:", error);
    return {};
  }
}

module.exports = getOutput;
