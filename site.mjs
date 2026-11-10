import { readFileSync } from 'node:fs';
import { airports, cities, guides, prices, site } from './content.mjs';

const paths = new Map();
const cityIds = ['lund', 'malmo'];
const airportIds = Object.keys(airports);
const priceFormat = new Intl.NumberFormat('sv-SE');
const money = value => `${priceFormat.format(value)} kr`;
const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const plain = html => html.replace(/<[^>]+>/g, '');
const slugify = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every place a trip can start from: the two cities plus their surrounding areas.
const origins = new Map();
for (const id of cityIds) {
  origins.set(id, { slug: id, name: cities[id].name, city: id, isArea: false });
  for (const [slug, name, guidance] of cities[id].areas) origins.set(slug, { slug, name, city: id, isArea: true, guidance });
}

const priceFor = (origin, airport) => prices[origin]?.[airport] ?? null;
const priceText = (origin, airport, fallback = 'Pris på förfrågan') => {
  const price = priceFor(origin, airport);
  return price === null ? fallback : money(price);
};

const cityPath = id => `/${id}/`;
const areaPath = origin => `/${origin.city}/${origin.slug}/`;
const airportPath = id => `/flygtaxi/${airports[id].slug}/`;
const routePath = (city, airport) => `/${city}/taxi-till-${airports[airport].slug}/`;
const guidePath = guide => `/guider/${guide.slug}/`;
const bookingPath = (origin, airport) => `/boka-taxi/?fran=${origin}${airport ? `&amp;till=${airport}` : ''}`;
const telHref = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, '')}` : '';

const icons = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M19.5 10c0 5-7.5 10.5-7.5 10.5S4.500 15 4.500 10a7.500 7.500 0 1 1 15 0Z"/><circle cx="12" cy="10" r="2.500"/>',
  plane: '<path d="M10.500 13.500 3 11l1.500-1.500 7 .5L16 5.500c1-1 3-1.500 3.500-1s0 2.500-1 3.500L14 12.500l.5 7L13 21l-2.500-7.500Zm0 0L7 17"/>',
  clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  calendar: '<rect x="4" y="5.500" width="16" height="14.500" rx="2"/><path d="M4 10h16M8.500 3.500v4m7-4v4"/>',
  tag: '<path d="M3.500 12.500V4.500h8l9 9-8 8-9-9Z"/><circle cx="8" cy="9" r="1.250"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5.500v-5.500h-5V20H4v-9Z"/>',
  users: '<circle cx="9" cy="8.500" r="3"/><path d="M3 19.500v-1a4.500 4.500 0 0 1 4.500-4.500h3a4.500 4.500 0 0 1 4.500 4.500v1m1-13.500a3 3 0 0 1 0 5.500m1.500 3a4.500 4.500 0 0 1 3 4v1"/>',
  case: '<rect x="4.500" y="7.500" width="15" height="12.500" rx="2"/><path d="M9 7.500v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5.500m6-5.500v5.500"/>',
  phone: '<path d="M5 4h4l1.500 4.500L8 10a12 12 0 0 0 6 6l1.500-2.500L20 15v4a1.500 1.500 0 0 1-1.500 1.500A15 15 0 0 1 3.500 5.500 1.500 1.500 0 0 1 5 4Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M6 12h12M12 6v12"/>',
};

const icon = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const logo = readFileSync(new URL('./public/taxi-syd-logo.svg', import.meta.url), 'utf8').replace('<svg ', '<svg aria-hidden="true" ');
const wordmark = (active = false) => `<a href="/" class="brand" aria-label="Taxi Syd, startsida"${active ? ' aria-current="page"' : ''}>${logo}</a>`;
const button = (href, label, variant = 'accent', withArrow = true) => `<a href="${href}" class="button button-${variant}">${label}${withArrow ? icon('arrow', 18) : ''}</a>`;
const textLink = (href, label) => `<a href="${href}" class="text-link">${label}${icon('arrow', 16)}</a>`;
const section = (inner, modifier = '', attrs = '') => `<section class="section${modifier ? ` ${modifier}` : ''}"${attrs}><div class="container">${inner}</div></section>`;
const sectionHead = (title, note = '', id = '') => `<div class="section-head"><h2${id ? ` id="${id}"` : ''}>${title}</h2>${note ? `<p>${note}</p>` : ''}</div>`;

/* ---------- Structured data (collected while a page renders) ---------- */

let schema = [];
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/* ---------- Header, navigation and footer ---------- */

function navLinks(items) {
  return `<ul class="nav-links">${items.map(([href, label, meta]) => `<li><a href="${href}"><span>${label}</span>${meta ? `<span class="nav-meta">${meta}</span>` : ''}</a></li>`).join('')}</ul>`;
}

function navGroup(label, current, columns) {
  return `<details class="nav-group" name="huvudmeny"><summary${current ? ' class="is-current"' : ''}>${label}${icon('chevron', 14)}</summary><div class="nav-panel"><div class="container nav-panel-grid">${columns.map(([heading, body]) => `<div><p class="nav-heading">${heading}</p>${body}</div>`).join('')}</div></div></details>`;
}

function cityNav(id, path) {
  const city = cities[id];
  return navGroup(city.name, path.startsWith(cityPath(id)), [
    [`Flygtaxi från ${city.name}`, `${navLinks(airportIds.map(a => [routePath(id, a), `${city.name} – ${airports[a].name}`, money(prices[id][a])]))}${textLink(cityPath(id), `Allt om taxi i ${city.name}`)}`],
    ['Områden', `<div class="nav-areas">${navLinks(city.areas.map(([slug, name]) => [`/${id}/${slug}/`, name]))}</div>`],
  ]);
}

function header(path) {
  const flight = navGroup('Flygtaxi', path.startsWith('/flygtaxi/'), [
    ['Flygplatser', `${navLinks(airportIds.map(a => [airportPath(a), `Taxi till ${airports[a].name}`, airports[a].code]))}${textLink('/flygtaxi/', 'Om vår flygtaxi')}`],
    ['Sträckor med fast pris', `<div class="nav-areas">${navLinks(cityIds.flatMap(c => airportIds.map(a => [routePath(c, a), `${cities[c].name} – ${airports[a].name}`, money(prices[c][a])])))}</div>`],
  ]);
  const plainLink = (href, label) => `<a class="nav-link${path.startsWith(href) ? ' is-current' : ''}" href="${href}">${label}</a>`;
  return `<header class="site-header"><div class="container header-row">${wordmark(path === '/')}
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span class="menu-open">${icon('menu', 22)}</span><span class="menu-close">${icon('close', 22)}</span><span class="sr-only">Meny</span></button>
    <nav id="main-nav" class="main-nav" aria-label="Huvudmeny">${cityNav('lund', path)}${cityNav('malmo', path)}${flight}${plainLink('/priser/', 'Priser')}${plainLink('/guider/', 'Reseguider')}${plainLink('/kontakt/', 'Kontakt')}</nav>
    <div class="header-actions">${site.phone ? `<a class="header-phone" href="${telHref}">${icon('phone', 18)}${esc(site.phone)}</a>` : ''}${button('/boka-taxi/', 'Boka taxi', 'accent', false)}</div>
  </div></header>`;
}

function footer(path) {
  const column = (heading, links) => `<div><p class="footer-heading">${heading}</p><ul>${links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div>`;
  const cityColumn = id => column(`Taxi i ${cities[id].name}`, [
    [cityPath(id), `Taxi i ${cities[id].name}`],
    ...airportIds.map(a => [routePath(id, a), `${cities[id].name} – ${airports[a].name}`]),
    ...cities[id].areas.map(([slug, name]) => [`/${id}/${slug}/`, name]),
  ]);
  const contact = [site.phone && `<a href="${telHref}">${esc(site.phone)}</a>`, site.email && `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`].filter(Boolean).join('<br>');
  return `<footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div class="footer-brand">${wordmark()}<p>Flygtaxi från Lund och Malmö till Kastrup och Malmö Airport. Fast pris hela vägen.</p>${contact ? `<p class="footer-contact">${contact}</p>` : ''}</div>
      ${cityColumn('lund')}${cityColumn('malmo')}
      ${column('Flygtaxi', [['/flygtaxi/', 'Flygtaxi'], ...airportIds.map(a => [airportPath(a), `Taxi till ${airports[a].name} (${airports[a].code})`]), ['/priser/', 'Priser'], ['/boka-taxi/', 'Boka taxi']])}
      ${column('Information', [['/om-oss/', 'Om Taxi Syd'], ['/kontakt/', 'Kontakt'], ['/vanliga-fragor/', 'Vanliga frågor'], ['/guider/', 'Reseguider'], ...guides.slice(0, 3).map(g => [guidePath(g), g.title])])}
    </div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} Taxi Syd · Lund och Malmö</span><span>Förhandsvisning – inga bokningar skickas</span></div>
  </div></footer>${path.startsWith('/boka-taxi/') ? '' : `<div class="mobile-cta">${site.phone ? `<a class="button button-outline" href="${telHref}">${icon('phone', 18)}Ring</a>` : ''}<a class="button button-accent" href="/boka-taxi/">Boka taxi · se fast pris</a></div>`}`;
}

function shell({ title, description, path, body, pageSchema }) {
  const data = { prices, origins: Object.fromEntries([...origins].map(([slug, o]) => [slug, o.name])), airports: Object.fromEntries(airportIds.map(id => [id, airports[id].name])), map: { places: mapPlaces, way: mapWay } };
  const canonical = `${site.url}${path}`;
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} | Taxi Syd</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Taxi Syd"><meta property="og:locale" content="sv_SE"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${site.url}/oresund-taxi.jpg"><meta name="theme-color" content="#ffffff"><link rel="icon" href="/mark.svg" type="image/svg+xml"><link rel="preload" href="/familjen-grotesk.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script>${pageSchema.map(jsonLd).join('')}</head><body><a class="skip-link" href="#main">Hoppa till innehållet</a>${header(path)}<main id="main">${body}</main>${footer(path)}<script id="site-data" type="application/json">${JSON.stringify(data)}</script></body></html>`;
}

