const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

function serveStatic(res, filePath) {
  const safePath = path.normalize(filePath).replace(/^(.+)(\0)/, '$1');
  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(safePath) });
    res.end(data);
  });
}

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) results.push(net.address);
    }
  }
  return results;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';

  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (pathname === '/api/info') {
    const payload = {
      status: 'ok',
      hostname: os.hostname(),
      time: new Date().toISOString(),
      node: process.version,
      ips: getLocalIPs(),
      env: {
        PORT: PORT,
      },
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
    return;
  }

  // Static files
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (pathname === '/' || pathname === '') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`webtest listening on http://0.0.0.0:${PORT}`);
});

