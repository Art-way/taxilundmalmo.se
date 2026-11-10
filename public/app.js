const data = JSON.parse(document.querySelector('#site-data').textContent);
const formatPrice = new Intl.NumberFormat('sv-SE');
const hasPrice = (origin, airport) => data.prices[origin]?.[airport] != null;
const priceText = (origin, airport, fallback = 'Pris på förfrågan') => hasPrice(origin, airport) ? `${formatPrice.format(data.prices[origin][airport])} kr` : fallback;
const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ---------- Navigation ---------- */

const menu = document.querySelector('.menu-toggle');
const navGroups = [...document.querySelectorAll('.nav-group')];
const closeGroups = except => navGroups.forEach(group => { if (group !== except) group.open = false; });
const setMenu = open => {
  menu.setAttribute('aria-expanded', String(open));
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (!open) closeGroups();
};

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navGroups.forEach(group => group.addEventListener('toggle', () => { if (group.open) closeGroups(group); }));
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-group')) closeGroups();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openGroup = navGroups.find(group => group.open);
  if (openGroup) {
    openGroup.open = false;
    openGroup.querySelector('summary').focus();
  } else if (menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
matchMedia('(min-width: 941px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

// The mobile booking bar steps aside while a price widget is already on screen.
const mobileCta = document.querySelector('.mobile-cta');
const widgets = document.querySelectorAll('.quote');
if (mobileCta && widgets.length && 'IntersectionObserver' in window) {
  const onScreen = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? onScreen.add(entry.target) : onScreen.delete(entry.target);
    mobileCta.classList.toggle('is-hidden', onScreen.size > 0);
  }, { threshold: 0.35 });
  widgets.forEach(widget => observer.observe(widget));
}

/* ---------- Origin picker: searchable list of cities and areas ---------- */

function enhanceOrigin(wrap, index) {
  const select = wrap.querySelector('select');
  const listId = `origin-list-${index}`;
  const options = [...select.options].map((option, position) => ({
    value: option.value,
    label: option.textContent,
    hint: option.dataset.hint,
    group: option.parentElement.label,
    key: normalize(`${option.textContent} ${option.parentElement.label}`),
    id: `${listId}-${position}`,
  }));

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'combo-input';
  input.id = select.id;
  input.value = select.selectedOptions[0].textContent;
  input.placeholder = 'Sök ort eller område';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', listId);

  const list = document.createElement('div');
  list.className = 'combo-list';
  list.id = listId;
  list.hidden = true;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Avreseort');

  select.removeAttribute('id');
  select.hidden = true;
  select.after(input);
  wrap.append(list);

  let visible = [];
  let active = -1;

  function setActive(position) {
    active = position;
    list.querySelectorAll('.combo-option').forEach((element, at) => element.classList.toggle('is-active', at === active));
    const current = visible[active];
    if (current) {
      input.setAttribute('aria-activedescendant', current.id);
      document.getElementById(current.id).scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function render(query) {
    visible = query ? options.filter(option => option.key.includes(query)) : options;
    list.replaceChildren();
    let group = null;
    let groupElement = null;
    for (const option of visible) {
      if (option.group !== group) {
        group = option.group;
        groupElement = document.createElement('div');
        groupElement.setAttribute('role', 'group');
        groupElement.setAttribute('aria-label', group);
        const heading = document.createElement('div');
        heading.className = 'combo-group';
        heading.setAttribute('aria-hidden', 'true');
        heading.textContent = group;
        groupElement.append(heading);
        list.append(groupElement);
      }
      const item = document.createElement('div');
      item.className = 'combo-option';
      item.id = option.id;
      item.dataset.value = option.value;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.value === select.value));
      const label = document.createElement('span');
      label.textContent = option.label;
      const hint = document.createElement('span');
      hint.className = 'combo-hint';
      hint.textContent = option.hint;
      item.append(label, hint);
      groupElement.append(item);
    }
    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'combo-empty';
      empty.textContent = 'Ingen ort matchar. Välj närmaste ort och skriv adressen i nästa steg.';
      list.append(empty);
    }
    setActive(query ? (visible.length ? 0 : -1) : visible.findIndex(option => option.value === select.value));
  }

  function open(query = '') {
    list.hidden = false;
    wrap.classList.add('is-open');
    input.setAttribute('aria-expanded', 'true');
    render(query);
  }

  function close() {
    list.hidden = true;
    wrap.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    input.value = select.selectedOptions[0].textContent;
  }

  function choose(option) {
    select.value = option.value;
    close();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  select.addEventListener('change', () => { if (list.hidden) input.value = select.selectedOptions[0].textContent; });
  input.addEventListener('focus', () => { input.select(); open(); });
  input.addEventListener('click', () => { if (list.hidden) open(); });
  input.addEventListener('input', () => open(normalize(input.value)));
  input.addEventListener('blur', close);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (list.hidden) return open();
      if (!visible.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((active + step + visible.length) % visible.length);
    } else if (event.key === 'Enter') {
      if (list.hidden) return;
      event.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (event.key === 'Escape' && !list.hidden) {
      event.stopPropagation();
      close();
    }
  });
  list.addEventListener('mousedown', event => event.preventDefault());
  list.addEventListener('click', event => {
    const item = event.target.closest('.combo-option');
    if (!item) return;
    choose(options.find(option => option.value === item.dataset.value));
    input.blur();
  });
}