/* ---------- Trip picker: from (city or area) and to (airport) ---------- */

function picker(origin, airport, prefix) {
  const option = (o, hint) => `<option value="${o.slug}" data-hint="${hint}"${o.slug === origin ? ' selected' : ''}>${o.name}</option>`;
  return `<div class="picker">
    <div class="field"><label for="${prefix}-fran">Från</label>
      <div class="origin" data-origin>${icon('pin', 20)}<select id="${prefix}-fran" name="fran">${cityIds.map(id => `<optgroup label="${cities[id].name}">${option(origins.get(id), 'Fast pris')}${cities[id].areas.map(([slug]) => option(origins.get(slug), priceFor(slug, airportIds[0]) === null ? cities[id].name : 'Fast pris')).join('')}</optgroup>`).join('')}</select>${icon('chevron', 16)}</div>
    </div>
    <fieldset class="field"><legend>Till flygplats</legend>
      <div class="airport-options">${airportIds.map(id => `<label class="airport-option"><input type="radio" name="till" value="${id}"${id === airport ? ' checked' : ''}><span class="airport-name">${airports[id].name}<span class="code">${airports[id].code}</span></span><span class="airport-place">${airports[id].place}</span><span class="airport-price" data-airport-price="${id}">${priceText(origin, id, 'På förfrågan')}</span></label>`).join('')}</div>
    </fieldset>
  </div>`;
}

function quoteWidget(origin = 'malmo', airport = 'kastrup', prefix = 'q', heading = '') {
  const fixed = priceFor(origin, airport) !== null;
  return `<form action="/boka-taxi/" method="get" class="quote" data-quote>
    ${heading ? `<h2 class="quote-title">${heading}</h2>` : ''}
    ${picker(origin, airport, prefix)}
    <div class="quote-total"><div><span class="price-label" data-price-label>${fixed ? 'Fast pris · enkelresa' : 'Pris bekräftas före resan'}</span><output class="price${fixed ? '' : ' is-request'}" data-price aria-live="polite">${priceText(origin, airport)}</output></div><button class="button button-accent" type="submit">Fortsätt${icon('arrow', 18)}</button></div>
  </form>`;
}

/* ---------- Route map (schematic, projected from real coordinates) ---------- */

