import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Save an input JSON (with pages as an object) to outputs/<title>/
 * - Creates folder named by title
 * - Writes each page file using the page `name` (e.g. "1.json") with { name, html, css }
 * - Writes a `book.json` with basic metadata and empty changelog
 */
export default function saveInput(inputJson) {
  try {
    if (!inputJson || !inputJson.title) {
      throw new Error('Invalid input: missing title');
    }

    const titleRaw = inputJson.title;
    // sanitize folder name by replacing path separators and trimming
    const title = String(titleRaw).replace(/[\\/:*?"<>|]/g, '').trim() || 'Untitled';

    const booksDir = join(__dirname, '..', 'inputs');
    const bookDir = join(booksDir, title);

    if (!existsSync(booksDir)) mkdirSync(booksDir, { recursive: true });
    if (!existsSync(bookDir)) mkdirSync(bookDir, { recursive: true });

    const pagesObj = inputJson.pages || {};
    const pageKeys = Object.keys(pagesObj);

    // Save each page as-is using the provided `name` field
    pageKeys.forEach((key) => {
      const page = pagesObj[key];
      const fileName = page.name || `${key}.json`;
      const filePath = join(bookDir, fileName);

      const pageData = {
        name: page.name,
        html: page.html,
        css: page.css,
      };

      writeFileSync(filePath, JSON.stringify(pageData, null, 2), 'utf-8');
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

    const bookJsonPath = join(bookDir, 'book.json');
    writeFileSync(bookJsonPath, JSON.stringify(bookMeta, null, 2), 'utf-8');
    console.log(`✅ Saved book metadata: ${bookJsonPath}`);

    return { status: 'ok', title, pages: pageKeys.length };
  } catch (err) {
    console.error('Error in saveInput:', err.message);
    throw err;
  }
};
