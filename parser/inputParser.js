import fs from "fs";
import path from "path";
import { processBookDirectory } from "../utils/bookProcessor.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const handleinputParser = (bookTitle) => {
  try {
    const inputDir = path.join(__dirname, "../inputs", bookTitle);

    if (!fs.existsSync(inputDir)) {
      throw new Error(`Directory not found: ${inputDir}`);
    }

    const bookJson = processBookDirectory(inputDir);
    return bookJson;
  } catch (error) {
    console.error("Error in handleinputParser:", error.message);
    throw error;
  }
};
export{ handleinputParser };