const MAP = { west: 12.53, north: 55.85, south: 55.41, scale: 1080, lonFactor: 0.565, width: 640 };
MAP.height = Math.round((MAP.north - MAP.south) * MAP.scale);
const project = ([lon, lat]) => [Math.round((lon - MAP.west) * MAP.lonFactor * MAP.scale), Math.round((MAP.north - lat) * MAP.scale)];
const geo = {
  lund: [13.191, 55.704], malmo: [13.003, 55.605], kastrup: [12.656, 55.618], sturup: [13.372, 55.53],
  dalby: [13.35, 55.667], 'sodra-sandby': [13.35, 55.717], veberod: [13.5, 55.633], genarp: [13.4, 55.6], stangby: [13.2, 55.75],
  revinge: [13.467, 55.722], 'torna-hallestad': [13.417, 55.683], vallkarra: [13.172, 55.737], 'norra-faladen': [13.205, 55.725],
  hyllie: [12.976, 55.563], limhamn: [12.933, 55.583], oxie: [13.097, 55.54], bunkeflostrand: [12.917, 55.55], 'vastra-hamnen': [12.975, 55.615],
  rosengard: [13.045, 55.585], kirseberg: [13.03, 55.62], tygelsjo: [12.995, 55.52], klagshamn: [12.92, 55.523],
};
const mapPlaces = Object.fromEntries(Object.entries(geo).map(([slug, point]) => [slug, project(point)]));
const mapWay = Object.fromEntries(Object.entries({ ring: [13.04, 55.575], lernacken: [12.895, 55.565], peberholm: [12.75, 55.6], e65: [13.12, 55.56], r108: [13.25, 55.6] }).map(([key, point]) => [key, project(point)]));
const smoothPath = (points, close = false) => {
  const p = points.map(project);
  let d = 'M' + p[0].join(' ');
  for (let i = 1; i < p.length - 1; i++) d += ' Q' + p[i].join(' ') + ' ' + Math.round((p[i][0] + p[i + 1][0]) / 2) + ' ' + Math.round((p[i][1] + p[i + 1][1]) / 2);
  return d + ' L' + p.at(-1).join(' ') + (close ? 'Z' : '');
};
const coast = {
  sweden: [[13.7, 55.9], [12.84, 55.9], [12.86, 55.86], [12.9, 55.8], [12.895, 55.765], [12.96, 55.74], [13.02, 55.72], [13.065, 55.675], [13.055, 55.645], [13.0, 55.628], [12.965, 55.618], [12.955, 55.6], [12.915, 55.583], [12.895, 55.565], [12.905, 55.55], [12.885, 55.522], [12.91, 55.5], [12.93, 55.46], [12.95, 55.42], [12.95, 55.36], [13.7, 55.36]],
  denmark: [[12.4, 55.9], [12.6, 55.9], [12.59, 55.8], [12.58, 55.74], [12.61, 55.71], [12.625, 55.685], [12.645, 55.655], [12.66, 55.635], [12.685, 55.615], [12.68, 55.59], [12.635, 55.565], [12.56, 55.55], [12.4, 55.555]],
  saltholm: [[12.76, 55.672], [12.785, 55.655], [12.79, 55.63], [12.77, 55.61], [12.74, 55.615], [12.73, 55.64], [12.74, 55.662], [12.76, 55.672]],
  peberholm: [[12.735, 55.607], [12.765, 55.6], [12.76, 55.592], [12.735, 55.597], [12.735, 55.607]],
};
const roads = [
  [[12.895, 55.565], [12.97, 55.555], [13.04, 55.575], [13.05, 55.61], [13.1, 55.65], [13.17, 55.69], [13.23, 55.74], [13.33, 55.82], [13.4, 55.87]],
  [[13.07, 55.64], [13.06, 55.69], [12.99, 55.76], [12.95, 55.82], [12.93, 55.87]],
  [[13.04, 55.575], [13.12, 55.56], [13.25, 55.535], [13.37, 55.512], [13.5, 55.49], [13.66, 55.47]],
  [[13.04, 55.575], [13.06, 55.52], [13.1, 55.46], [13.13, 55.4]],
  [[13.06, 55.6], [13.2, 55.635], [13.35, 55.662], [13.5, 55.638], [13.66, 55.62]],
  [[13.2, 55.7], [13.3, 55.71], [13.42, 55.715], [13.55, 55.74], [13.66, 55.76]],
  [[13.2, 55.69], [13.21, 55.64], [13.27, 55.58], [13.37, 55.535]],
];

function routeMap(origin, airport) {
  const dot = (slug, cls, radius, label) => {
    const [x, y] = mapPlaces[slug];
    return '<g class="map-place ' + cls + '" data-place="' + slug + '" transform="translate(' + x + ' ' + y + ')"><circle class="map-hit" r="13"/><circle class="map-dot" r="' + radius + '"/>' + label + '</g>';
  };
  const areaDots = [...origins.values()].filter(o => o.isArea).map(o => dot(o.slug, 'map-area', 3.5, '<text class="map-label" y="19" text-anchor="' + (mapPlaces[o.slug][0] > 560 ? 'end' : mapPlaces[o.slug][0] < 60 ? 'start' : 'middle') + '">' + o.name + '</text>')).join('');
  const cityDots = dot('lund', 'map-city', 6, '<text class="map-label" x="-12" y="5" text-anchor="end">Lund</text>') + dot('malmo', 'map-city', 6, '<text class="map-label" x="12" y="5">Malmö</text>');
  const airportDots = airportIds.map(id => dot(id, 'map-airport', 6, '<text class="map-label" y="24" text-anchor="middle">' + airports[id].name + '</text><text class="map-code" y="40" text-anchor="middle">' + airports[id].code + '</text>')).join('');
  const [bx, by] = project([12.83, 55.578]);
  const at = point => { const [x, y] = project(point); return 'x="' + x + '" y="' + y + '"'; };
  return '<figure class="route-map" data-map><svg viewBox="0 0 ' + MAP.width + ' ' + MAP.height + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Schematisk karta över Öresund med Lund, Malmö, Kastrup och Malmö Airport">'
    + '<rect class="map-water" width="' + MAP.width + '" height="' + MAP.height + '"/>'
    + Object.values(coast).map(points => '<path class="map-land" d="' + smoothPath(points, true) + '"/>').join('')
    + roads.map(points => '<path class="map-road" d="' + smoothPath(points) + '"/>').join('')
    + '<path class="map-bridge" d="' + smoothPath([[12.895, 55.565], [12.75, 55.6], [12.656, 55.618]]) + '"/>'
    + '<text class="map-region" ' + at([12.6, 55.79]) + '>DANMARK</text>'
    + '<text class="map-region" x="' + (MAP.width - 48) + '" y="' + project([13.5, 55.79])[1] + '" text-anchor="end">SKÅNE</text>'
    + '<text class="map-sea" ' + at([12.74, 55.72]) + '>Öresund</text>'
    + '<text class="map-sea map-sea-small" x="' + bx + '" y="' + (by + 18) + '" text-anchor="middle" transform="rotate(-21 ' + bx + ' ' + by + ')">Öresundsbron</text>'
    + '<path class="map-route" data-map-route pathLength="1" d=""/>' + areaDots + cityDots + airportDots
    + '</svg><figcaption><div><strong data-map-name>' + origins.get(origin).name + ' – ' + airports[airport].name + '</strong><span>Klicka på en ort eller flygplats för att ändra resan</span></div><output data-map-price>' + priceText(origin, airport) + '</output></figcaption></figure>';
}

