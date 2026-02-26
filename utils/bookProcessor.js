import fs from "fs";
import  path from "path";
import * as parserUtils from "../parser/index.js";

function processBookDirectory(bookDirPath) {
  try {

    const bookJsonPath = path.join(bookDirPath, "book.json");
    const bookJsonContent = fs.readFileSync(bookJsonPath, "utf-8");
    const bookMetadata = JSON.parse(bookJsonContent);
    const files = fs.readdirSync(bookDirPath);
    const pageFiles = files
      .filter(file => file.endsWith(".json") && file !== "book.json")
      .sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });
    const pages = pageFiles.map((file, index) => {
      const filePath = path.join(bookDirPath, file);
      const pageContent = fs.readFileSync(filePath, "utf-8");
      const pageData = JSON.parse(pageContent);
      const bookModel = parserUtils.buildBookModel(pageData.html, pageData.css);

      return {
        page: index + 1,
        filename: file,
        ...bookModel.book.pages[0], 
        content: bookModel,
      };
    });
    const outputJson = {
      title: bookMetadata.title,
      version: bookMetadata.version,
      author: bookMetadata.author,
      image: bookMetadata.image,
      pages: pages,
    };

    return outputJson;
  } catch (error) {
    console.error("Error processing book directory:", error);
    throw error;
  }
}

export { processBookDirectory };
