const data = JSON.parse(document.querySelector('#site-data').textContent);
const formatPrice = new Intl.NumberFormat('sv-SE');
const isAirport = place => place in data.airports;
const hasPrice = (from, to) => data.prices[from]?.[to] != null;
const priceText = (from, to) => `${formatPrice.format(data.prices[from][to])} kr`;
const placeName = place => data.places[place]?.name;
const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const changed = element => element.dispatchEvent(new Event('change', { bubbles: true }));

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

/* ---------- Place picker: searchable list of cities, areas and airports ---------- */

function enhancePlace(wrap, index) {
  const select = wrap.querySelector('select');
  const listId = `place-list-${index}`;
  const fieldLabel = document.querySelector(`label[for="${select.id}"]`)?.textContent ?? 'Plats';
  const options = [...select.options].filter(option => option.value).map((option, position) => ({
    value: option.value,
    label: option.textContent,
    hint: option.dataset.hint,
    group: option.parentElement.label,
    key: normalize(`${option.textContent} ${option.parentElement.label} ${option.dataset.hint}`),
    id: `${listId}-${position}`,
  }));
  const currentLabel = () => (select.value ? select.selectedOptions[0].textContent : '');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'combo-input';
  input.id = select.id;
  input.value = currentLabel();
  input.placeholder = select.options[0].textContent;
  input.required = select.required;
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
  list.setAttribute('aria-label', fieldLabel);

  select.removeAttribute('id');
  select.required = false;
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
      empty.textContent = 'Ingen ort matchar. Välj närmaste ort – gatuadressen anger du i bokningen.';
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
    input.value = currentLabel();
  }

  function choose(value) {
    select.value = value;
    close();
    changed(select);
  }

  select.addEventListener('change', () => {
    input.setCustomValidity('');
    if (list.hidden) input.value = currentLabel();
  });
  input.addEventListener('focus', () => { input.select(); open(); });
  input.addEventListener('click', () => { if (list.hidden) open(); });
  input.addEventListener('input', () => open(normalize(input.value)));
  input.addEventListener('blur', () => {
    // Emptying the field clears the choice.
    if (!input.value.trim() && select.value) choose('');
    else close();
  });
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
      if (visible[active]) choose(visible[active].value);
    } else if (event.key === 'Escape' && !list.hidden) {
      event.stopPropagation();
      close();
    }
  });
  list.addEventListener('mousedown', event => event.preventDefault());
  list.addEventListener('click', event => {
    const item = event.target.closest('.combo-option');
    if (!item) return;
    choose(item.dataset.value);
    input.blur();
  });
}

document.querySelectorAll('[data-place-field]').forEach(enhancePlace);

/* ---------- Trip and price ---------- */

function quoteFor(form) {
  const from = form.elements.fran.value;
  const to = form.elements.till.value;
  const complete = Boolean(from && to);
  const invalid = complete && from === to && isAirport(from);
  const fixed = complete && !invalid && hasPrice(from, to);
  return {
    from,
    to,
    complete,
    invalid,
    fixed,
    route: `${placeName(from) ?? 'Välj från'} – ${placeName(to) ?? 'välj till'}`,
    label: !complete ? 'Pris' : invalid ? 'Kontrollera resan' : fixed ? 'Fast pris · enkelresa' : 'Pris bekräftas före resan',
    price: !complete ? 'Välj från och till' : invalid ? 'Välj två olika platser' : fixed ? priceText(from, to) : 'Pris på förfrågan',
  };
}