/* ---------- Shared content blocks ---------- */

function breadcrumb(items) {
  schema.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Hem', '/'], ...items].map(([name, href], index) => ({ '@type': 'ListItem', position: index + 1, name, ...(href && { item: `${site.url}${href}` }) })) });
  return `<nav class="breadcrumbs" aria-label="Brödsmulor"><ol><li><a href="/">Hem</a></li>${items.map(([label, href]) => `<li>${href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`}</li>`).join('')}</ol></nav>`;
}

function pageHead({ crumbs, title, lead, aside = '', actions = '' }) {
  return `<section class="page-head"><div class="container">${breadcrumb(crumbs)}<div class="page-head-grid${aside ? ' has-aside' : ''}"><div class="page-head-copy"><h1>${title}</h1><p class="lead">${lead}</p>${actions ? `<div class="actions">${actions}</div>` : ''}</div>${aside}</div></div></section>`;
}

function fareTable(rows, caption = 'Fasta priser för enkelresa') {
  return `<div class="table-wrap"><table class="fares"><caption class="sr-only">${caption}</caption>
    <thead><tr><th scope="col">Sträcka</th><th scope="col" class="col-airport">Flygplats</th><th scope="col" class="num">Fast pris</th><th scope="col"><span class="sr-only">Boka</span></th></tr></thead>
    <tbody>${rows.map(([city, airport]) => `<tr><th scope="row"><a href="${routePath(city, airport)}">${cities[city].name} – ${airports[airport].name}</a><span class="row-meta">${airports[airport].code} · ${airports[airport].country}</span></th><td class="col-airport">${airports[airport].full}</td><td class="num">${money(prices[city][airport])}</td><td class="col-action"><a class="button button-small" href="${bookingPath(city, airport)}" aria-label="Boka ${cities[city].name} till ${airports[airport].name}">Boka</a></td></tr>`).join('')}</tbody>
  </table></div><p class="table-note">Priserna gäller per bil och enkelresa från ${[...new Set(rows.map(([city]) => cities[city].name))].join(' respektive ')}. Pris för kringliggande områden bekräftas separat.</p>`;
}

const allRoutes = cityIds.flatMap(city => airportIds.map(airport => [city, airport]));

function usp() {
  const items = [
    ['tag', 'Fast pris', 'Priset för din sträcka visas innan du bokar.'],
    ['home', 'Hämtning vid dörren', 'Ange gatuadress, port eller hotellentré.'],
    ['plane', 'Två flygplatser', 'Kastrup (CPH) och Malmö Airport (MMX).'],
    ['calendar', 'Boka i förväg', 'Välj datum och tid som passar din avgång.'],
  ];
  return `<ul class="usp">${items.map(([glyph, title, text]) => `<li>${icon(glyph, 22)}<div><strong>${title}</strong><span>${text}</span></div></li>`).join('')}</ul>`;
}

function steps(cls = 'steps') {
  const items = [
    ['Välj sträcka', 'Välj var du vill bli hämtad och vilken flygplats du ska till. Priset visas direkt.'],
    ['Ange adress och tid', 'Fyll i hämtadress, datum och tid samt hur många som reser och hur många väskor ni har.'],
    ['Granska resan', 'Kontrollera uppgifterna i sammanfattningen innan du går vidare.'],
  ];
  return `<ol class="${cls}">${items.map(([title, text], index) => `<li><span class="step-number">${index + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol>`;
}

function areaLinks(id, exclude = '') {
  return `<ul class="area-links">${cities[id].areas.filter(([slug]) => slug !== exclude).map(([slug, name]) => `<li><a href="/${id}/${slug}/">${icon('pin', 16)}${name}</a></li>`).join('')}</ul>`;
}

function cityBlocks() {
  return `<div class="city-blocks">${cityIds.map(id => `<article class="city-block"><h3><a href="${cityPath(id)}">Taxi i ${cities[id].name}</a></h3>
    <ul class="route-list">${airportIds.map(a => `<li><a href="${routePath(id, a)}"><span>${cities[id].name} – ${airports[a].name}</span><span class="route-price">${money(prices[id][a])}</span></a></li>`).join('')}</ul>
    <p class="block-label">Vi hämtar också i</p><p class="inline-links">${cities[id].areas.map(([slug, name]) => `<a href="/${id}/${slug}/">${name}</a>`).join('<span aria-hidden="true"> · </span>')}</p>
    ${textLink(cityPath(id), `Mer om taxi i ${cities[id].name}`)}</article>`).join('')}</div>`;
}

function airportCards(ids = airportIds) {
  return `<div class="airport-cards">${ids.map(id => `<article class="card airport-card"><div class="card-top"><h3><a href="${airportPath(id)}">${airports[id].name}</a></h3><span class="code">${airports[id].code}</span></div><p>${airports[id].text}</p>
    <dl class="facts">${cityIds.map(c => `<div><dt>Från ${cities[c].name}</dt><dd>${money(prices[c][id])}</dd></div>`).join('')}</dl>${textLink(airportPath(id), `Taxi till ${airports[id].name}`)}</article>`).join('')}</div>`;
}

function guideCards(items) {
  return `<ul class="guide-cards">${items.map(guide => `<li><a class="card guide-card" href="${guidePath(guide)}"><span class="guide-tag">${icon(guide.icon, 16)}${guide.tag}</span><h3>${guide.title}</h3><p>${guide.intro}</p><span class="text-link">Läs guiden${icon('arrow', 16)}</span></a></li>`).join('')}</ul>`;
}

function faq(items) {
  schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: plain(answer) } })) });
  return `<div class="faq">${items.map(([question, answer]) => `<details><summary><h3>${question}</h3>${icon('chevron', 18)}</summary><div class="faq-answer"><p>${answer}</p></div></details>`).join('')}</div>`;
}

function faqSection(items, title = 'Vanliga frågor', more = true) {
  return section(`<div class="split"><div class="split-aside"><h2>${title}</h2><p>Hittar du inte svaret? Läs fler svar om priser, flygplatser och hämtning.</p>${more ? textLink('/vanliga-fragor/', 'Alla frågor och svar') : ''}</div>${faq(items)}</div>`);
}

function cta(title = 'Redo att boka din flygtaxi?', text = 'Välj sträcka, se ditt fasta pris och ange när du vill bli hämtad.', href = '/boka-taxi/', label = 'Boka taxi') {
  return section(`<div class="cta-band"><div><h2>${title}</h2><p>${text}</p></div>${button(href, label, 'light')}</div>`, 'section-cta');
}

