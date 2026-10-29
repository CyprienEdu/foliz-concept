// Demo only: nothing is sent or stored outside this browser.
const FLAVORS = [
  { id: 'aventurier', name: "L'Aventurier", taste: 'Ginger & lemon — intense, for after a hike or a big night', type: 'kombucha', c: '#f39a1e', sizes: [33, 75] },
  { id: 'passionne', name: 'Le Passionné', taste: 'Raspberry & rose — fruity, tangy, floral', type: 'kombucha', c: '#d4243f', sizes: [33, 75] },
  { id: 'gourmand', name: 'Le Gourmand', taste: 'Mango & turmeric — smooth, perfect with a hearty meal', type: 'kombucha', c: '#f26b3a', sizes: [33, 75] },
  { id: 'festif', name: 'Le Festif', taste: 'Lime & mint — an alcohol-free mojito for the terrace', type: 'kombucha', c: '#8dc63f', sizes: [33] },
  { id: 'voyageur', name: 'Le Voyageur', taste: 'Passion fruit & Madagascar vanilla — exotic, sweet and tangy', type: 'kombucha', c: '#86204d', sizes: [33, 75] },
  { id: 'sportif', name: 'Le Sportif', taste: 'Citrus & blue spirulina — daily energy for athletes', type: 'kombucha', c: '#3a9bb0', sizes: [33] },
  { id: 'ephemere', name: "L'Éphémère", taste: 'Seasonal recipe — this summer: maté & peach', type: 'kombucha', c: '#e0457b', sizes: [33], tag: 'Limited' },
  { id: 'ginger', name: 'Ginger Beer', taste: 'Ginger, Espelette pepper & lemon — a spicy kick', type: 'ginger', c: '#e38a2b', sizes: [33] },
  { id: 'ginger-houblon', name: 'Ginger Beer Houblon', taste: 'Ginger & hops — floral, bitter, very fresh', type: 'ginger', c: '#a5b82b', sizes: [33] },
];
// shortcut: Foliz publishes no prices, these are indicative for the demo
const PRICE = { 33: 3.2, 75: 6.5 };
const DEPOSIT = 0.5; // per 75 cl bottle, Consign'Up
const CODE = 'FOLIZ10';
const $ = (s, el = document) => el.querySelector(s);
const eur = n => '€' + n.toFixed(2);
const img = id => `img/${id}.webp`;
const byId = id => FLAVORS.find(f => f.id === id);

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200);
}
let store = {};
try { store = JSON.parse(sessionStorage.foliz || '{}'); } catch {}
const save = () => { try { sessionStorage.foliz = JSON.stringify(store); } catch {} };
store.cart ||= [];

/* ---------- shop ---------- */
function renderShop(filter = 'all') {
  const grid = $('#grid'); if (!grid) return;
  grid.innerHTML = FLAVORS.filter(f => filter === 'all' || f.type === filter).map(f => `
    <article class="card" style="--c:${f.c}">
      <div class="pic">${f.tag ? `<span class="tag">${f.tag}</span>` : ''}<img src="${img(f.id)}" alt="${f.name} bottle" loading="lazy"></div>
      <div class="body">
        <h3>${f.name}</h3>
        <p class="taste">${f.taste}</p>
        <div class="row">
          <div class="sizes" role="group" aria-label="Size">${f.sizes.map((s, i) => `<button type="button" data-size="${s}" aria-pressed="${i === 0}">${s} cl</button>`).join('')}</div>
          <span class="price">${eur(PRICE[f.sizes[0]])}</span>
        </div>
        <button class="btn small" data-add="${f.id}">Add to cart</button>
      </div>
    </article>`).join('');
}
document.addEventListener('click', e => {
  const size = e.target.closest('.sizes button');
  if (size) {
    size.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === size));
    size.closest('.card').querySelector('.price').textContent = eur(PRICE[size.dataset.size]);
  }
  const add = e.target.closest('[data-add]');
  if (add) {
    const s = +add.closest('.card').querySelector('.sizes [aria-pressed="true"]').dataset.size;
    addToCart(add.dataset.add, s);
  }
  const chip = e.target.closest('.chips button');
  if (chip) {
    chip.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === chip));
    renderShop(chip.dataset.filter);
  }
  const q = e.target.closest('[data-qty]');
  if (q) {
    const line = store.cart[+q.dataset.i];
    line.qty += +q.dataset.qty;
    if (line.qty < 1) store.cart.splice(+q.dataset.i, 1);
    save(); renderCart();
  }
  if (e.target.closest('[data-open-cart]')) openCart(true);
  if (e.target.closest('[data-close]') || e.target.matches('.veil')) { openCart(false); openModal(false); }
  if (e.target.closest('[data-open-nl]')) openModal(true);
});

