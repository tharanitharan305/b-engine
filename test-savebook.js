const saveInput = require('./fs/saveInput');
const path = require('path');
const fs = require('fs');

const sample = {
  "title": "Tamil Guide-5",
  "version":"1.1",
  "author":"B-leaners",
  "image":"assets/images/book1.png",
  "pages":{
    "page-1":{
      "name":"1.json",
      "html":"<div>Page 1</div>",
      "css":"body{color:#000}"
    },
    "page-2":{
      "name":"2.json",
      "html":"<div>Page 2</div>",
      "css":"body{color:#111}"
    }
  }
};

try{
  const res = saveInput(sample);
  console.log('Result:', res);
  // show created files
  const outDir = path.join(__dirname, 'outputs', sample.title);
  console.log('Files in', outDir, ':', fs.readdirSync(outDir));
} catch (err) {
  console.error('Test failed:', err.message);
}
