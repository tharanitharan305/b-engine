const express = require("express")
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const savejson = require("./fs/savejson.js");
const getOutput = require("./fs/getOutput.js");
const { buildBookModel, buildBookModelFromJSON } = require("./utils/htmlParser.js");
const { handleinputParser } = require("./parser/inputParser.js");
const { streamToResponse } = require("./utils/downloadFiles");

const app = express();
app.use(cors());
app.use(express.json());

app.get("", (req, res) => {
  res.status(200).json({ data: "hai" });
});

app.post("/parse", (req, res) => {
  console.log("server running");
  try {
    console.log("got css and html");
    if (!htmll || !csss) {
      return res.status(400).json({ error: "html and css are required" });
    }
    const out = buildBookModel(htmll, csss);
    savejson(out);
    const newData = getOutput();
    res.json(newData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Parsing failed" });
  }
});
app.get("/getbookin/:title", (req, res) => {
 const bookTitle = req.params.title;
 console.log("Fetching book:", bookTitle);
const data = handleinputParser(bookTitle);
// console.log("Fetched data:", data);
   const processedBook = buildBookModelFromJSON(data);
  //  console.log("Processed book:", processedBook);
    savejson(processedBook);
    res.json(processedBook);

})

app.get("/getBook/:title",(req,res)=>{
  const bookTitle=req.params.title;
  const outputDir=path.join(__dirname,"outputs",bookTitle);
  
  try {
    // Read book.json from outputs directory
    const bookJsonPath = path.join(outputDir, "book.json");
    const bookJsonContent = fs.readFileSync(bookJsonPath, "utf-8");
    const bookMetadata = JSON.parse(bookJsonContent);
    
    // Get all JSON files except book.json and sort them numerically
    const files = fs.readdirSync(outputDir);
    const pageFiles = files
      .filter(file => file.endsWith(".json") && file !== "book.json")
      .sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });
    
    // Read and combine all page files
    const pages = pageFiles.map((file) => {
      const filePath = path.join(outputDir, file);
      const pageContent = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(pageContent);
    });
    
    // Combine book metadata with all pages
    const combinedOutput = {
      ...bookMetadata,
      pages: pages
    };
    
    res.json(combinedOutput);
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ error: "Failed to fetch book" });
  }
}
)
app.get("/getbooks", (req, res) => {
  try {
    const outputsDir = path.join(__dirname, "outputs");
    const books = [];

    if (!fs.existsSync(outputsDir)) {
      return res.json(books);
    }

    const directories = fs.readdirSync(outputsDir);

    directories.forEach((dir) => {
      const dirPath = path.join(outputsDir, dir);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory()) {
        const bookJsonPath = path.join(dirPath, "book.json");

        if (fs.existsSync(bookJsonPath)) {
          try {
            const bookData = JSON.parse(fs.readFileSync(bookJsonPath, "utf-8"));
            
            books.push({
              title: bookData.title || dir,
              version: bookData.version || "1.0",
              author: bookData.author || "Unknown",
              image: bookData.image || "https://placehold.net/300x208.png",
              createdAt: bookData.createdAt,
              changelog: bookData.changelog || [],
            });
          } catch (e) {
            console.error(`Error reading book.json in ${dir}:`, e.message);
          }
        }
      }
    });

    console.log(`📚 Found ${books.length} books`);
    res.json(books);
  } catch (err) {
    console.error("Error in /getbooks:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch books" });
  }
});
app.get('/download_file', async (req, res) => {

  try {
      console.log("Received download_file request");
  const fileUrl = req.body.url;
  console.log("Download request for URL:", fileUrl);
  if (!fileUrl) return res.status(400).json({ error: 'missing url' });

  const decoded = decodeURIComponent(fileUrl);
    // basic validation
    const parsed = new URL(decoded);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'invalid protocol' });
    }                   

    // Stream remote file to client
    await streamToResponse(decoded, res);
  } catch (err) {
    console.error('download_file error', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download file', message: err.message });
    } else {
      res.end();
    }
  }
});
app.listen(3000, () => {
  console.log("📘 Book compiler running at http://localhost:3000");
});
