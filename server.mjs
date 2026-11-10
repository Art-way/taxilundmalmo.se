import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { notFound, paths } from './site.mjs';

const assets = new Map([
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/app.js', 'text/javascript; charset=utf-8'],
  ['/oresund-taxi.jpg', 'image/jpeg'],
  ['/manrope.woff2', 'font/woff2'],
  ['/manrope-OFL.txt', 'text/plain; charset=utf-8'],
  ['/mark.svg', 'image/svg+xml'],
]);
const host = '127.0.0.1';
const port = Number(process.env.TAXI_PREVIEW_PORT || 4173);

const server = createServer(async (request, response) => {
  const send = (status, body, type = 'text/html; charset=utf-8') => {
    response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    send(405, 'Method not allowed', 'text/plain; charset=utf-8');
    return;
  }

  try {
    const url = new URL(request.url, `http://${host}:${port}`);
    const { pathname } = url;
    const asset = assets.get(pathname);
    if (asset) {
      send(200, await readFile(new URL(`./public${pathname}`, import.meta.url)), asset);
      return;
    }

    const page = paths.get(pathname.endsWith('/') ? pathname : `${pathname}/`);
    if (page) send(200, page(url.searchParams));
    else send(404, notFound(pathname));
  } catch (error) {
    console.error(error);
    send(500, 'Could not load the preview', 'text/plain; charset=utf-8');
  }
});

server.listen(port, host, () => console.log(`Taxi Syd · ${paths.size} pages\nLocal: http://${host}:${port}/`));
