import { readFileSync } from 'node:fs';
import { airports, cities, guides, prices } from './content.mjs';

const paths = new Map();
const cityIds = ['malmo', 'lund'];
const airportIds = Object.keys(airports);
const priceFormat = new Intl.NumberFormat('sv-SE');
const money = value => `${priceFormat.format(value)} kr`;
const cityPath = id => `/${id}/`;
const airportPath = id => `/flygtaxi/${airports[id].slug}/`;
const routePath = (city, airport) => `/${city}/taxi-till-${airports[airport].slug}/`;
const guidePath = guide => `/guider/${guide.slug}/`;
const bookingPath = (city, airport, area) => `/boka-taxi/?${new URLSearchParams({ fran: city, ...(airport && { till: airport }), ...(area && { omrade: area }) }).toString().replaceAll('&', '&amp;')}`;
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const icons = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  upRight: '<path d="M6 18 18 6M8 6h10v10"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M20 10c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  plane: '<path d="M22 2 9 15m13-13-5 20-5-9-9-5 19-6ZM9 15l-3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  route: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H17a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h8.5"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2m1-15a3 3 0 0 1 0 6m2 3a4 4 0 0 1 3 4v2"/>',
  case: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-6 3v8m6-8v8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};

const icon = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const logo = readFileSync(new URL('./public/taxi-syd-logo.svg', import.meta.url), 'utf8').replace('<svg ', '<svg aria-hidden="true" ');
const wordmark = (active = false) => `<a href="/" class="brand" aria-label="Taxi Syd, startsida"${active ? ' aria-current="page"' : ''}>${logo}</a>`;
const eyebrow = (label, mark = false) => `<p class="eyebrow">${mark ? '<span class="status-dot"></span>' : ''}${label}</p>`;
const link = (href, label, variant = 'primary', arrow = 'arrow') => `<a href="${href}" class="button button-${variant}">${label}${icon(arrow, 17)}</a>`;
const textLink = (href, label) => `<a href="${href}" class="text-link">${label}${icon('arrow', 18)}</a>`;
const navItem = (href, label, path) => `<a href="${href}"${path.startsWith(href) ? ' aria-current="location"' : ''}>${label}</a>`;

function header(path) {
  return `<header class="site-header"><div class="nav-shell">${wordmark(path === '/')}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">${icon('menu')}<span>Meny</span></button><nav id="main-nav" class="main-nav" aria-label="Huvudmeny">${navItem('/lund/', 'Lund', path)}${navItem('/malmo/', 'Malmö', path)}${navItem('/flygtaxi/', 'Flygtaxi', path)}${navItem('/priser/', 'Priser', path)}${navItem('/kontakt/', 'Kontakt', path)}</nav>${link('/boka-taxi/', 'Boka taxi', 'nav', 'upRight')}</div></header>`;
}

function footer() {
  return `<footer class="site-footer"><div class="container"><div class="footer-main"><div>${wordmark()}<p>Flygtaxi från Lund och Malmö.<br>Fast pris hela vägen.</p></div><div><p class="eyebrow">RES MED OSS</p><a href="/lund/">Taxi i Lund</a><a href="/malmo/">Taxi i Malmö</a><a href="/flygtaxi/">Flygtaxi</a><a href="/priser/">Priser</a></div><div><p class="eyebrow">INFORMATION</p><a href="/om-oss/">Om Taxi Syd</a><a href="/vanliga-fragor/">Vanliga frågor</a><a href="/guider/">Reseguider</a><a href="/kontakt/">Kontakt</a></div><div class="footer-action">${link('/boka-taxi/', 'Planera din resa', 'light', 'upRight')}</div></div><div class="footer-bottom"><span>Taxi Syd · Lund och Malmö</span><span>Lokal förhandsvisning</span></div></div></footer>`;
}

function shell({ title, description, path, body }) {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#faf8f3"><title>${escape(title)} | Taxi Syd</title><link rel="icon" href="/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head><body><a class="skip-link" href="#main">Hoppa till innehållet</a>${header(path)}<main id="main">${body}</main>${footer()}<script id="prices-data" type="application/json">${JSON.stringify(prices)}</script></body></html>`;
}

