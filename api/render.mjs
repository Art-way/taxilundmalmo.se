import { notFound, paths } from '../site.mjs';

export default function render(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const url = new URL(request.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '') === '/api/render'
    ? url.searchParams.get('__taxi_path') || url.pathname
    : url.pathname;
  const route = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const page = paths.get(route);

  response.writeHead(page ? 200 : 404, {
    'Content-Type': 'text/html; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : page ? page(url.searchParams) : notFound(pathname));
}