const questions = [
  ['Vad kostar flygtaxi?', `${cityIds.map(c => `Från ${cities[c].name} kostar resan ${airportIds.map(a => `${money(prices[c][a])} till ${airports[a].name}`).join(' och ')}.`).join(' ')} Alla priser finns på <a href="/priser/">prissidan</a>.`],
  ['Vilken flygplats ska jag välja?', 'Välj Kastrup om det står CPH på din biljett. Välj Malmö Airport, även kallad Sturup, om det står MMX. Läs mer i guiden <a href="/guider/malmo-airport-eller-kastrup/">Malmö Airport eller Kastrup?</a>'],
  ['Kan jag bli hämtad utanför centrala Lund eller Malmö?', 'Ja. Välj ditt område i reseväljaren, till exempel Dalby, Södra Sandby, Hyllie eller Limhamn. Pris för områden utanför centralorten bekräftas separat.'],
  ['Behöver jag pass för att åka till Kastrup?', 'Kastrup ligger i Danmark och resan går över Öresundsbron. Ta därför med pass eller nationellt id-kort.'],
  ['Kan jag prova att boka en resa?', 'Ja. Du kan välja en resa och granska uppgifterna i förhandsvisningen. Formuläret skickar ingen bokning.'],
  ['Vad gör jag om jag behöver extra utrymme?', 'Ange antal resenärer och beskriv väskor eller särskilda behov i reseuppgifterna. Bilens kapacitet behöver bekräftas inför en riktig resa.'],
  ['Kan vi resa med barn?', 'Ange hur många vuxna och barn som reser. Om ni behöver barnstol behöver rätt utrustning bekräftas före resan. Läs mer i guiden <a href="/guider/resa-med-barn-i-taxi/">Resa med barn i taxi</a>.'],
];

/* ---------- Pages ---------- */

function home() {
  schema.push({ '@context': 'https://schema.org', '@type': 'TaxiService', name: site.name, url: `${site.url}/`, image: `${site.url}/oresund-taxi.jpg`, ...(site.phone && { telephone: site.phone }), areaServed: cityIds.map(id => ({ '@type': 'City', name: cities[id].name })), priceRange: `${money(Math.min(...allRoutes.map(([c, a]) => prices[c][a])))}–${money(Math.max(...allRoutes.map(([c, a]) => prices[c][a])))}` });
  return `<section class="hero"><div class="container hero-grid">
      <div class="hero-copy"><h1>Flygtaxi från Lund och Malmö till fast pris</h1><p class="lead">Vi kör dig till Kastrup eller Malmö Airport. Välj var du vill bli hämtad, så ser du priset direkt.</p>${quoteWidget('malmo', 'kastrup', 'hero')}</div>
      ${routeMap('malmo', 'kastrup')}
    </div></section>
  ${section(usp(), 'section-usp')}
  ${section(`${sectionHead('Fasta priser till flygplatsen', 'Fyra sträckor, samma pris varje gång. Välj en sträcka för att läsa mer eller boka direkt.', 'priser')}${fareTable(allRoutes)}`, '', ' aria-labelledby="priser"')}
  ${section(`<div class="photo-split"><div>${sectionHead('Så bokar du', 'Tre steg från dörr till terminal.')}${steps('steps steps-stacked')}</div><figure class="photo"><img src="/oresund-taxi.jpg" width="1536" height="1024" loading="lazy" alt="Taxi på kustvägen med Öresundsbron i bakgrunden"><figcaption>På väg mot Öresundsbron och Kastrup</figcaption></figure></div>`, 'section-tint')}
  ${section(`${sectionHead('Hämtning i Lund, Malmö och närområdet', 'Vi hämtar på din adress – i centrum, vid stationen eller i orterna runt omkring.')}${cityBlocks()}`)}
  ${section(`${sectionHead('Två flygplatser – kontrollera koden på din biljett', 'CPH är Kastrup i Danmark. MMX är Malmö Airport, som också kallas Sturup.')}${airportCards()}`)}
  ${section(`${sectionHead('Reseguider inför avresan', 'Praktiska råd om mötesplatser, bagage och att välja rätt flygplats.')}${guideCards(guides.slice(0, 3))}<p class="section-more">${textLink('/guider/', 'Alla reseguider')}</p>`, 'section-tint')}
  ${faqSection(questions.slice(0, 5))}
  ${cta()}`;
}

function cityPage(id) {
  const city = cities[id];
  const other = cityIds.find(c => c !== id);
  const stationGuide = guides.find(g => g.slug === `hamtning-${id}-centralstation`);
  return `${pageHead({ crumbs: [[`Taxi i ${city.name}`]], title: `Taxi i ${city.name} till flygplatsen`, lead: city.intro, aside: quoteWidget(id, 'kastrup', 'city', 'Se ditt pris') })}
  ${section(usp(), 'section-usp')}
  ${section(`${sectionHead(`Fasta priser från ${city.name}`, 'Pris per bil och enkelresa.')}${fareTable(airportIds.map(a => [id, a]), `Fasta priser från ${city.name}`)}`)}
  ${section(`${sectionHead(`Områden kring ${city.name}`, 'Välj ditt område för att se hur hämtningen går till.')}${areaLinks(id)}`, 'section-tint')}
  ${section(`<div class="split"><div class="split-aside"><h2>Bra att veta inför resan</h2><p>Kort om hämtning och flygplatser när du åker från ${city.name}.</p></div><div class="prose"><h3>Hämtning på din adress</h3><p>Ange gatuadress och husnummer när du bokar. Lägg gärna till port, hotellentré eller en tydlig mötesplats om det gör det enklare att hitta dig.</p><h3>Från ${city.name} Centralstation</h3><p>${stationGuide.intro} ${textLink(guidePath(stationGuide), stationGuide.title)}</p><h3>Rätt flygplats</h3><p>På biljetten står CPH för Kastrup och MMX för Malmö Airport. ${textLink('/guider/malmo-airport-eller-kastrup/', 'Jämför flygplatserna')}</p></div></div>`)}
  ${faqSection([[`Vad kostar taxi från ${city.name} till Kastrup?`, `Det fasta priset från ${city.name} till Kastrup (CPH) är ${money(prices[id].kastrup)} per enkelresa.`], [`Vad kostar taxi från ${city.name} till Malmö Airport?`, `Det fasta priset från ${city.name} till Malmö Airport (MMX) är ${money(prices[id].sturup)} per enkelresa.`], questions[2], questions[3]], `Frågor om taxi i ${city.name}`)}
  ${cta(`Åker du från ${cities[other].name} i stället?`, `Se fasta priser och upphämtningsområden i ${cities[other].name}.`, cityPath(other), `Taxi i ${cities[other].name}`)}`;
}

