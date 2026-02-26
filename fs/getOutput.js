import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

function getOutput() {
  const outputDir = "./outputs";
  const allOutputs = {};

  try {
    const files = readdirSync(outputDir);

    files.forEach((file) => {
      const filePath = join(outputDir, file);
      const stat = statSync(filePath);

      // Only process files, not directories
      if (stat.isFile() && (file.endsWith(".json") || file.endsWith(".txt"))) {
        const data = readFileSync(filePath, "utf-8");
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

export { getOutput };
