const prices = JSON.parse(document.querySelector('#prices-data').textContent);
const formatPrice = new Intl.NumberFormat('sv-SE');
const menu = document.querySelector('.menu-toggle');

menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});

function quoteFor(form) {
  const from = form.elements.fran;
  const to = form.elements.till;
  const areaApplies = form.hasAttribute('data-area');
  return {
    route: `${form.dataset.area ?? from.selectedOptions[0].textContent} → ${to.selectedOptions[0].textContent.split(' (')[0]}`,
    price: areaApplies ? 'Pris på förfrågan' : `${formatPrice.format(prices[from.value][to.value])} kr`,
    areaApplies,
  };
}

document.querySelectorAll('form[data-quote]').forEach(form => {
  const output = form.querySelector('[data-price]');
  const summary = document.querySelector('.booking-summary');

  function updateQuote() {
    const quote = quoteFor(form);
    if (output) output.textContent = quote.price;
    if (form.hasAttribute('data-booking')) {
      summary.querySelector('[data-route-name]').textContent = quote.route;
      summary.querySelector('[data-booking-price]').textContent = quote.price;
      summary.querySelector('[data-price-label]').textContent = quote.areaApplies ? 'OMRÅDESPRIS' : 'FAST PRIS · ENKELRESA';
    }
  }

  form.elements.fran.addEventListener('change', updateQuote);
  form.elements.till.addEventListener('change', updateQuote);
  updateQuote();
});

document.querySelectorAll('.filter').forEach(filter => {
  const buttons = [...filter.querySelectorAll('button')];
  const cards = [...filter.closest('section').querySelectorAll('.route-card')];

  buttons.forEach(button => button.addEventListener('click', () => {
    const city = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = city !== 'all' && card.dataset.city !== city; });
  }));
});

const booking = document.querySelector('[data-booking]');
if (booking) {
  const review = document.querySelector('[data-review]');
  const reviewDetails = review.querySelector('[data-review-details]');
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  booking.elements.datum.min = localDate;

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
      ['Datum och tid', `${fields.get('datum')} · ${fields.get('tid')}`],
      ['Resenärer', fields.get('resenarer')], ['Stora väskor', fields.get('vaskor')],
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
    document.querySelector('.booking-summary').hidden = true;
    review.hidden = false;
    review.focus();
  });

  booking.elements.adress.addEventListener('input', () => booking.elements.adress.setCustomValidity(''));

  review.querySelector('[data-edit]').addEventListener('click', () => {
    review.hidden = true;
    booking.hidden = false;
    document.querySelector('.booking-summary').hidden = false;
    (booking.elements.fran.disabled ? booking.elements.till : booking.elements.fran).focus();
  });
  booking.querySelector('button[type="submit"]').disabled = false;
}