function areaPage(origin) {
  const city = cities[origin.city];
  const hasPrice = priceFor(origin.slug, 'kastrup') !== null;
  return `${pageHead({ crumbs: [[`Taxi i ${city.name}`, cityPath(origin.city)], [origin.name]], title: `Taxi i ${origin.name} till flygplatsen`, lead: `Boka flygtaxi med hämtning i ${origin.name} till Kastrup eller Malmö Airport.${hasPrice ? '' : ' Priset för området bekräftas före resan.'}`, aside: quoteWidget(origin.slug, 'kastrup', 'area', 'Planera din resa') })}
  ${section(`<div class="split"><div class="split-aside"><h2>Hämtning i ${origin.name}</h2><p>Så gör du det enkelt för föraren att hitta dig.</p></div><div class="prose"><p>${origin.guidance}</p><p>För resa till flygplatsen: kontrollera flygplatskoden på din biljett och ange önskad tid för upphämtning. CPH är Kastrup och MMX är Malmö Airport.</p><p>${textLink(bookingPath(origin.slug, 'kastrup'), `Boka taxi från ${origin.name}`)}</p></div></div>`)}
  ${section(`${sectionHead(`Fasta priser från ${city.name}`, hasPrice ? 'Pris per bil och enkelresa.' : `Priserna gäller från ${city.name}. Pris för ${origin.name} bekräftas separat.`)}${fareTable(airportIds.map(a => [origin.city, a]), `Fasta priser från ${city.name}`)}`, 'section-tint')}
  ${section(`${sectionHead(`Fler områden kring ${city.name}`)}${areaLinks(origin.city, origin.slug)}<p class="section-more">${textLink(cityPath(origin.city), `Taxi i ${city.name}`)}</p>`)}
  ${faqSection([[`Kan jag bli hämtad i ${origin.name}?`, `Ja. Välj ${origin.name} i reseväljaren och ange din gatuadress. ${hasPrice ? '' : 'Täckning och pris för området bekräftas före resan.'}`], questions[1], questions[5]], `Frågor om taxi i ${origin.name}`)}`;
}