function addToCart(id, size) {
  const line = store.cart.find(l => l.id === id && l.size === size);
  line ? line.qty++ : store.cart.push({ id, size, qty: 1 });
  save(); renderCart(); toast(`${byId(id).name} ${size} cl added`);
}
function renderCart() {
  const n = store.cart.reduce((a, l) => a + l.qty, 0);
  const count = $('#count'); if (count) count.textContent = n;
  const items = $('#items'); if (!items) return;
  items.innerHTML = n ? store.cart.map((l, i) => `
    <div class="line"><img src="${img(l.id)}" alt="">
      <div><b>${byId(l.id).name}</b><br><small>${l.size} cl · ${eur(PRICE[l.size])}</small></div>
      <div class="qty"><button data-qty="-1" data-i="${i}" aria-label="Remove one">−</button>${l.qty}<button data-qty="1" data-i="${i}" aria-label="Add one">+</button></div>
    </div>`).join('') : '<p class="note">Your cart is empty. Time for some bubbles.</p>';
  const sub = store.cart.reduce((a, l) => a + PRICE[l.size] * l.qty, 0);
  const dep = store.cart.reduce((a, l) => a + (l.size === 75 ? DEPOSIT * l.qty : 0), 0);
  const disc = store.code ? sub * 0.1 : 0;
  $('#totals').innerHTML = `
    <div class="sum"><span>Subtotal</span><span>${eur(sub)}</span></div>
    <div class="sum"><span>Consign'Up deposit (refunded)</span><span>${eur(dep)}</span></div>
    ${store.code ? `<div class="sum disc"><span>${CODE} −10%</span><span>−${eur(disc)}</span></div>` : '<div class="sum"><button class="link-btn" data-open-nl>Get −10% with our newsletter</button></div>'}
    <div class="sum total"><span>Total</span><span>${eur(sub + dep - disc)}</span></div>`;
}
function openCart(on) { $('#drawer')?.classList.toggle('on', on); $('.veil')?.classList.toggle('on', on || $('#modal')?.classList.contains('on')); }
function openModal(on) {
  const m = $('#modal'); if (!m) return;
  m.classList.toggle('on', on); $('.veil').classList.toggle('on', on || $('#drawer').classList.contains('on'));
  if (on) { store.nlSeen = true; save(); }
}
$('#checkout')?.addEventListener('click', () => {
  if (!store.cart.length) return toast('Add a bottle first');
  store.cart = []; save(); renderCart(); openCart(false);
  toast('Order confirmed (demo) — delivered by Le Fourgon');
});

/* ---------- newsletter (every form with .nl-form) ---------- */
document.addEventListener('submit', e => {
  const f = e.target; if (!f.matches('.nl-form')) return;
  e.preventDefault();
  store.code = true; store.email = f.email.value; save(); renderCart();
  f.outerHTML = f.dataset.done || `<p><b>Welcome to the Foliz crew!</b> Your code is applied to your cart:</p><span class="code">${CODE}</span>`;
});

