const fs = require("fs");
const path = require("path");
const { processBookDirectory } = require("../utils/bookProcessor.js");

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

module.exports = { handleinputParser };