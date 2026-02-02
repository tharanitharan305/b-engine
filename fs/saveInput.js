const fs = require('fs');
const path = require('path');

/**
 * Save an input JSON (with pages as an object) to outputs/<title>/
 * - Creates folder named by title
 * - Writes each page file using the page `name` (e.g. "1.json") with { name, html, css }
 * - Writes a `book.json` with basic metadata and empty changelog
 */
module.exports = function saveInput(inputJson) {
  try {
    if (!inputJson || !inputJson.title) {
      throw new Error('Invalid input: missing title');
    }

    const titleRaw = inputJson.title;
    // sanitize folder name by replacing path separators and trimming
    const title = String(titleRaw).replace(/[\\/:*?"<>|]/g, '').trim() || 'Untitled';

    const booksDir = path.join(__dirname, '..', 'inputs');
    const bookDir = path.join(booksDir, title);

    if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });
    if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

    const pagesObj = inputJson.pages || {};
    const pageKeys = Object.keys(pagesObj);

    // Save each page as-is using the provided `name` field
    pageKeys.forEach((key) => {
      const page = pagesObj[key];
      const fileName = page.name || `${key}.json`;
      const filePath = path.join(bookDir, fileName);

      const pageData = {
        name: page.name,
        html: page.html,
        css: page.css,
      };

      fs.writeFileSync(filePath, JSON.stringify(pageData, null, 2), 'utf-8');
      console.log(`✅ Saved page: ${filePath}`);
    });

    // Create book metadata with empty changelog
    const bookMeta = {
      title: inputJson.title,
      version: inputJson.version || '1.0',
      author: inputJson.author || '',
      image: inputJson.image || '',
      createdAt: new Date().toISOString(),
      changelog: [],
    };

    const bookJsonPath = path.join(bookDir, 'book.json');
    fs.writeFileSync(bookJsonPath, JSON.stringify(bookMeta, null, 2), 'utf-8');
    console.log(`✅ Saved book metadata: ${bookJsonPath}`);

    return { status: 'ok', title, pages: pageKeys.length };
  } catch (err) {
    console.error('Error in saveInput:', err.message);
    throw err;
  }
};
