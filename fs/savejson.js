const fs = require("fs");
const path = require("path");

module.exports = function saveJson(json) {
  try {

    const bookTitle = json.title || "Untitled";
    const author = json.author || "Unknown";
    const image = json.image || "";
    const currentVersion = json.version || "1.0";
    const pages = json.pages || [];
    const booksDir = path.join(__dirname, "../outputs");
    const bookDir = path.join(booksDir, bookTitle);

    if (!fs.existsSync(booksDir)) {
      fs.mkdirSync(booksDir, { recursive: true });
    }

    let isNewBook = false;
    let previousVersion = null;
    let changelog = [];
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
      isNewBook = true;
      console.log(`📖 Created new book directory: ${bookTitle}`);
    } else {
      console.log(`📖 Book directory exists: ${bookTitle}`);
      
      const existingBookJsonPath = path.join(bookDir, "book.json");
      if (fs.existsSync(existingBookJsonPath)) {
        try {
          const existingBook = JSON.parse(fs.readFileSync(existingBookJsonPath, "utf-8"));
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
        const pageFilePath = path.join(bookDir, pageFileName);

        if (fs.existsSync(pageFilePath)) {
          try {
            const existingPage = JSON.parse(fs.readFileSync(pageFilePath, "utf-8"));
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


    const bookJsonPath = path.join(bookDir, "book.json");
    fs.writeFileSync(bookJsonPath, JSON.stringify(bookMetadata, null, 2));
    console.log(`✅ Saved: ${bookJsonPath}`);

    if (pages.length > 0) {
      pages.forEach((page) => {
        const pageFileName = `${page.page}.json`;
        const pageFilePath = path.join(bookDir, pageFileName);
        const pageData = {
          page: page.page,
          filename: page.filename,
          id: page.id,
          size: page.size,
          background: page.background,
          layers: page.layers,
        };

        fs.writeFileSync(pageFilePath, JSON.stringify(pageData, null, 2));
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