// Sukkur Client Quotation Generator
// All prices are starting rates in PKR for Sukkur local work.
// No external calls: quotes are saved in the browser's localStorage only.

const STORAGE_KEY = 'tb-sukkur-quotes-v1';
const PER_PAGE = 1500;

const PLANS = {
  landing: { label: 'Landing page', base: 8000, included: 1 },
  basic: { label: 'Basic website', base: 10000, included: 3 },
  full: { label: 'Full responsive website', base: 15000, included: 5 }
};

const form = document.getElementById('quote-form');
const clientNameInput = document.getElementById('client-name');
const businessTypeInput = document.getElementById('business-type');
const websiteTypeInput = document.getElementById('website-type');
const pagesInput = document.getElementById('pages');
const quoteClient = document.getElementById('quote-client');
const quoteDate = document.getElementById('quote-date');
const breakdownList = document.getElementById('breakdown-list');
const totalAmount = document.getElementById('total-amount');
const copyQuoteBtn = document.getElementById('copy-quote');
const whatsappShare = document.getElementById('whatsapp-share');
const copyStatus = document.getElementById('copy-status');
const saveQuoteBtn = document.getElementById('save-quote');
const resetFormBtn = document.getElementById('reset-form');
const savedSummary = document.getElementById('saved-summary');
const savedList = document.getElementById('saved-list');
const clearSavedBtn = document.getElementById('clear-saved');

let currentQuote = null;

