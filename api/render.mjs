import { notFound, paths } from '../site.mjs';

export default function render(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '') === '/api/render'
    ? url.searchParams.get('__taxi_path') || url.pathname
    : url.pathname;
  const route = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const page = paths.get(route);
  // Without JavaScript the booking form posts here. The body is never read, stored or echoed.
  const posted = request.method === 'POST' && route === '/boka-taxi/';
  if (request.method !== 'GET' && request.method !== 'HEAD' && !posted) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  response.writeHead(page ? 200 : 404, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : page ? (posted ? page(new URLSearchParams(), { posted: true }) : page(url.searchParams)) : notFound(pathname));
}
