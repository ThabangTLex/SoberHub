const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

// Load .env file
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i > 0) process.env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
}

const apiHandler = require('./api');

const root = path.resolve(__dirname, '../frontend');
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (request.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        resolve(Object.fromEntries(new URLSearchParams(raw)));
        return;
      }
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

function applySecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
  );
}

const server = http.createServer(async (request, response) => {
  applySecurityHeaders(response);
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    request.query = Object.fromEntries(url.searchParams.entries());
    request.query.path = url.pathname.slice('/api/'.length);
    try {
      request.body = ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await readBody(request)
        : {};
    } catch (error) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ error: error.message }));
      return;
    }
    response.status = (status) => {
      response.statusCode = status;
      return response;
    };
    response.json = (body) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(body));
    };
    const setHeader = response.setHeader.bind(response);
    response.setHeader = (name, value) => {
      if (String(name).toLowerCase() === 'set-cookie') {
        const cookies = Array.isArray(value) ? value : [value];
        value = cookies.map((cookie) => String(cookie).replace(/;\s*Secure\b/i, ''));
      }
      return setHeader(name, value);
    };
    try {
      await apiHandler(request, response);
    } catch (error) {
      console.error(error);
      if (!response.headersSent) response.statusCode = 500;
      if (!response.writableEnded) response.end('Internal server error.');
    }
    return;
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(url.pathname);
  } catch {
    response.statusCode = 400;
    response.end('Invalid URL.');
    return;
  }
  const filePath = path.resolve(root, `.${requestedPath === '/' ? '/index.html' : requestedPath}`);
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.statusCode = 403;
    response.end('Forbidden.');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.statusCode = 404;
      response.end('Not found.');
      return;
    }
    response.setHeader(
      'Content-Type',
      mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    );
    fs.createReadStream(filePath).pipe(response);
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`Sober Hub is running at http://localhost:${port}`);
  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.log('Using the built-in demo API. Set DB_HOST and DB_NAME to use MySQL locally.');
  }
});