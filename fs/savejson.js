import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export  function saveJson(json) {
  try {

    const bookTitle = json.title || "Untitled";
    const author = json.author || "Unknown";
    const image = json.image || "";
    const currentVersion = json.version || "1.0";
    const pages = json.pages || [];
    const booksDir = join(__dirname, "../outputs");
    const bookDir = join(booksDir, bookTitle);

    if (!existsSync(booksDir)) {
      mkdirSync(booksDir, { recursive: true });
    }

    let isNewBook = false;
    let previousVersion = null;
    let changelog = [];
    if (!existsSync(bookDir)) {
      mkdirSync(bookDir, { recursive: true });
      isNewBook = true;
      console.log(`📖 Created new book directory: ${bookTitle}`);
    } else {
      console.log(`📖 Book directory exists: ${bookTitle}`);
      
      const existingBookJsonPath = join(bookDir, "book.json");
      if (existsSync(existingBookJsonPath)) {
        try {
          const existingBook = JSON.parse(readFileSync(existingBookJsonPath, "utf-8"));
          previousVersion = existingBook.version;
          changelog = existingBook.changelog || [];
        } catch (e) {
          console.error("Error reading existing book.json:", e.message);
        }
      }
    }

    const changedPages = [];
    if (!isNewBook && pages.length > 0) {
      pages.forEach((page) => {
        const pageFileName = `${page.page}.json`;
        const pageFilePath = join(bookDir, pageFileName);

        if (existsSync(pageFilePath)) {
          try {
            const existingPage = JSON.parse(readFileSync(pageFilePath, "utf-8"));
            const pageString = JSON.stringify(page);
            const existingString = JSON.stringify(existingPage);

            if (pageString !== existingString) {
              changedPages.push(page.page);
            }
          } catch (e) {
            changedPages.push(page.page);
          }
        } else {
          changedPages.push(page.page);
        }
      });
    }

    const bookMetadata = {
      title: bookTitle,
      version: currentVersion,
      author: author,
      image: image,
      createdAt: new Date().toISOString(),
      changelog: changelog,
    };

    if (isNewBook) {
      changelog.push({
        version: currentVersion,
        type: "created",
        timestamp: new Date().toISOString(),
        message: "Book created",
        pagesChanged: [],
      });
    } else if (changedPages.length > 0) {
      changelog.push({
        version: currentVersion,
        type: "updated",
        timestamp: new Date().toISOString(),
        message: `Updated pages: ${changedPages.join(", ")}`,
        pagesChanged: changedPages,
        previousVersion: previousVersion,
      });
    }

    bookMetadata.changelog = changelog;


    const bookJsonPath = join(bookDir, "book.json");
    writeFileSync(bookJsonPath, JSON.stringify(bookMetadata, null, 2));
    console.log(`✅ Saved: ${bookJsonPath}`);

    if (pages.length > 0) {
      pages.forEach((page) => {
        const pageFileName = `${page.page}.json`;
        const pageFilePath = join(bookDir, pageFileName);
        const pageData = {
          page: page.page,
          filename: page.filename,
          id: page.id,
          size: page.size,
          background: page.background,
          layers: page.layers,
        };

        writeFileSync(pageFilePath, JSON.stringify(pageData, null, 2));
        console.log(`✅ Saved: ${pageFilePath}`);
      });
    }

    


    console.log(`\n📚 Book Processing Summary:`);
    console.log(`   Title: ${bookTitle}`);
    console.log(`   Version: ${currentVersion}`);
    console.log(`   Pages: ${pages.length}`);
    if (changedPages.length > 0) {
      console.log(`   Changed Pages: ${changedPages.join(", ")}`);
    }
    console.log(`   Location: ${bookDir}\n`);

  } catch (error) {
    console.error("Error in saveJson:", error.message);
    throw error;
  }
};