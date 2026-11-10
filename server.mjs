import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { notFound, paths } from './site.mjs';

const assets = new Map([
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/app.js', 'text/javascript; charset=utf-8'],
  ['/oresund-taxi.jpg', 'image/jpeg'],
  ['/taxi-syd-oresund.jpg', 'image/jpeg'],
  ['/taxi-syd-lund.jpg', 'image/jpeg'],
  ['/taxi-syd-flygplats.jpg', 'image/jpeg'],
  ['/manrope.woff2', 'font/woff2'],
  ['/manrope-OFL.txt', 'text/plain; charset=utf-8'],
  ['/familjen-grotesk.woff2', 'font/woff2'],
  ['/familjen-grotesk-OFL.txt', 'text/plain; charset=utf-8'],
  ['/taxi-syd-logo.svg', 'image/svg+xml'],
  ['/mark.svg', 'image/svg+xml'],
]);
const host = '127.0.0.1';
const port = Number(process.env.TAXI_PREVIEW_PORT || process.env.PORT || 4173);

const server = createServer(async (request, response) => {
  const send = (status, body, type = 'text/html; charset=utf-8') => {
    response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  };

  // Without JavaScript the booking form posts here. The body is never read, stored or echoed.
  const posted = request.method === 'POST' && /^\/boka-taxi\/?$/.test(new URL(request.url, `http://${host}:${port}`).pathname);
  if (request.method !== 'GET' && request.method !== 'HEAD' && !posted) {
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
    if (page) send(200, posted ? page(new URLSearchParams(), { posted: true }) : page(url.searchParams));
    else send(404, notFound(pathname));
  } catch (error) {
    console.error(error);
    send(500, 'Could not load the preview', 'text/plain; charset=utf-8');
  }
});

server.listen(port, host, () => console.log(`Taxi Syd · ${paths.size} pages\nLocal: http://${host}:${port}/`));