function selectField(name, label, glyph, items, selected, locked = false) {
  return `<label class="select-field"><span>${label}</span><span class="select-wrap">${icon(glyph, 19)}<select name="${name}" ${locked ? 'disabled' : 'required'}>${items.map(([value, text]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${text}</option>`).join('')}</select>${locked ? '' : icon('chevron', 15)}</span></label>`;
}

function routeFields(city, airport, locked = false) {
  return `${selectField('fran', 'Jag åker från', 'pin', cityIds.map(id => [id, cities[id].name]), city, locked)}${selectField('till', 'Jag åker till', 'plane', airportIds.map(id => [id, `${airports[id].name} (${airports[id].code})`]), airport)}`;
}

function quickQuote() {
  return `<form action="/boka-taxi/" method="get" class="quick-quote" data-quote>
    <fieldset class="quote-options"><legend>Hämta mig i</legend><div class="option-grid">
      ${cityIds.map(id => `<label class="quote-option"><input type="radio" name="fran" value="${id}" data-label="${cities[id].name}"${id === 'malmo' ? ' checked' : ''}><span>${cities[id].name}</span></label>`).join('')}
    </div></fieldset>
    <fieldset class="quote-options"><legend>Kör mig till</legend><div class="option-grid">
      ${airportIds.map(id => `<label class="quote-option"><input type="radio" name="till" value="${id}" data-label="${airports[id].name}"${id === 'kastrup' ? ' checked' : ''}><span>${airports[id].name}<small>${airports[id].code}</small></span></label>`).join('')}
    </div></fieldset>
    <div class="quote-action"><div><span class="price-label">Fast pris för enkelresa</span><output data-price class="quote-price" aria-live="polite">${money(prices.malmo.kastrup)}</output></div><button class="button button-primary" type="submit">Fortsätt${icon('arrow', 18)}</button></div>
  </form>`;
}

function routeMap() {
  return `<figure class="route-map" data-route-map>
    <div class="map-head"><span>Öresundsregionen</span><span>${icon('route', 16)} Flygtaxi</span></div>
    <svg class="map-drawing" viewBox="0 0 500 340" role="img" aria-label="Schematisk karta över Lund, Malmö, Kastrup och Malmö Airport">
      <path class="map-land" d="M0 0h122l-8 28-33 25 13 36-27 33 18 39 15 16-8 28 20 10 24 19-19 25-41 19-8 24-15 38H0Z"/>
      <path class="map-land" d="M307 0h193v340H277l-9-22-17-21 3-25-15-20-5-23-11-23 9-25 4-26 17-12 4-23 21-17 7-35 14-22Z"/>
      <path class="map-grid" d="M0 70h500M0 140h500M0 210h500M0 280h500M100 0v340M200 0v340M300 0v340M400 0v340"/>
      <path class="map-roads" d="M295 67 338 92l35-30 51 17 44 38m-130-25-8 47 30 40 59 9 36 32m-95-41-17 62 22 46m-122-75 59 17 41 12 81 4m-197-96 55 35 48-5m-258 52-40 21 17 42"/>
      <text class="map-region" x="17" y="122">Danmark</text>
      <text class="map-region" x="418" y="42">Skåne</text>
      <text class="map-water" x="158" y="117" transform="rotate(-15 158 117)">Öresund</text>
      <path class="map-route" data-map-route="lund:kastrup" d="M374 87Q345 94 320 146L282 173 224 211 103 239"/>
      <path class="map-route is-active" data-map-route="malmo:kastrup" d="M282 173 224 211 103 239"/>
      <path class="map-route" data-map-route="lund:sturup" d="M374 87Q353 112 362 156Q368 198 418 238"/>
      <path class="map-route" data-map-route="malmo:sturup" d="M282 173Q322 179 352 217Q375 237 418 238"/>
      <g class="map-place" data-map-place="lund"><circle cx="374" cy="87" r="7"/><text x="365" y="70" text-anchor="end">Lund</text></g>
      <g class="map-place is-active" data-map-place="malmo"><circle cx="282" cy="173" r="7"/><text x="270" y="158" text-anchor="end">Malmö</text></g>
      <g class="map-place is-active" data-map-place="kastrup"><circle cx="103" cy="239" r="7"/><text x="103" y="271" text-anchor="middle">Kastrup</text><text class="map-code" x="103" y="291" text-anchor="middle">CPH</text></g>
      <g class="map-place" data-map-place="sturup"><circle cx="418" cy="238" r="7"/><text x="418" y="270" text-anchor="middle">Malmö Airport</text><text class="map-code" x="418" y="290" text-anchor="middle">MMX</text></g>
    </svg>
    <figcaption><span data-map-caption>Malmö → Kastrup</span><span>Schematisk karta</span></figcaption>
  </figure>`;
}

function routeSection(cityFilter = cityIds, airportFilter = airportIds, heading = 'Fasta flygpriser') {
  return `<section class="section container price-section" id="flygresor" aria-labelledby="prices-heading">
    <div class="section-head"><h2 id="prices-heading">${heading}</h2><p class="section-note">Pris per enkelresa</p></div>
    <div class="fare-board"><table class="fare-table" aria-labelledby="prices-heading">
      <thead><tr><th scope="col">Från</th>${airportFilter.map(id => `<th scope="col">${airports[id].name}<small>${airports[id].code}</small></th>`).join('')}</tr></thead>
      <tbody>${cityFilter.map(city => `<tr><th scope="row">${cities[city].name}</th>${airportFilter.map(id => `<td><a href="${routePath(city, id)}" aria-label="${cities[city].name} till ${airports[id].name}, ${money(prices[city][id])}"><span>${money(prices[city][id])}</span>${icon('arrow', 17)}</a></td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <p class="fare-note">Välj ett pris för att se detaljer om resan.</p>
  </section>`;
}

function cityCards() {
  return `<div class="city-grid">${cityIds.map(id => `<a href="${cityPath(id)}" class="city-card">${icon('pin', 20)}<div><h3>Taxi i ${cities[id].name}</h3><p>Priser och upphämtningsområden</p></div>${icon('arrow', 19)}</a>`).join('')}</div>`;
}

function guideCards(items) {
  return `<div class="guide-grid">${items.map(guide => `<a class="guide-card" href="${guidePath(guide)}"><span class="icon-tile">${icon(guide.icon, 17)}</span><div><h3>${guide.title}</h3><p>${guide.intro}</p></div>${icon('arrow', 17)}</a>`).join('')}</div>`;
}

function breadcrumb(items) {
  return `<nav class="breadcrumbs" aria-label="Brödsmulor"><a href="/">Hem</a>${items.map(([label, href]) => `<span aria-hidden="true">/</span>${href ? `<a href="${href}">${label}</a>` : `<span aria-current="page">${label}</span>`}`).join('')}</nav>`;
}

function pageIntro(tag, title, intro, items = [[title]], content = '', style = '') {
  return `<section class="page-intro container">${breadcrumb(items)}<div class="intro-panel ${style}"><div>${eyebrow(tag, true)}<h1>${title}</h1><p class="lead">${intro}</p></div>${content}</div></section>`;
}

function callout(title, body, href = '/boka-taxi/', action = 'Planera din resa') {
  return `<section class="section container"><div class="callout"><div>${eyebrow('TAXI SYD · SKÅNE')}<h2>${title}</h2><p>${body}</p></div>${link(href, action, 'nav', 'upRight')}</div></section>`;
}

function faq(items) {
  return `<div class="faq">${items.map(([question, answer]) => `<details><summary>${question}${icon('chevron', 18)}</summary><div>${answer}</div></details>`).join('')}</div>`;
}

const questions = [
  ['Vad kostar flygtaxi?', 'Välj Lund eller Malmö som avreseort och Kastrup eller Malmö Airport som destination. De fyra priserna finns på <a href="/priser/">prissidan</a>.'],
  ['Vilken flygplats ska jag välja?', 'Välj Kastrup om det står CPH på din biljett. Välj Malmö Airport, även kallad Sturup, om det står MMX.'],
  ['Kan jag prova att boka en resa?', 'Ja. Du kan välja en resa och granska uppgifterna i förhandsvisningen. Formuläret skickar ingen bokning.'],
  ['Vad gör jag om jag behöver extra utrymme?', 'Ange antal resenärer och beskriv väskor eller särskilda behov i reseuppgifterna. Bilens kapacitet behöver bekräftas inför en riktig resa.'],
];

function home() {
  return `<section class="hero container" aria-labelledby="hero-title">
    <div class="hero-content">${eyebrow('Lund · Malmö', true)}<h1 id="hero-title">Flygtaxi till fast pris</h1><p class="hero-lead">Välj var du vill bli hämtad och vilken flygplats du ska till.</p>${quickQuote()}</div>
    ${routeMap()}
  </section>
  ${routeSection(cityIds, airportIds, 'Jämför våra fyra resor')}
  <section class="section container"><div class="section-head"><h2>Upphämtning i Lund och Malmö</h2></div>${cityCards()}</section>
  <section class="section container help-grid"><div><h2>Inför avresan</h2>${guideCards(guides.slice(0, 2))}${textLink('/guider/', 'Alla reseguider')}</div><div><h2>Vanliga frågor</h2>${faq(questions.slice(0, 3))}${textLink('/vanliga-fragor/', 'Se alla frågor')}</div></section>`;
}

function cityPage(id) {
  const city = cities[id];
  const title = `Taxi i ${city.name}`;
  return `${pageIntro(city.label, `${title}.`, city.intro, [[title]], `<div class="intro-cta">${link(bookingPath(id, 'kastrup'), 'Planera din resa')}</div>`, `tint-${id}`)}${routeSection([id])}<section class="section container"><div class="section-head"><div>${eyebrow('OMRÅDEN', true)}<h2>Områden kring ${city.name}.</h2></div><p class="section-note">Utforska planerade upphämtningsområden i förhandsvisningen.</p></div><div class="area-grid">${city.areas.map(([slug, name]) => `<a class="area-card" href="/${id}/${slug}/">${icon('pin', 18)}<span>${name}</span>${icon('upRight', 16)}</a>`).join('')}</div></section>${callout('Hitta rätt mötesplats.', 'Läs hur du kan förbereda en hämtning vid centralstationen.', guidePath(guides[id === 'lund' ? 2 : 3]), 'Läs guiden')}`;
}

function areaPage(id, [slug, name, guidance]) {
  const city = cities[id];
  return `${pageIntro(`PLANERAT OMRÅDE · ${city.name.toUpperCase()}`, `Taxi i ${name}.`, `Se hur en resa med upphämtning i ${name} kan planeras. Områdets täckning och pris behöver bekräftas.`, [[city.name, cityPath(id)], [name]], '', `tint-${id}`)}
  <section class="section container two-columns"><article class="article-copy"><h2>Hämtning i ${name}.</h2><p>${guidance}</p><p>För resa till flygplatsen, kontrollera flygplatskoden på din biljett och ange önskad tid för upphämtning.</p>${textLink(bookingPath(id, null, slug), 'Prova reseplaneringen')}</article><aside class="info-card">${eyebrow('FLYGRESOR FRÅN STADEN', true)}<h2>${city.name}.</h2><p>De fasta stadspriserna visas på stadssidan. Priser för ${name} behöver bekräftas separat.</p>${textLink(cityPath(id), `Se flygresor från ${city.name}`)}</aside></section>`;
}

function routePage(cityId, airportId) {
  const city = cities[cityId];
  const airport = airports[airportId];
  const title = `Taxi från ${city.name} till ${airport.name}`;
  const price = prices[cityId][airportId];
  return `${pageIntro(`FLYGTAXI · ${airport.code}`, `${title}.`, `Planera din resa från ${city.name} till ${airport.full} och välj när bilen ska hämta dig.`, [[city.name, cityPath(cityId)], [airport.name]], `<div class="route-quote"><span class="price-label">FAST PRIS · ENKELRESA</span><p>${money(price)}</p>${link(bookingPath(cityId, airportId), 'Boka denna resa')}</div>`, `tint-${cityId}`)}
  <section class="section container two-columns"><article class="article-copy"><h2>Så planerar du resan.</h2><ol class="step-list"><li><strong>Ange hämtadress i ${city.name}.</strong><span>Lägg till port eller hotellentré om det gör mötet enklare.</span></li><li><strong>Välj datum och tid.</strong><span>Utgå från flygbolagets incheckning och räkna bakåt till hämtningen.</span></li><li><strong>Kontrollera destinationen.</strong><span>På biljetten ska det stå ${airport.code} för ${airport.name}.</span></li></ol></article><aside class="info-card">${eyebrow('DIN DESTINATION', true)}<h2>${airport.code}.</h2><p>${airport.full} · ${airport.country}</p>${textLink(airportPath(airportId), 'Läs om destinationen')}</aside></section>
  <section class="section container faq-layout"><div>${eyebrow('INFÖR AVRESAN', true)}<h2>Bra att veta.</h2></div>${faq([[`Vad kostar resan?`, `Det fasta priset för enkelresan ${city.name} → ${airport.name} är ${money(price)}. Pris och villkor för andra adresser eller tillval behöver bekräftas.`], ['Hur väljer jag en annan flygplats?', `Öppna <a href="${cityPath(cityId)}">Taxi i ${city.name}</a> för att jämföra båda alternativen.`]])}</section>`;
}

function booking(params) {
  const requestedCity = params.get('fran');
  const city = cityIds.includes(requestedCity) ? requestedCity : 'malmo';
  const requestedAirport = params.get('till');
  const airport = airportIds.includes(requestedAirport) ? requestedAirport : 'kastrup';
  const area = cities[city].areas.find(([slug]) => slug === params.get('omrade'));
  const selectedPrice = area ? 'Pris på förfrågan' : money(prices[city][airport]);
  return `${pageIntro('Planera din resa', 'Boka flygtaxi', 'Fyll i hämtningen och granska din resa.', [['Boka taxi']])}
  <section class="section container booking-section" aria-label="Reseuppgifter"><ol class="booking-progress" aria-label="Bokningssteg"><li aria-current="step"><span>1</span> Resa och hämtning</li><li><span>2</span> Granska</li></ol>
  <form class="booking-form" data-quote data-booking${area ? ` data-area="${escape(area[1])}"` : ''}><h2>Resa och hämtning</h2><div class="field-grid route-fields">${routeFields(city, airport, Boolean(area))}</div>${area ? `<p class="demo-note">Valt område · ${area[1]}. Täckning och pris behöver bekräftas.</p>` : ''}
  <label>Hämtadress<input name="adress" autocomplete="off" required maxlength="120" placeholder="Gatuadress och nummer${area ? ` i ${escape(area[1])}` : ''}"></label><div class="field-grid"><label>Datum<input type="date" name="datum" required></label><label>Hämtningstid<input type="time" name="tid" required></label></div>
  <fieldset class="booking-details"><legend>Resenärer och bagage</legend><div class="field-grid"><label>Resenärer<select name="resenarer"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5+</option></select></label><label>Stora väskor<select name="vaskor"><option>0</option><option>1</option><option selected>2</option><option>3</option><option>4+</option></select></label></div><label>Övrig information <span class="optional">valfritt</span><textarea name="meddelande" rows="2" maxlength="250" placeholder="Till exempel port, mötesplats eller behov av barnstol"></textarea></label></fieldset>
  <div class="booking-submit"><button type="submit" class="button button-primary" disabled>Granska resan${icon('arrow', 18)}</button><noscript><p>Aktivera JavaScript för att granska resan.</p></noscript></div></form>
  <aside class="info-card booking-summary"><div><h2>Din resa</h2><p class="summary-route" data-route-name>${area?.[1] ?? cities[city].name} → ${airports[airport].name}</p></div><div><span data-price-label class="price-label">${area ? 'Områdespris' : 'Fast pris för enkelresa'}</span><output data-booking-price class="booking-price" aria-live="polite">${selectedPrice}</output></div><p class="demo-note">Förhandsvisning. Uppgifterna stannar på sidan.</p></aside>
  <section class="review-panel" data-review hidden tabindex="-1"><span class="icon-tile">${icon('check', 24)}</span><h2>Din resesammanfattning</h2><p class="demo-note">Det här är en förhandsvisning. Ingen bokning har skickats.</p><dl data-review-details></dl><button type="button" class="button button-outline" data-edit>Ändra uppgifter${icon('arrow', 17)}</button></section></section>`;
}

function add(path, title, description, body) {
  paths.set(path, params => shell({ title, description, path, body: body(params) }));
}

add('/', 'Flygtaxi från Lund och Malmö', 'Taxi från Lund och Malmö till Kastrup och Malmö Airport. Se fasta priser och planera din flygresa.', home);
add('/boka-taxi/', 'Boka taxi', 'Planera en taxiresa till Kastrup eller Malmö Airport.', booking);
add('/priser/', 'Fasta priser för flygtaxi', 'Jämför fasta priser från Lund och Malmö.', () => `${pageIntro('PRISER', 'Fasta priser', 'Fyra resor från Lund och Malmö till Kastrup och Malmö Airport. Välj en resa för detaljer och bokning.', [['Priser']])}${routeSection(cityIds, airportIds, 'Jämför våra fyra resor')}`);
add('/om-oss/', 'Om Taxi Syd', 'Taxi Syd och våra flygresor från Lund och Malmö.', () => `${pageIntro('TAXI SYD · SKÅNE', 'Om Taxi Syd.', 'Taxi Syd samlar resor från Lund och Malmö till två flygplatser, med ett fast pris för varje visad rutt.', [['Om Taxi Syd']])}<section class="section container">${cityCards()}</section>${callout('På väg till flyget?', 'Välj din avreseort och jämför resorna till Kastrup och Sturup.')}`);
add('/kontakt/', 'Kontakt', 'Kontakt och reseinformation för Taxi Syd.', () => `${pageIntro('TAXI SYD · KONTAKT', 'Hur kan vi hjälpa dig?', 'Kontaktuppgifter läggs till när Taxi Syd är redo att ta emot förfrågningar.', [['Kontakt']])}<section class="section container two-columns"><div class="info-card"><h2>Planera en resa.</h2><p>Prova reseväljaren, se ett fast pris och granska en lokal resesammanfattning.</p>${textLink('/boka-taxi/', 'Öppna reseplaneringen')}</div><div class="info-card"><h2>Har du en fråga?</h2><p>Läs om flygplatser, hämtning och förhandsvisningen.</p>${textLink('/vanliga-fragor/', 'Vanliga frågor')}</div></section>`);
add('/vanliga-fragor/', 'Vanliga frågor', 'Svar på frågor om flygtaxi och reseplanering.', () => `${pageIntro('HJÄLP INFÖR RESAN', 'Vanliga frågor.', 'Hitta svar om priser, destinationer och reseplanering.', [['Vanliga frågor']])}<section class="section container narrow">${faq(questions)}</section>`);
add('/flygtaxi/', 'Flygtaxi', 'Välj taxi till Kastrup eller Malmö Airport från Lund och Malmö.', () => `${pageIntro('TVÅ FLYGPLATSER · FYRA RESOR', 'Flygtaxi till rätt terminal.', 'Välj flygplats och se alternativen från Lund och Malmö.', [['Flygtaxi']])}<section class="section container city-grid">${airportIds.map(id => `<div class="info-card airport-card">${eyebrow(airports[id].code, true)}<h2>${airports[id].name}.</h2><p>${airports[id].full} · ${airports[id].country}</p>${textLink(airportPath(id), 'Se resorna')}</div>`).join('')}</section>${routeSection()}`);
add('/guider/', 'Reseguider', 'Praktiska råd inför taxiresan.', () => `${pageIntro('INFÖR AVRESAN', 'Reseguider.', 'Praktiska tips om mötesplatser, bagage och att välja rätt flygplats.', [['Reseguider']])}<section class="section container">${guideCards(guides)}</section>`);

for (const id of cityIds) {
  add(cityPath(id), `Taxi i ${cities[id].name}`, `Se fasta flygpriser från ${cities[id].name}.`, () => cityPage(id));
  for (const area of cities[id].areas) {
    add(`/${id}/${area[0]}/`, `Taxi i ${area[1]}`, `Planera upphämtning i ${area[1]}.`, () => areaPage(id, area));
  }
  for (const airport of airportIds) {
    add(routePath(id, airport), `Taxi från ${cities[id].name} till ${airports[airport].name}`, `Fast pris ${money(prices[id][airport])} från ${cities[id].name} till ${airports[airport].name}.`, () => routePage(id, airport));
  }
}

for (const id of airportIds) {
  const airport = airports[id];
  const title = `Taxi till ${airport.name}`;
  add(airportPath(id), title, `Jämför flygtaxi till ${airport.name} från Malmö och Lund.`, () => `${pageIntro(`FLYGPLATSKOD · ${airport.code}`, title, `${airport.full} i ${airport.country}. Välj din avreseort för fast pris och reseplanering.`, [['Flygtaxi', '/flygtaxi/'], [airport.name]])}${routeSection(cityIds, [id], 'Välj var du åker från')}${callout('Rätt flygplats från början.', 'Kontrollera flygplatskoden på din biljett före bokningen.', guidePath(guides[0]), 'Jämför flygplatserna')}`);
}

for (const guide of guides) {
  add(guidePath(guide), guide.title, guide.intro, () => `${pageIntro(guide.tag, guide.title, guide.intro, [['Reseguider', '/guider/'], [guide.title]])}<article class="section container narrow article-copy">${guide.sections.map(([heading, copy]) => `<h2>${heading}.</h2><p>${copy}</p>`).join('')}${textLink('/guider/', 'Fler reseguider')}</article>${callout('Se ditt fasta pris.', 'Välj avreseort och flygplats för att planera din resa.')}`);
}

export { paths };

export function notFound(path) {
  return shell({ path, title: 'Sidan hittades inte', description: 'Sidan hittades inte.', body: pageIntro('404', 'Här tog vägen slut.', 'Gå tillbaka till startsidan och välj en ny väg.', [['Sidan hittades inte']], link('/', 'Till startsidan')) });
}
