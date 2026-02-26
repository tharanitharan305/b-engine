import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import savejson from "./fs/savejson.js";
import getOutput from "./fs/getOutput.js";
import { buildBookModel, buildBookModelFromJSON } from "./utils/htmlParser.js";
import { handleinputParser } from "./parser/inputParser.js";
import { streamToResponse } from "./utils/downloadFiles.js";
import saveInput from "./fs/saveInput.js";

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

import https from "https";
import http from "http";

import { log } from "console";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());

app.get("", (req, res) => {
  res.status(200).json({ version: "0.1" });
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


app.post('/savebook', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file upload (field name: file)' });

    const content = req.file.buffer.toString('utf-8');
    let inputJson;
    try {
      inputJson = JSON.parse(content);
    } catch (err) {
      return res.status(400).json({ error: 'Uploaded file is not valid JSON' });
    }

    if (!inputJson || !inputJson.title) return res.status(400).json({ error: 'JSON missing title' });

    const result = saveInput(inputJson);
    res.status(200).json({ status: 'ok', result });
  } catch (err) {
    console.error('Error in /savebook:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/getBook/:title",(req,res)=>{
  const bookTitle=req.params.title;
  const outputDir=path.join(__dirname,"outputs",bookTitle);
  
  try {
   
    const bookJsonPath = path.join(outputDir, "book.json");
    const bookJsonContent = fs.readFileSync(bookJsonPath, "utf-8");
    const bookMetadata = JSON.parse(bookJsonContent);
 
    const files = fs.readdirSync(outputDir);
    const pageFiles = files
      .filter(file => file.endsWith(".json") && file !== "book.json")
      .sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });

    const pages = pageFiles.map((file) => {
      const filePath = path.join(outputDir, file);
      const pageContent = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(pageContent);
    });
    

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
app.post('/download_file', async (req, res) => {

  try {
      console.log("Received download_file request",req.body.url);
      
  const fileUrl = req.body.url;
  console.log("Download request for URL:", fileUrl);
  if (!fileUrl) return res.status(400).json({ error: 'missing url' });

  const decoded = decodeURIComponent(fileUrl);

    const parsed = new URL(decoded);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'invalid protocol' });
    }                   


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

app.get('/video', async (req, res) => {
  try {
    log("Received video proxy request", req.query.url);
    const videoUrl = decodeURIComponent(req.query.url);
    if (!videoUrl) return res.status(400).send('Missing URL');

    const lib = videoUrl.startsWith('https') ? https : http;

const options = {
  headers: {
    Range: req.headers.range || 'bytes=0-',
    'User-Agent': 'Mozilla/5.0',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
};


    const proxyReq = lib.get(videoUrl, options, (proxyRes) => {
      // 🔥 Forward ALL important headers
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error(err);
      res.status(500).send('Video proxy error');
    });

  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => {
  console.log("📘 Book compiler v-0.1 running at http://localhost:3000 ");
});