function routePage(cityId, airportId) {
  const city = cities[cityId];
  const airport = airports[airportId];
  const price = prices[cityId][airportId];
  const otherAirport = airportIds.find(a => a !== airportId);
  const otherCity = cityIds.find(c => c !== cityId);
  schema.push({ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Flygtaxi', name: `Taxi från ${city.name} till ${airport.name}`, provider: { '@type': 'TaxiService', name: site.name, url: `${site.url}/` }, areaServed: { '@type': 'City', name: city.name }, offers: { '@type': 'Offer', price, priceCurrency: 'SEK', url: `${site.url}${routePath(cityId, airportId)}` } });
  const priceCard = `<div class="price-card"><span class="price-label">Fast pris · enkelresa</span><p class="price price-large">${money(price)}</p><dl class="facts"><div><dt>Från</dt><dd>${city.name}</dd></div><div><dt>Till</dt><dd>${airport.full}</dd></div><div><dt>Flygplatskod</dt><dd>${airport.code}</dd></div><div><dt>Land</dt><dd>${airport.country}</dd></div></dl>${button(bookingPath(cityId, airportId), 'Boka denna resa')}</div>`;
  return `${pageHead({ crumbs: [[`Taxi i ${city.name}`, cityPath(cityId)], [`Till ${airport.name}`]], title: `Taxi från ${city.name} till ${airport.name}`, lead: `Åk från ${city.name} till ${airport.full} för ${money(price)}. Du väljer själv när och var bilen ska hämta dig.`, aside: priceCard })}
  ${section(usp(), 'section-usp')}
  ${section(`<div class="split"><div class="split-aside"><h2>Så planerar du resan</h2><p>${airport.text}</p>${textLink(airportPath(airportId), `Mer om taxi till ${airport.name}`)}</div><ol class="check-steps"><li><h3>Ange hämtadress i ${city.name}</h3><p>Lägg till port eller hotellentré om det gör mötet enklare.</p></li><li><h3>Välj datum och tid</h3><p>Utgå från flygbolagets incheckning och räkna bakåt till hämtningen.</p></li><li><h3>Kontrollera destinationen</h3><p>På biljetten ska det stå ${airport.code} för ${airport.name}.</p></li></ol></div>`)}
  ${section(`${sectionHead('Andra sträckor', 'Jämför med övriga fasta priser.')}${fareTable([[cityId, otherAirport], [otherCity, airportId]], 'Andra sträckor')}`, 'section-tint')}
  ${faqSection([['Vad kostar resan?', `Det fasta priset för enkelresan ${city.name} – ${airport.name} är ${money(price)}. Pris och villkor för andra adresser eller tillval behöver bekräftas.`], ['Hur väljer jag en annan flygplats?', `Öppna <a href="${cityPath(cityId)}">Taxi i ${city.name}</a> för att jämföra båda alternativen.`], ...(airportId === 'kastrup' ? [questions[3]] : []), questions[5]], 'Bra att veta')}`;
}

function airportPage(id) {
  const airport = airports[id];
  return `${pageHead({ crumbs: [['Flygtaxi', '/flygtaxi/'], [airport.name]], title: `Taxi till ${airport.name} (${airport.code})`, lead: `${airport.text} Välj din avreseort för fast pris.`, aside: quoteWidget('malmo', id, 'airport', 'Se ditt pris') })}
  ${section(`${sectionHead(`Fasta priser till ${airport.name}`, 'Pris per bil och enkelresa.')}${fareTable(cityIds.map(c => [c, id]), `Fasta priser till ${airport.name}`)}`)}
  ${section(`<div class="split"><div class="split-aside"><h2>Om ${airport.name}</h2><p>Kontrollera alltid flygplatskoden på din biljett före bokningen.</p></div><dl class="facts facts-wide"><div><dt>Namn</dt><dd>${airport.full}</dd></div><div><dt>Flygplatskod</dt><dd>${airport.code}</dd></div><div><dt>Land</dt><dd>${airport.country}</dd></div>${cityIds.map(c => `<div><dt>Från ${cities[c].name}</dt><dd><a href="${routePath(c, id)}">${money(prices[c][id])}</a></dd></div>`).join('')}</dl></div>`, 'section-tint')}
  ${section(`${sectionHead('Läs mer inför resan')}${guideCards([guides[0], guides[1], guides[5]])}`)}
  ${faqSection([questions[1], ...(id === 'kastrup' ? [questions[3]] : []), questions[2]], `Frågor om taxi till ${airport.name}`)}
  ${cta()}`;
}

function guidePage(guide) {
  const related = guides.filter(g => g !== guide).slice(0, 3);
  schema.push({ '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, description: guide.intro, inLanguage: 'sv', publisher: { '@type': 'Organization', name: site.name } });
  return `${pageHead({ crumbs: [['Reseguider', '/guider/'], [guide.title]], title: guide.title, lead: guide.intro })}
  ${section(`<div class="article-layout"><aside class="toc" aria-label="Innehåll"><p class="toc-title">I den här guiden</p><ol>${guide.sections.map(([heading]) => `<li><a href="#${slugify(heading)}">${heading}</a></li>`).join('')}</ol></aside><article class="prose prose-article">${guide.sections.map(([heading, copy]) => `<h2 id="${slugify(heading)}">${heading}</h2><p>${copy}</p>`).join('')}<div class="article-cta"><div><strong>Se ditt fasta pris</strong><span>Välj avreseort och flygplats för att planera din resa.</span></div>${button('/boka-taxi/', 'Boka taxi')}</div></article></div>`)}
  ${section(`${sectionHead('Fler reseguider')}${guideCards(related)}`, 'section-tint')}`;
}

function booking(params) {
  const requestedOrigin = params.get('omrade') ?? params.get('fran');
  const origin = origins.has(requestedOrigin) ? requestedOrigin : 'malmo';
  const airport = airportIds.includes(params.get('till')) ? params.get('till') : 'kastrup';
  const fixed = priceFor(origin, airport) !== null;
  const stepper = (name, label, value, min, max) => `<div class="field"><label for="b-${name}">${label}</label><div class="stepper" data-stepper><button type="button" data-step="-1" aria-label="Minska ${label.toLowerCase()}">${icon('minus', 18)}</button><input id="b-${name}" type="number" name="${name}" value="${value}" min="${min}" max="${max}" inputmode="numeric" required><button type="button" data-step="1" aria-label="Öka ${label.toLowerCase()}">${icon('plus', 18)}</button></div></div>`;
  return `<section class="page-head page-head-compact"><div class="container">${breadcrumb([['Boka taxi']])}<h1>Boka flygtaxi</h1><p class="lead">Välj sträcka och ange när och var du vill bli hämtad.</p></div></section>
  <section class="section section-booking"><div class="container booking-layout">
    <ol class="booking-progress" aria-label="Bokningssteg"><li aria-current="step"><span>1</span>Resa och hämtning</li><li><span>2</span>Granska</li></ol>
    <form class="booking-form" data-quote data-booking>
      <fieldset class="form-block"><legend>Din resa</legend>${picker(origin, airport, 'b')}</fieldset>
      <fieldset class="form-block"><legend>Hämtning</legend>
        <div class="field"><label for="b-adress">Hämtadress</label><input id="b-adress" name="adress" autocomplete="street-address" required maxlength="120" placeholder="Gatuadress och nummer"><p class="hint">Lägg gärna till port eller entré under Övrig information.</p></div>
        <div class="field-row"><div class="field"><label for="b-datum">Datum</label><input id="b-datum" type="date" name="datum" required></div><div class="field"><label for="b-tid">Hämtningstid</label><input id="b-tid" type="time" name="tid" required></div></div>
      </fieldset>
      <fieldset class="form-block"><legend>Resenärer och bagage</legend>
        <div class="field-row">${stepper('resenarer', 'Resenärer', 2, 1, 8)}${stepper('vaskor', 'Stora väskor', 2, 0, 8)}</div>
        <div class="field"><label for="b-meddelande">Övrig information <span class="optional">valfritt</span></label><textarea id="b-meddelande" name="meddelande" rows="3" maxlength="250" placeholder="Till exempel portnummer, flygnummer eller behov av barnstol"></textarea></div>
      </fieldset>
      <div class="form-actions"><button type="submit" class="button button-accent button-large">Granska resan${icon('arrow', 18)}</button><p class="hint">Förhandsvisning. Inga uppgifter skickas.</p><noscript><p class="hint">Aktivera JavaScript för att granska resan.</p></noscript></div>
    </form>
    <aside class="summary" aria-label="Din resa"><h2>Din resa</h2><p class="summary-route" data-route-name>${origins.get(origin).name} – ${airports[airport].name}</p>
      <dl class="facts"><div><dt>Hämtning</dt><dd data-summary-when>Välj datum och tid</dd></div><div><dt>Resenärer</dt><dd data-summary-people>2 resenärer · 2 väskor</dd></div></dl>
      <div class="summary-price"><span class="price-label" data-price-label>${fixed ? 'Fast pris · enkelresa' : 'Pris bekräftas före resan'}</span><output class="price${fixed ? '' : ' is-request'}" data-price aria-live="polite">${priceText(origin, airport)}</output></div>
      <ul class="summary-points"><li>${icon('check', 16)}Priset gäller per bil</li><li>${icon('check', 16)}Hämtning på din adress</li></ul>
    </aside>
    <section class="review" data-review hidden tabindex="-1"><span class="review-icon">${icon('check', 22)}</span><h2>Din resesammanfattning</h2><p class="notice">Det här är en förhandsvisning. Ingen bokning har skickats.</p><dl class="facts" data-review-details></dl><button type="button" class="button button-outline" data-edit>Ändra uppgifter</button></section>
  </div></section>`;
}

function add(path, title, description, body) {
  paths.set(path, params => {
    schema = [];
    const html = body(params);
    return shell({ title, description, path, body: html, pageSchema: schema });
  });
}

add('/', 'Flygtaxi från Lund och Malmö till fast pris', 'Taxi från Lund och Malmö till Kastrup och Malmö Airport. Se fasta priser och planera din flygresa.', home);
add('/boka-taxi/', 'Boka taxi', 'Boka flygtaxi från Lund eller Malmö till Kastrup eller Malmö Airport. Se ditt fasta pris direkt.', booking);
add('/priser/', 'Priser för flygtaxi – fasta priser', 'Fasta priser för flygtaxi från Lund och Malmö till Kastrup och Malmö Airport.', () => `${pageHead({ crumbs: [['Priser']], title: 'Fasta priser för flygtaxi', lead: 'Fyra sträckor från Lund och Malmö till Kastrup och Malmö Airport. Priset gäller per bil och enkelresa.', actions: button('/boka-taxi/', 'Boka taxi') })}
  ${section(fareTable(allRoutes))}
  ${section(`${sectionHead('Pris från ditt område', 'Välj ort eller område för att se vad som gäller där du bor.')}<div class="widget-row">${quoteWidget('lund', 'kastrup', 'price')}<div class="prose"><h3>Vad ingår i priset?</h3><p>Det fasta priset gäller en bil och en enkelresa mellan avreseorten och flygplatsen. Pris för kringliggande områden och särskilda tillval bekräftas separat.</p><h3>Åker du från en ort utanför centrum?</h3><p>Välj området i reseväljaren. Du kan till exempel bli hämtad i Dalby, Veberöd, Hyllie eller Limhamn.</p></div></div>`, 'section-tint')}
  ${faqSection([questions[0], questions[2], questions[5]], 'Frågor om priser')}`);
add('/om-oss/', 'Om Taxi Syd', 'Taxi Syd kör flygtaxi från Lund och Malmö till Kastrup och Malmö Airport till fast pris.', () => `${pageHead({ crumbs: [['Om Taxi Syd']], title: 'Om Taxi Syd', lead: 'Taxi Syd samlar resor från Lund och Malmö till två flygplatser, med ett fast pris för varje visad sträcka.' })}
  ${section(usp(), 'section-usp')}
  ${section(`${sectionHead('Här kör vi', 'Hämtning i Lund, Malmö och orterna runt omkring.')}${cityBlocks()}`)}
  ${section(`${sectionHead('Flygplatser')}${airportCards()}`, 'section-tint')}
  ${cta('På väg till flyget?', 'Välj din avreseort och jämför resorna till Kastrup och Malmö Airport.')}`);
add('/kontakt/', 'Kontakt', 'Kontakt och reseinformation för Taxi Syd.', () => `${pageHead({ crumbs: [['Kontakt']], title: 'Kontakta Taxi Syd', lead: site.phone || site.email ? 'Hör av dig om du har frågor om din resa.' : 'Kontaktuppgifter läggs till när Taxi Syd är redo att ta emot förfrågningar.' })}
  ${section(`<div class="contact-cards">${site.phone ? `<div class="card"><h2>Ring oss</h2><p>Prata med oss om din resa.</p><a class="text-link" href="${telHref}">${icon('phone', 16)}${esc(site.phone)}</a></div>` : ''}${site.email ? `<div class="card"><h2>Mejla oss</h2><p>Vi svarar så snart vi kan.</p><a class="text-link" href="mailto:${esc(site.email)}">${esc(site.email)}</a></div>` : ''}<div class="card"><h2>Planera en resa</h2><p>Välj sträcka, se ett fast pris och granska en resesammanfattning.</p>${textLink('/boka-taxi/', 'Öppna bokningen')}</div><div class="card"><h2>Har du en fråga?</h2><p>Läs om flygplatser, priser och hämtning.</p>${textLink('/vanliga-fragor/', 'Vanliga frågor')}</div><div class="card"><h2>Inför avresan</h2><p>Praktiska råd om mötesplatser och bagage.</p>${textLink('/guider/', 'Reseguider')}</div></div>`)}`);
add('/vanliga-fragor/', 'Vanliga frågor', 'Svar på frågor om flygtaxi, priser och hämtning i Lund och Malmö.', () => `${pageHead({ crumbs: [['Vanliga frågor']], title: 'Vanliga frågor', lead: 'Svar om priser, flygplatser, hämtning och bokning.' })}
  ${section(`<div class="narrow">${faq(questions)}</div>`)}
  ${cta()}`);
add('/flygtaxi/', 'Flygtaxi till Kastrup och Malmö Airport', 'Flygtaxi från Lund och Malmö till Kastrup (CPH) och Malmö Airport (MMX) till fast pris.', () => `${pageHead({ crumbs: [['Flygtaxi']], title: 'Flygtaxi till Kastrup och Malmö Airport', lead: 'Två flygplatser, fyra sträckor och ett fast pris för varje. Välj var du åker från och vart du ska.', aside: quoteWidget('malmo', 'kastrup', 'flight', 'Se ditt pris') })}
  ${section(usp(), 'section-usp')}
  ${section(`${sectionHead('Välj flygplats', 'Kontrollera flygplatskoden på din biljett.')}${airportCards()}`)}
  ${section(`${sectionHead('Alla sträckor och priser')}${fareTable(allRoutes)}`, 'section-tint')}
  ${section(`${sectionHead('Så bokar du')}${steps()}`)}
  ${faqSection([questions[1], questions[3], questions[0]], 'Frågor om flygtaxi')}`);
add('/guider/', 'Reseguider', 'Praktiska råd inför taxiresan till flygplatsen.', () => `${pageHead({ crumbs: [['Reseguider']], title: 'Reseguider', lead: 'Praktiska tips om mötesplatser, bagage och att välja rätt flygplats.' })}
  ${section(guideCards(guides))}
  ${cta()}`);

for (const id of cityIds) {
  const city = cities[id];
  add(cityPath(id), `Taxi i ${city.name} – flygtaxi till fast pris`, `Taxi från ${city.name} till Kastrup ${money(prices[id].kastrup)} och Malmö Airport ${money(prices[id].sturup)}. Se upphämtningsområden och boka.`, () => cityPage(id));
  for (const [slug, name] of city.areas) {
    add(`/${id}/${slug}/`, `Taxi i ${name} – flygtaxi till Kastrup och Malmö Airport`, `Boka flygtaxi med hämtning i ${name}, ${city.name}. Till Kastrup (CPH) eller Malmö Airport (MMX).`, () => areaPage(origins.get(slug)));
  }
  for (const airport of airportIds) {
    add(routePath(id, airport), `Taxi ${city.name}–${airports[airport].name} ${money(prices[id][airport])} – fast pris`, `Taxi från ${city.name} till ${airports[airport].full} till fast pris: ${money(prices[id][airport])} per enkelresa.`, () => routePage(id, airport));
  }
}

for (const id of airportIds) {
  add(airportPath(id), `Taxi till ${airports[id].name} (${airports[id].code})`, `Flygtaxi till ${airports[id].name} från Malmö ${money(prices.malmo[id])} och Lund ${money(prices.lund[id])}. Fast pris.`, () => airportPage(id));
}

for (const guide of guides) add(guidePath(guide), guide.title, guide.intro, () => guidePage(guide));

export { paths };

export function notFound(path) {
  schema = [];
  const body = `<section class="page-head"><div class="container"><div class="page-head-copy"><h1>Sidan hittades inte</h1><p class="lead">Här tog vägen slut. Gå tillbaka till startsidan eller välj en av sidorna nedan.</p><div class="actions">${button('/', 'Till startsidan')}${button('/boka-taxi/', 'Boka taxi', 'outline')}</div></div></div></section>${section(cityBlocks())}`;
  return shell({ path, title: 'Sidan hittades inte', description: 'Sidan hittades inte.', body, pageSchema: [] });
}
