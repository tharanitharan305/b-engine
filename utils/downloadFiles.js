const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

function parseFilenameFromContentDisposition(header) {
  if (!header) return null;
  const match = header.match(/filename\*=UTF-8''([^;\n\r]+)/i) || header.match(/filename="?([^";\n\r]+)"?/i);
  if (match) return decodeURIComponent(match[1].trim());
  return null;
}

function guessExtensionFromContentType(contentType) {
  if (!contentType) return '';
  const map = {
    'audio/mpeg': '.mp3',
    'video/mp4': '.mp4',
    'model/gltf-binary': '.glb',
    'application/octet-stream': '',
    'application/json': '.json'
  };
  const ct = contentType.split(';')[0].trim().toLowerCase();
  return map[ct] || '';
}

function getProtocol(urlObj) {
  return urlObj.protocol === 'http:' ? http : https;
}

async function fetchResponse(url, maxRedirects = 5) {
  if (maxRedirects < 0) throw new Error('Too many redirects');
  const urlObj = new URL(url);
  const lib = getProtocol(urlObj);

  return new Promise((resolve, reject) => {
    const req = lib.get(urlObj, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {

        const next = new URL(res.headers.location, urlObj).toString();
        res.resume(); 
        fetchResponse(next, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
        reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
        res.resume();
        return;
      }

      resolve({ res, url: urlObj.toString() });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

async function downloadToFile(url, destDir = os.tmpdir(), options = {}) {
  const { onProgress } = options;
  const { res, url: finalUrl } = await fetchResponse(url);


  let filename = parseFilenameFromContentDisposition(res.headers['content-disposition']);
  if (!filename) {
    const parsed = new URL(finalUrl);
    const base = path.basename(parsed.pathname);
    if (base && base !== '/') filename = base;
  }

  if (!filename) {

    const ext = guessExtensionFromContentType(res.headers['content-type']);
    filename = `download-${Date.now()}${ext}`;
  }

  await fs.promises.mkdir(destDir, { recursive: true });
  const outPath = path.join(destDir, filename);

  const total = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;
  let transferred = 0;

  res.on('data', (chunk) => {
    transferred += chunk.length;
    if (typeof onProgress === 'function') {
      try { onProgress(transferred, total); } catch (e) {}
    }
  });

  const fileStream = fs.createWriteStream(outPath);
  await streamPipeline(res, fileStream);

  return outPath;
}

async function downloadToBuffer(url, options = {}) {
  const { onProgress } = options;
  const { res } = await fetchResponse(url);

  const total = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;
  let transferred = 0;
  const chunks = [];

  return new Promise((resolve, reject) => {
    res.on('data', (chunk) => {
      transferred += chunk.length;
      chunks.push(chunk);
      if (typeof onProgress === 'function') {
        try { onProgress(transferred, total); } catch (e) { /* ignore */ }
      }
    });
    res.on('end', () => resolve(Buffer.concat(chunks)));
    res.on('error', reject);
  });
}

async function download(url, { to = 'file', destDir, onProgress } = {}) {
  if (to === 'buffer') {
    const buf = await downloadToBuffer(url, { onProgress });
    return { buffer: buf };
  }

  const outPath = await downloadToFile(url, destDir || os.tmpdir(), { onProgress });
  return { path: outPath };
}

async function streamToResponse(url, expressRes) {
  const { res, url: finalUrl } = await fetchResponse(url);


  if (res.headers['content-type']) expressRes.setHeader('Content-Type', res.headers['content-type']);
  if (res.headers['content-length']) expressRes.setHeader('Content-Length', res.headers['content-length']);

  let filename = parseFilenameFromContentDisposition(res.headers['content-disposition']);
  if (!filename) {
    const parsed = new URL(finalUrl);
    const base = path.basename(parsed.pathname);
    if (base && base !== '/') filename = base;
  }

  if (filename) {
    expressRes.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  } else {
    const ext = guessExtensionFromContentType(res.headers['content-type']);
    expressRes.setHeader('Content-Disposition', `attachment; filename="download-${Date.now()}${ext}"`);
  }


  res.on('error', (err) => expressRes.destroy(err));
  expressRes.on('close', () => { try { res.destroy(); } catch (e) {} });
  res.pipe(expressRes);
}

module.exports = {
  downloadToFile,
  downloadToBuffer,
  download,
  streamToResponse,
};