document.querySelectorAll('form[data-quote]').forEach(form => {
  const scope = form.hasAttribute('data-booking') ? document : form;
  const set = (selector, text) => scope.querySelectorAll(selector).forEach(element => { element.textContent = text; });
  const fromSelect = form.elements.fran;
  const toSelect = form.elements.till;

  function update() {
    const quote = quoteFor(form);
    set('[data-price]', quote.price);
    scope.querySelectorAll('[data-price]').forEach(element => element.classList.toggle('is-request', !quote.fixed));
    set('[data-price-label]', quote.label);
    set('[data-route-name]', quote.route);
    set('[data-submit-label]', !quote.complete || quote.invalid ? 'Granska resan' : quote.fixed ? 'Granska bokningen' : 'Granska prisförfrågan');
    form.querySelectorAll('[data-quick-to]').forEach(chip => {
      const airport = chip.dataset.quickTo;
      chip.setAttribute('aria-pressed', String(quote.to === airport));
      chip.querySelector('[data-chip-price]').textContent = hasPrice(quote.from, airport) ? priceText(quote.from, airport) : '';
    });
  }

  const swap = form.querySelector('[data-swap]');
  swap.hidden = false;
  swap.addEventListener('click', () => {
    [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
    const fromAddress = form.elements.franadress;
    const toAddress = form.elements.tilladress;
    if (fromAddress && toAddress) [fromAddress.value, toAddress.value] = [toAddress.value, fromAddress.value];
    changed(fromSelect);
    changed(toSelect);
  });

  const quick = form.querySelector('[data-quick]');
  quick.hidden = false;
  quick.addEventListener('click', event => {
    const chip = event.target.closest('[data-quick-to]');
    if (!chip) return;
    toSelect.value = chip.dataset.quickTo;
    changed(toSelect);
  });

  form.addEventListener('change', event => {
    if (event.target === fromSelect || event.target === toSelect) update();
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
  const far = point => point[1] < way.ring[1] - 60;

  // Waypoints from a town to an airport, roughly following the main roads.
  const toAirport = (place, airport) => {
    const start = places[place];
    const points = [start];
    if (airport === 'kastrup') {
      if (place === 'sturup') points.push(way.e65);
      if (start[0] > way.ring[0] || far(start)) points.push(way.ring);
      points.push(way.lernacken, way.peberholm);
    } else if (start[0] < way.e65[0] - 20 && !far(start)) {
      points.push(way.e65);
    } else if (start[0] < way.r108[0] - 10) {
      points.push(way.r108);
    }
    points.push(places[airport]);
    return points;
  };
  const routePoints = (from, to) => {
    if (isAirport(to)) return toAirport(from, to);
    if (isAirport(from)) return toAirport(to, from).reverse();
    return [places[from], places[to]];
  };
  const toPath = points => {
    let d = 'M' + points[0].join(' ');
    for (let i = 1; i < points.length - 1; i++) d += ' Q' + points[i].join(' ') + ' ' + (points[i][0] + points[i + 1][0]) / 2 + ' ' + (points[i][1] + points[i + 1][1]) / 2;
    return d + ' L' + points.at(-1).join(' ');
  };

  function drawMap() {
    const quote = quoteFor(mapForm);
    const drawable = quote.complete && quote.from !== quote.to;
    routePath.setAttribute('d', drawable ? toPath(routePoints(quote.from, quote.to)) : '');
    routePath.classList.remove('is-drawing');
    routePath.getBoundingClientRect();
    if (drawable) routePath.classList.add('is-drawing');
    for (const element of placeElements) {
      element.classList.toggle('is-origin', element.dataset.place === quote.from);
      element.classList.toggle('is-destination', element.dataset.place === quote.to);
    }
    showSide();
    mapFigure.querySelector('[data-map-name]').textContent = quote.route;
    mapFigure.querySelector('[data-map-price]').textContent = quote.complete ? quote.price : '';
    mapFigure.querySelector('[data-map-label]').textContent = quote.complete ? quote.label : 'Välj från och till på kartan';
  }

  // The switch above the map decides which point the next click sets. Picking the place that is
  // already at the other end swaps the two, so the map always shows two different points.
  const pickBar = mapFigure.querySelector('[data-map-pick]');
  const pickButtons = [...pickBar.querySelectorAll('[data-pick]')];
  let side = mapForm.elements.fran.value ? 'till' : 'fran';
  const showSide = () => {
    for (const button of pickButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.pick === side));
      button.querySelector('[data-pick-name]').textContent = placeName(mapForm.elements[button.dataset.pick].value) ?? 'Välj';
    }
  };
  pickBar.hidden = false;
  pickBar.addEventListener('click', event => {
    const pick = event.target.closest('[data-pick]');
    if (pick) {
      side = pick.dataset.pick;
    } else if (event.target.closest('[data-map-clear]')) {
      for (const name of ['fran', 'till']) {
        mapForm.elements[name].value = '';
        changed(mapForm.elements[name]);
      }
      side = 'fran';
    }
    showSide();
  });
  mapFigure.addEventListener('click', event => {
    const place = event.target.closest('[data-place]')?.dataset.place;
    if (!place) return;
    const target = mapForm.elements[side];
    const other = mapForm.elements[side === 'fran' ? 'till' : 'fran'];
    if (other.value === place) {
      other.value = target.value;
      changed(other);
    }
    target.value = place;
    changed(target);
    if (side === 'fran' && !other.value) side = 'till';
    showSide();
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
  const fields = booking.elements;
  const placeInput = { fran: document.getElementById('b-fran'), till: document.getElementById('b-till') };
  const address = { fran: fields.franadress, till: fields.tilladress };
  const editTargets = { fran: placeInput.fran, till: placeInput.till, tid: fields.datum, resenarer: fields.resenarer };
  const now = new Date();
  fields.datum.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  // An airport needs no street address; a town or area does.
  function syncAddress(side) {
    const place = fields[side].value;
    const airport = isAirport(place);
    address[side].required = !airport;
    address[side].placeholder = airport ? 'Terminal eller mötesplats (valfritt)' : place ? `Gatuadress och nummer i ${placeName(place)}` : 'Gatuadress och nummer';
  }

  const plural = (count, one, many) => `${count} ${Number(count) === 1 ? one : many}`;
  const whenText = () => {
    const date = fields.datum.value;
    const time = fields.tid.value;
    if (!date) return time ? `Kl. ${time}` : 'Välj datum och tid';
    const day = new Date(`${date}T12:00`).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    return time ? `${day} kl. ${time}` : day;
  };
  const peopleText = () => `${plural(fields.resenarer.value || 0, 'resenär', 'resenärer')} · ${plural(fields.vaskor.value || 0, 'väska', 'väskor')}`;
  const legText = side => {
    const place = fields[side].value;
    const street = address[side].value.trim();
    if (!place) return street || 'Välj plats';
    if (isAirport(place)) return street ? `${placeName(place)} · ${street}` : placeName(place);
    return street ? `${street}, ${placeName(place)}` : `${placeName(place)} · ange adress`;
  };

  function updateSummary() {
    syncAddress('fran');
    syncAddress('till');
    summary.querySelector('[data-summary-fran]').textContent = legText('fran');
    summary.querySelector('[data-summary-till]').textContent = legText('till');
    summary.querySelector('[data-summary-when]').textContent = whenText();
    summary.querySelector('[data-summary-people]').textContent = peopleText();
  }
  booking.addEventListener('input', updateSummary);
  booking.addEventListener('change', updateSummary);
  updateSummary();

  function validate() {
    const quote = quoteFor(booking);
    for (const control of [placeInput.fran, placeInput.till, address.fran, address.till]) control.setCustomValidity('');
    if (quote.invalid) {
      placeInput.till.setCustomValidity('Välj en annan plats än den du åker från.');
    } else if (quote.complete && quote.from === quote.to && normalize(address.fran.value) === normalize(address.till.value) && address.fran.value.trim()) {
      address.till.setCustomValidity('Ange en annan adress än hämtadressen.');
    }
    return booking.reportValidity();
  }
  for (const control of [address.fran, address.till]) control.addEventListener('input', () => address.till.setCustomValidity(''));

  function showForm(target) {
    review.hidden = true;
    booking.hidden = false;
    summary.hidden = false;
    reviewStep.removeAttribute('aria-current');
    detailsStep.setAttribute('aria-current', 'step');
    const control = editTargets[target] ?? placeInput.fran;
    control.scrollIntoView({ block: 'center' });
    control.focus({ preventScroll: true });
  }

  booking.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate()) return;
    const quote = quoteFor(booking);
    const entries = [
      ['Från', legText('fran'), 'fran'], ['Till', legText('till'), 'till'],
      ['Hämtning', whenText(), 'tid'], ['Resenärer och bagage', peopleText(), 'resenarer'],
      ['Pris', quote.price],
    ];
    const message = fields.meddelande.value.trim();
    if (message) entries.push(['Övrig information', message]);
    reviewDetails.replaceChildren(...entries.map(([label, value, target]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      detail.textContent = value;
      if (target) {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'link-button';
        edit.dataset.edit = target;
        edit.textContent = 'Ändra';
        edit.setAttribute('aria-label', `Ändra ${label.toLowerCase()}`);
        detail.append(edit);
      }
      row.append(term, detail);
      return row;
    }));
    review.querySelector('[data-review-title]').textContent = quote.fixed ? 'Granska din bokning' : 'Granska din prisförfrågan';
    review.querySelector('[data-review-type]').textContent = quote.fixed
      ? 'Bokning till fast pris. Resan är bokad först när Taxi Syd har bekräftat den.'
      : 'Prisförfrågan. Sträckan har inget fast pris. Taxi Syd återkommer med ett pris för resan mellan de två adresserna, och resan är bokad först när du har godkänt priset och fått en bekräftelse.';

    booking.hidden = true;
    summary.hidden = true;
    review.hidden = false;
    detailsStep.removeAttribute('aria-current');
    reviewStep.setAttribute('aria-current', 'step');
    review.focus({ preventScroll: true });
    review.scrollIntoView({ block: 'start' });
  });

  // "Ändra" in the side summary and in the review returns to the form with everything kept.
  document.querySelectorAll('.summary [data-edit]').forEach(button => { button.hidden = false; });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-edit]');
    if (button) showForm(button.dataset.edit);
  });
}