function formatPKR(amount) {
  return 'Rs. ' + amount.toLocaleString('en-PK');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function todayText() {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function readForm() {
  const client = clientNameInput.value.trim() || 'Unnamed client';
  const businessType = businessTypeInput.value;
  const websiteType = websiteTypeInput.value;
  const plan = PLANS[websiteType];
  let pages = parseInt(pagesInput.value, 10);
  if (!Number.isFinite(pages) || pages < 1) pages = 1;
  if (pages > 20) pages = 20;

  const extras = [];
  document.querySelectorAll('.extra-check:checked').forEach(function (box) {
    extras.push({
      label: box.getAttribute('data-label'),
      price: parseInt(box.getAttribute('data-price'), 10) || 0
    });
  });

  const extraPages = Math.max(0, pages - plan.included);
  const extraPagesCost = extraPages * PER_PAGE;
  const extrasCost = extras.reduce(function (sum, item) { return sum + item.price; }, 0);
  const total = plan.base + extraPagesCost + extrasCost;

  return {
    client: client,
    businessType: businessType,
    websiteType: websiteType,
    planLabel: plan.label,
    base: plan.base,
    included: plan.included,
    pages: pages,
    extraPages: extraPages,
    extraPagesCost: extraPagesCost,
    extras: extras,
    extrasCost: extrasCost,
    total: total,
    date: todayText()
  };
}

function buildQuoteText(quote) {
  const lines = [];
  lines.push('Quotation — ' + quote.client + ' (' + quote.businessType + ')');
  lines.push('Website: ' + quote.planLabel + ' — ' + formatPKR(quote.base) + ' (' + quote.included + ' pages included)');
  lines.push('Pages: ' + quote.pages + ' in total');
  if (quote.extraPages > 0) {
    lines.push('Extra pages: ' + quote.extraPages + ' x Rs. 1,500 = ' + formatPKR(quote.extraPagesCost));
  }
  quote.extras.forEach(function (item) {
    lines.push(item.label + ': ' + formatPKR(item.price));
  });
  lines.push('Total: ' + formatPKR(quote.total));
  lines.push('Date: ' + quote.date);
  lines.push('Prices are a starting quotation for local work in Sukkur. Domain and hosting are not included unless agreed separately.');
  return lines.join('\n');
}

function renderQuote() {
  const quote = readForm();
  currentQuote = quote;

  quoteClient.textContent = quote.client + ' — ' + quote.businessType;
  quoteDate.textContent = 'Quotation date: ' + quote.date + '  •  Valid for 7 days';

  const rows = [];
  rows.push('<li><span>' + escapeHtml(quote.planLabel) + ' (base, ' + quote.included + ' pages included)</span><span>' + formatPKR(quote.base) + '</span></li>');
  if (quote.extraPages > 0) {
    rows.push('<li><span>Extra pages: ' + quote.extraPages + ' &times; Rs. 1,500</span><span>' + formatPKR(quote.extraPagesCost) + '</span></li>');
  } else {
    rows.push('<li><span>Pages: ' + quote.pages + ' (within included pages)</span><span>Rs. 0</span></li>');
  }
  quote.extras.forEach(function (item) {
    rows.push('<li><span>' + escapeHtml(item.label) + '</span><span>' + formatPKR(item.price) + '</span></li>');
  });
  breakdownList.innerHTML = rows.join('');
  totalAmount.textContent = formatPKR(quote.total);

  const text = buildQuoteText(quote);
  whatsappShare.href = 'https://wa.me/?text=' + encodeURIComponent(text);
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function storeSaved(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    // Storage may be unavailable in some browsers; the live quote still works.
  }
}

function renderSaved() {
  const saved = loadSaved();
  savedSummary.textContent = saved.length === 0
    ? 'No quotations saved yet.'
    : saved.length + ' saved quotation' + (saved.length === 1 ? '' : 's') + ' — newest first.';

  if (saved.length === 0) {
    savedList.innerHTML = '<p class="empty-note">Save a quotation above and it will appear here.</p>';
    return;
  }

  savedList.innerHTML = saved.map(function (item, index) {
    return '<div class="saved-card">' +
      '<p class="saved-name">' + escapeHtml(item.client) + '</p>' +
      '<p class="saved-meta">' + escapeHtml(item.businessType) + ' &middot; ' + escapeHtml(item.planLabel) + ' &middot; ' + item.pages + ' pages</p>' +
      '<p class="saved-meta">' + escapeHtml(item.date) + '</p>' +
      '<p class="saved-total">' + formatPKR(item.total) + '</p>' +
      '<div class="saved-actions">' +
      '<button type="button" class="btn btn-secondary btn-small" data-load="' + index + '">Load</button>' +
      '<button type="button" class="btn btn-secondary btn-small" data-delete="' + index + '">Delete</button>' +
      '</div></div>';
  }).join('');
}

function applyQuoteToForm(quote) {
  clientNameInput.value = quote.client === 'Unnamed client' ? '' : quote.client;
  businessTypeInput.value = quote.businessType;
  websiteTypeInput.value = quote.websiteType;
  pagesInput.value = quote.pages;
  document.querySelectorAll('.extra-check').forEach(function (box) {
    const wanted = quote.extras.some(function (item) { return item.label === box.getAttribute('data-label'); });
    box.checked = wanted;
  });
  renderQuote();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  renderQuote();
});

[clientNameInput, businessTypeInput, websiteTypeInput, pagesInput].forEach(function (el) {
  el.addEventListener('input', renderQuote);
  el.addEventListener('change', renderQuote);
});
document.querySelectorAll('.extra-check').forEach(function (box) {
  box.addEventListener('change', renderQuote);
});

saveQuoteBtn.addEventListener('click', function () {
  renderQuote();
  const saved = loadSaved();
  saved.unshift(currentQuote);
  storeSaved(saved);
  renderSaved();
  copyStatus.textContent = 'Quotation saved for ' + currentQuote.client + '.';
});

resetFormBtn.addEventListener('click', function () {
  clientNameInput.value = 'Demo Public School';
  businessTypeInput.value = 'School';
  websiteTypeInput.value = 'full';
  pagesInput.value = 5;
  document.querySelectorAll('.extra-check').forEach(function (box) {
    box.checked = box.value === 'mobile' || box.value === 'whatsapp';
  });
  copyStatus.textContent = '';
  renderQuote();
});

copyQuoteBtn.addEventListener('click', function () {
  renderQuote();
  const text = buildQuoteText(currentQuote);
  function done() {
    copyStatus.textContent = 'Quotation copied. Paste it anywhere to send it.';
  }
  function fallback() {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      done();
    } catch (err) {
      copyStatus.textContent = 'Copy did not work in this browser — select the quotation text manually.';
    }
    document.body.removeChild(area);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
});

savedList.addEventListener('click', function (event) {
  const loadBtn = event.target.closest('[data-load]');
  const deleteBtn = event.target.closest('[data-delete]');
  const saved = loadSaved();
  if (loadBtn) {
    const item = saved[parseInt(loadBtn.getAttribute('data-load'), 10)];
    if (item) applyQuoteToForm(item);
    return;
  }
  if (deleteBtn) {
    const index = parseInt(deleteBtn.getAttribute('data-delete'), 10);
    saved.splice(index, 1);
    storeSaved(saved);
    renderSaved();
  }
});

clearSavedBtn.addEventListener('click', function () {
  storeSaved([]);
  renderSaved();
  copyStatus.textContent = '';
});

renderQuote();
renderSaved();