document.querySelectorAll('[data-origin]').forEach(enhanceOrigin);

/* ---------- Live price ---------- */

function quoteFor(form) {
  const origin = form.elements.fran.value;
  const airport = form.elements.till.value;
  return {
    origin,
    airport,
    route: `${data.origins[origin]} – ${data.airports[airport]}`,
    price: priceText(origin, airport),
    fixed: hasPrice(origin, airport),
  };
}

document.querySelectorAll('form[data-quote]').forEach(form => {
  const scope = form.hasAttribute('data-booking') ? document : form;
  const set = (selector, text) => scope.querySelectorAll(selector).forEach(element => { element.textContent = text; });

  function update() {
    const quote = quoteFor(form);
    form.querySelectorAll('[data-airport-price]').forEach(element => {
      element.textContent = priceText(quote.origin, element.dataset.airportPrice, 'På förfrågan');
    });
    set('[data-price]', quote.price);
    scope.querySelectorAll('[data-price]').forEach(element => element.classList.toggle('is-request', !quote.fixed));
    set('[data-price-label]', quote.fixed ? 'Fast pris · enkelresa' : 'Pris bekräftas före resan');
    set('[data-route-name]', quote.route);
  }

  form.addEventListener('change', event => {
    if (event.target.name === 'fran' || event.target.name === 'till') update();
  });
  update();
});

/* ---------- Route map ---------- */