/* ---------- Kombucha Match ---------- */
const QUESTIONS = [
  { q: 'Your perfect Saturday?', a: [['🥾', 'Hiking the Pyrenees', 'aventurier sportif'], ['🌇', 'Terrace with friends', 'festif passionne'], ['🍳', 'A long brunch', 'gourmand'], ['✈️', 'A last-minute flight', 'voyageur']] },
  { q: 'Pick a flavour mood', a: [['🌶️', 'Spicy & intense', 'aventurier'], ['🌹', 'Floral & fruity', 'passionne'], ['🥭', 'Sweet & smooth', 'gourmand voyageur'], ['🌿', 'Fresh & zesty', 'festif sportif']] },
  { q: 'When will you drink it?', a: [['🏃', 'After a run', 'sportif aventurier'], ['🥂', 'At the aperitif', 'festif passionne'], ['🍽️', 'After a big meal', 'gourmand'], ['📚', 'During exam week', 'voyageur sportif']] },
];
const WHY = {
  aventurier: 'You go all in. Ginger and lemon to keep up with you — and help digestion after the adventure.',
  passionne: 'Romantic but tangy. Raspberry and rose, for the ones who love intensely.',
  gourmand: 'You know how to enjoy life. Mango and turmeric, smooth and generous.',
  festif: 'The life of the party, without the hangover. Lime and mint, mojito style.',
  voyageur: 'Your head is already abroad. Passion fruit and Madagascar vanilla.',
  sportif: 'Always moving. Citrus and blue spirulina for daily energy.',
};
let score, step;
function quiz(start) {
  const box = $('#quiz'); if (!box) return;
  if (start) { score = {}; step = 0; }
  if (step < QUESTIONS.length) {
    const Q = QUESTIONS[step];
    box.innerHTML = `<span class="step">Question ${step + 1} / ${QUESTIONS.length}</span><h3>${Q.q}</h3>
      <div class="answers">${Q.a.map(([e, t, v]) => `<button data-v="${v}"><span>${e}</span>${t}</button>`).join('')}</div>`;
    box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      b.dataset.v.split(' ').forEach(k => score[k] = (score[k] || 0) + 1); step++; quiz();
    });
    return;
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0], f = byId(best);
  store.match = best; save();
  box.innerHTML = `<div class="result"><img src="${img(best)}" alt="${f.name}">
    <div><span class="step">Your Kombucha Match</span><h3 style="color:${f.c}">${f.name}</h3><p>${WHY[best]}</p>
    <p style="margin-top:14px"><b>Win a free bottle:</b> join the newsletter and show this screen at the Foliz Bike.</p>
    <form class="nl-form" data-done="<p style='margin-top:14px'><b>🎉 Free ${f.name} unlocked.</b> Show this screen to the Foliz Bike crew. You also get ${CODE} (−10%) online.</p>">
      <input aria-label="Email" type="email" name="email" required placeholder="you@student.fr"><button class="btn">Claim my drink</button></form>
    <button class="btn ghost small" style="margin-top:14px" id="again">Try again</button></div></div>`;
  $('#again').onclick = () => quiz(true);
}

/* ---------- store locator ---------- */
const STORES = [
  { n: 'Foliz Bike — today', a: 'Place du Capitole, Toulouse · 12:00–15:00 (demo)', ll: [43.6045, 1.4440], bike: true },
  { n: 'Foliz microbrewery', a: '2 chemin de Ronde, 32430 Cologne (Gers)', ll: [43.7226, 0.9740] },
  { n: 'Le Drive tout nu', a: '2 rue René Cornemont, 31400 Toulouse (Montaudran)', ll: [43.5737, 1.4868] },
  { n: 'Biocoop Saint-Michel', a: '11 Grande rue Saint-Michel, 31400 Toulouse', ll: [43.5871, 1.4459] },
  { n: 'La Taverne CBD', a: '16 rue Gilet, 31770 Colomiers', ll: [43.6118, 1.3352] },
];
function initMap() {
  const list = $('#store-list'); if (!list) return;
  list.innerHTML = STORES.map((s, i) => `<button class="store${s.bike ? ' bike' : ''}" data-s="${i}"><b>${s.bike ? '🚲 ' : ''}${s.n}</b><small>${s.a}</small></button>`).join('');
  if (!window.L) { $('#map').innerHTML = '<p class="note" style="padding:20px">Map unavailable offline — all points of sale are listed here.</p>'; return; }
  const map = L.map('map', { scrollWheelZoom: false }).setView([43.64, 1.25], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
  const pins = STORES.map(s => L.circleMarker(s.ll, { radius: s.bike ? 12 : 9, color: '#1d1a17', weight: 2, fillColor: s.bike ? '#8dc63f' : '#f39a1e', fillOpacity: 1 })
    .addTo(map).bindPopup(`<b>${s.n}</b><br>${s.a}<br><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${s.ll}">Directions</a>`));
  map.fitBounds(L.featureGroup(pins).getBounds().pad(0.15));
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    list.querySelectorAll('.store').forEach(x => x.classList.toggle('on', x === b));
    map.flyTo(STORES[b.dataset.s].ll, 14); pins[b.dataset.s].openPopup();
  });
}

renderShop(); renderCart(); quiz(true); initMap();
// newsletter pop-up once per session, a few seconds after landing on the home page
if ($('#modal') && !store.nlSeen && !store.code) setTimeout(() => !$('#drawer').classList.contains('on') && openModal(true), 5000);
document.addEventListener('keydown', e => e.key === 'Escape' && (openCart(false), openModal(false)));