const mapFigure = document.querySelector('[data-map]');
const mapForm = document.querySelector('form[data-quote]');
if (mapFigure && mapForm) {
  const { places, way } = data.map;
  const routePath = mapFigure.querySelector('[data-map-route]');
  const placeElements = [...mapFigure.querySelectorAll('[data-place]')];

  const routePoints = (origin, airport) => {
    const start = places[origin];
    const points = [start];
    if (airport === 'kastrup') {
      if (start[0] > way.ring[0] || start[1] < way.ring[1] - 60) points.push(way.ring);
      points.push(way.lernacken, way.peberholm);
    } else if (start[0] < way.e65[0] - 20 && start[1] > way.ring[1] - 60) {
      points.push(way.e65);
    } else if (start[0] < way.r108[0] - 10) {
      points.push(way.r108);
    }
    points.push(places[airport]);
    return points;
  };
  const toPath = points => {
    let d = 'M' + points[0].join(' ');
    for (let i = 1; i < points.length - 1; i++) d += ' Q' + points[i].join(' ') + ' ' + (points[i][0] + points[i + 1][0]) / 2 + ' ' + (points[i][1] + points[i + 1][1]) / 2;
    return d + ' L' + points.at(-1).join(' ');
  };

  function drawMap() {
    const quote = quoteFor(mapForm);
    routePath.setAttribute('d', toPath(routePoints(quote.origin, quote.airport)));
    routePath.classList.remove('is-drawing');
    routePath.getBoundingClientRect();
    routePath.classList.add('is-drawing');
    for (const element of placeElements) {
      element.classList.toggle('is-origin', element.dataset.place === quote.origin);
      element.classList.toggle('is-destination', element.dataset.place === quote.airport);
    }
    mapFigure.querySelector('[data-map-name]').textContent = quote.route;
    mapFigure.querySelector('[data-map-price]').textContent = quote.price;
  }

  mapFigure.addEventListener('click', event => {
    const place = event.target.closest('[data-place]')?.dataset.place;
    if (!place) return;
    if (place in data.airports) {
      const radio = [...mapForm.elements.till].find(option => option.value === place);
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      mapForm.elements.fran.value = place;
      mapForm.elements.fran.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  mapForm.addEventListener('change', event => {
    if (event.target.name === 'fran' || event.target.name === 'till') drawMap();
  });
  drawMap();
}

/* ---------- Number steppers ---------- */

document.querySelectorAll('[data-stepper]').forEach(stepper => {
  const input = stepper.querySelector('input');
  const [minus, plus] = stepper.querySelectorAll('button');
  const sync = () => {
    minus.disabled = Number(input.value) <= Number(input.min);
    plus.disabled = Number(input.value) >= Number(input.max);
  };
  stepper.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const next = Math.min(Number(input.max), Math.max(Number(input.min), (Number(input.value) || 0) + Number(button.dataset.step)));
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  input.addEventListener('input', sync);
  sync();
});

/* ---------- Booking form ---------- */

const booking = document.querySelector('[data-booking]');
if (booking) {
  const review = document.querySelector('[data-review]');
  const reviewDetails = review.querySelector('[data-review-details]');
  const summary = document.querySelector('.summary');
  const [detailsStep, reviewStep] = document.querySelectorAll('.booking-progress li');
  const now = new Date();
  booking.elements.datum.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const plural = (count, one, many) => `${count} ${Number(count) === 1 ? one : many}`;
  const whenText = () => {
    const date = booking.elements.datum.value;
    const time = booking.elements.tid.value;
    if (!date) return time ? `Kl. ${time}` : 'Välj datum och tid';
    const day = new Date(`${date}T12:00`).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    return time ? `${day} kl. ${time}` : day;
  };
  const peopleText = () => `${plural(booking.elements.resenarer.value || 0, 'resenär', 'resenärer')} · ${plural(booking.elements.vaskor.value || 0, 'väska', 'väskor')}`;
  const updateSummary = () => {
    summary.querySelector('[data-summary-when]').textContent = whenText();
    summary.querySelector('[data-summary-people]').textContent = peopleText();
  };
  booking.addEventListener('input', updateSummary);
  updateSummary();

  booking.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(booking);
    const address = fields.get('adress').trim();
    if (!address) {
      booking.elements.adress.setCustomValidity('Ange gatuadress och nummer.');
      booking.elements.adress.reportValidity();
      return;
    }
    const quote = quoteFor(booking);
    const entries = [
      ['Resa', quote.route], ['Pris', quote.price], ['Hämtadress', address],
      ['Hämtning', whenText()], ['Resenärer och bagage', peopleText()],
    ];
    const message = fields.get('meddelande').trim();
    if (message) entries.push(['Övrig information', message]);
    reviewDetails.replaceChildren(...entries.map(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      detail.textContent = value;
      row.append(term, detail);
      return row;
    }));

    booking.hidden = true;
    summary.hidden = true;
    review.hidden = false;
    detailsStep.removeAttribute('aria-current');
    reviewStep.setAttribute('aria-current', 'step');
    review.focus();
    review.scrollIntoView({ block: 'start' });
  });

  booking.elements.adress.addEventListener('input', () => booking.elements.adress.setCustomValidity(''));

  review.querySelector('[data-edit]').addEventListener('click', () => {
    review.hidden = true;
    booking.hidden = false;
    summary.hidden = false;
    reviewStep.removeAttribute('aria-current');
    detailsStep.setAttribute('aria-current', 'step');
    booking.elements.adress.focus();
  });
}
