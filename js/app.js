// Bodegón Parque · demo — JS propio de la web (el kit maneja datos, carrito, reservas y panel).
import { initKit } from '../kit/kit.js?v=1';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const desk = matchMedia('(min-width: 900px)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = (ms) => new Promise(r => setTimeout(r, ms));
const TZ = 'America/Argentina/Buenos_Aires';
let K = null; // contexto del kit
const DATA = { cats: [], prods: [] };
const prod = (id) => DATA.prods.find(p => p.id === id);
const mini = (src) => /-800\.webp$/.test(src || '') ? src.replace('-800.', '-240.') : src;
const precioTxt = (p) => p && p.precio != null ? K.money(p.precio) : 'A confirmar';

// ---------- fechas en Buenos Aires
function ahoraBA() {
  const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
    .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { fecha: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), dow };
}
function sumarDias(fecha, n) { const d = new Date(fecha + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const ddmm = (f) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
function proximoDia(dows, hastaMin) { // primer día (hoy incluido si todavía llega) cuyo dow está en dows
  const a = ahoraBA();
  for (let i = 0; i < 14; i++) { const dow = (a.dow + i) % 7; if (dows.includes(dow) && (i > 0 || a.min < hastaMin)) return sumarDias(a.fecha, i); }
  return a.fecha;
}

// =====================================================================
// INTRO: la pelota entra, se arma el escudo y se abre la pizarra
// =====================================================================
async function intro() {
  const el = $('#intro');
  if (!html.classList.contains('con-intro') || !el) { html.classList.add('listo'); return; }
  const corto = !desk.matches;
  const t = corto ? [30, 470, 940, 520] : [60, 700, 1360, 600];
  const inicio = performance.now();
  const heroImg = $('.polaroid--fachada img');
  const listos = Promise.all([
    document.fonts ? document.fonts.ready.catch(() => {}) : null,
    heroImg && !heroImg.complete ? new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : null,
  ]);
  await espera(t[0]); el.classList.add('p1');
  await espera(t[1] - t[0]); el.classList.add('p2');
  await espera(t[2] - t[1]);
  await Promise.race([listos, espera(Math.max(0, 2500 - (performance.now() - inicio)))]);
  // el escudo vuela a su lugar en la barra (es el mismo escudo: no se vuelve a dibujar)
  const esc0 = $('.intro__escudo', el); const dest = $('[data-logo-barra]');
  if (esc0 && dest) {
    const a = esc0.getBoundingClientRect(); const b = dest.getBoundingClientRect();
    el.style.setProperty('--vx', `${b.left - a.left}px`); el.style.setProperty('--vy', `${b.top - a.top}px`); el.style.setProperty('--vs', (b.width / a.width).toFixed(4));
  }
  el.classList.add('p3');
  await espera(240); html.classList.add('listo');
  await espera(t[3] - 240); el.classList.add('p4');
  await espera(corto ? 380 : 420);
  html.classList.remove('con-intro'); el.classList.add('fin');
}

// =====================================================================
// BARRA, MENÚ, ENTRADAS Y ARRASTRE
// =====================================================================
function barra() {
  const b = $('#barra'); const hero = $('.hero');
  const pintar = () => { b.classList.toggle('solida', scrollY > Math.min(hero.offsetHeight - 140, innerHeight * .6)); html.classList.toggle('en-hero', scrollY < hero.offsetHeight * .55); if (scrollY < hero.offsetHeight * .5) $$('.barra__nav a.activo').forEach(a => a.classList.remove('activo')); };
  addEventListener('scroll', () => requestAnimationFrame(pintar), { passive: true }); pintar();
  const menu = $('#menu'); const btn = $('[data-menu]');
  let y = 0;
  const abrir = (si) => {
    if (si) { y = scrollY; document.body.style.cssText = `position:fixed;top:-${y}px;left:0;right:0`; menu.hidden = false; }
    else { document.body.style.cssText = ''; menu.hidden = true; scrollTo({ top: y, behavior: 'instant' }); }
    html.classList.toggle('menu-abierto', si); btn.setAttribute('aria-expanded', si); btn.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
  };
  btn.addEventListener('click', () => abrir(menu.hidden));
  menu.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault(); abrir(false); setTimeout(() => $(a.getAttribute('href'))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 30); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrir(false); });
  const ancho = matchMedia('(min-width: 1100px)'); ancho.addEventListener('change', () => { if (ancho.matches && !menu.hidden) abrir(false); });
  const links = $$('.barra__nav a');
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  // los links internos que abren algo del kit no navegan
  $$('[data-kit-open][role="link"]').forEach(x => x.addEventListener('click', (e) => e.stopPropagation()));
}

function entradas(root = document) {
  const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .seccion .titulo, .descubre:not(.hero .descubre), [data-figus], [data-cancha]', root).forEach(el => { if (!el.classList.contains('visto')) io.observe(el); });
  const vis = new IntersectionObserver((es) => es.forEach(en => en.target.classList.toggle('fuera', !en.isIntersecting)));
  $$('.marquesina').forEach(el => vis.observe(el));
  const ifr = $('iframe[data-src]');
  if (ifr) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { ifr.src = ifr.dataset.src; o.disconnect(); } }, { rootMargin: '500px' }).observe(ifr);
}

// arrastrar con el mouse las filas deslizables (con el dedo ya se deslizan solas)
function arrastrable(fila) {
  if (fila.dataset.arrastreOk) return; fila.dataset.arrastreOk = '1';
  let x0 = 0, s0 = 0, activo = false, movio = false, v = 0, ult = 0, tUlt = 0, raf = 0;
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button > 0 || fila.scrollWidth <= fila.clientWidth + 2) return;
    if (e.target.closest('button, a, input, .kit-step')) return;
    activo = true; movio = false; x0 = e.clientX; s0 = fila.scrollLeft; ult = e.clientX; tUlt = performance.now(); v = 0; cancelAnimationFrame(raf);
    fila.style.scrollSnapType = 'none'; fila.style.scrollBehavior = 'auto'; fila.classList.add('agarrando'); e.preventDefault();
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) movio = true;
    fila.scrollLeft = s0 - dx; const ahora = performance.now(); v = (e.clientX - ult) / Math.max(1, ahora - tUlt); ult = e.clientX; tUlt = ahora;
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false; fila.classList.remove('agarrando');
    // inercia suave al soltar
    let vel = -v * 16;
    const paso = () => { if (Math.abs(vel) < .5) { fila.style.scrollSnapType = ''; fila.style.scrollBehavior = ''; return; } fila.scrollLeft += vel; vel *= .92; raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
  });
  fila.addEventListener('click', (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
}
function arrastre() { $$('[data-arrastre]').forEach(arrastrable); }

// =====================================================================
// HORARIOS, ESTADO Y MARCADOR
// =====================================================================
// 24 h y siempre con minutos: "8:00 a 24:00"; la medianoche al cierre se lee "24:00"
const hora = (h, cierre = false) => (h === '00:00' && cierre) ? '24:00' : h.replace(/^0([1-9]):/, '$1:');
function horarios() {
  const H = K.config.horarios;
  const dias = [['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo'], ['lun', 'Lunes']];
  const hoy = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][ahoraBA().dow];
  $('[data-horarios]').innerHTML = dias.map(([k, n]) => `<li class="${k === hoy ? 'hoy' : ''}"><span>${n}${k === hoy ? ' · hoy' : ''}</span><span>${(H[k] || []).length ? H[k].map(([d, c]) => `${hora(d)} a ${hora(c, true)}`).join(' · ') : 'Cerrado'}</span></li>`).join('');
  const est = $('[data-estado]'); const dEst = $('[data-donde-estado]');
  const pintar = () => {
    const s = K.abierto();
    const txt = s.abierto ? `Abierto ahora · cierra a las ${hora(s.cierra, true)}` : s.abre ? `Cerrado ahora · abre a las ${hora(s.abre)}` : 'Cerrado hoy';
    est.hidden = false; est.classList.toggle('cerrado', !s.abierto); est.textContent = txt;
    dEst.classList.toggle('cerrado', !s.abierto); dEst.textContent = txt;
  };
  pintar(); setInterval(pintar, 60_000);
}

// =====================================================================
// LA CARTA: pestañas / índice + una sección por vez + foto del plato
// =====================================================================
const OCULTAS = ['ejecutivo', 'shows'];
const CARTA = { cat: null };
const catsCarta = () => DATA.cats.filter(c => !OCULTAS.includes(c.id) && DATA.prods.some(p => p.categoria === c.id));

function pintarCarta({ animar = true } = {}) {
  const cuerpo = $('[data-carta-cuerpo]'); const cats = catsCarta();
  if (!cats.length) { cuerpo.innerHTML = '<p class="carta__cargando">La carta se está actualizando.</p>'; return; }
  if (!cats.some(c => c.id === CARTA.cat)) CARTA.cat = cats[0].id;
  const cat = cats.find(c => c.id === CARTA.cat); const i = cats.indexOf(cat);
  const items = DATA.prods.filter(p => p.categoria === cat.id);
  const primeraFoto = items.find(p => p.foto) || DATA.prods.find(p => p.foto && cats.some(c => c.id === p.categoria));
  cuerpo.innerHTML = `
    <div class="indice">
      <span class="indice__k" ${desk.matches ? '' : 'hidden'}>SECCIONES</span>
      <div class="indice__lista" role="tablist" aria-label="Secciones de la carta">${cats.map(c => `<button type="button" role="tab" class="indice__b" aria-selected="${c.id === cat.id}" data-cat="${esc(c.id)}"><span>${esc(c.nombre)}</span><small>${DATA.prods.filter(p => p.categoria === c.id).length}</small></button>`).join('')}</div>
    </div>
    <div class="seccion-carta" role="tabpanel" aria-label="${esc(cat.nombre)}">
      <div class="seccion-carta__cab"><h3 class="seccion-carta__t">${esc(cat.nombre)}</h3><span class="seccion-carta__n">${items.length} ${items.length === 1 ? 'opción' : 'opciones'} · para llevar</span></div>
      <p class="seccion-carta__nota">${esc(cat.nota || '')}</p>
      <ul class="platos">${items.map((p, k) => `
        <li class="plato${p.foto ? ' plato--foto' : ''}${p.disponible === false ? ' is-off' : ''}" data-id="${esc(p.id)}" ${p.foto ? `data-foto="${esc(K.asset(p.foto))}"` : ''} style="--i:${animar ? k : 0}">
          ${p.foto ? `<img class="plato__mini" src="${esc(K.asset(mini(p.foto)))}" alt="" width="64" height="64" loading="lazy" decoding="async">` : ''}
          <p class="plato__nom">${esc(p.nombre)}${(p.etiquetas || []).includes('casa') ? '<span class="plato__casa">De la casa</span>' : ''}</p>
          ${p.descripcion ? `<p class="plato__desc">${esc(p.descripcion)}</p>` : ''}
          <span class="plato__precio">${p.disponible === false ? 'Sin stock hoy' : esc(precioTxt(p))}</span>
          ${p.disponible === false ? '' : `<div class="plato__add" data-kit-qty="${esc(p.id)}"></div>`}
        </li>`).join('')}</ul>
      <div class="seccion-carta__nav">
        <button type="button" data-mover="-1" ${i <= 0 ? 'disabled' : ''}>← ${esc(cats[i - 1]?.nombre || '')}</button>
        <button type="button" data-mover="1" ${i >= cats.length - 1 ? 'disabled' : ''}>${esc(cats[i + 1]?.nombre || '')} →</button>
      </div>
    </div>
    <figure class="foto-plato" aria-hidden="true"><div class="foto-plato__box">${primeraFoto ? `<img src="${esc(K.asset(primeraFoto.foto))}" alt=""><span class="foto-plato__chip">${esc(primeraFoto.nombre)}</span>` : ''}</div><figcaption>Pasá el mouse por los platos con punto dorado para ver la foto.</figcaption></figure>`;
  K.carrito?.sync(cuerpo);
  const on = $('.indice__b[aria-selected="true"]', cuerpo);
  if (on && !desk.matches) { const l = $('.indice__lista', cuerpo); l.scrollLeft = on.offsetLeft - 22; }
}
function fotoPlato(li) {
  const box = $('.foto-plato__box'); if (!box || !li?.dataset.foto) return;
  $$('.plato.activo').forEach(x => x.classList.remove('activo')); li.classList.add('activo');
  const actual = $('img:not(.sale)', box); if (actual && actual.getAttribute('src') === li.dataset.foto) return;
  const img = new Image(); img.alt = ''; img.src = li.dataset.foto; img.className = 'sale'; box.prepend(img);
  const chip = $('.foto-plato__chip', box) || box.appendChild(Object.assign(document.createElement('span'), { className: 'foto-plato__chip' }));
  chip.textContent = $('.plato__nom', li).firstChild.textContent;
  const mostrar = () => requestAnimationFrame(() => { img.classList.remove('sale'); if (actual) { actual.classList.add('sale'); setTimeout(() => actual.remove(), 400); } });
  if (img.complete) mostrar(); else img.onload = mostrar;
}
function volverArribaCarta() {
  const c = $('[data-carta-cuerpo]'); const top = c.getBoundingClientRect().top + scrollY - (desk.matches ? 110 : 70);
  if (scrollY > top + 10) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}
function carta() {
  const sec = $('#carta');
  sec.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (c) { CARTA.cat = c.dataset.cat; pintarCarta(); if (!desk.matches) volverArribaCarta(); return; }
    const mv = e.target.closest('[data-mover]');
    if (mv) { const cats = catsCarta(); const i = cats.findIndex(x => x.id === CARTA.cat) + Number(mv.dataset.mover); if (cats[i]) { CARTA.cat = cats[i].id; pintarCarta(); volverArribaCarta(); } }
  });
  let raf;
  sec.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const li = e.target.closest('.plato--foto'); if (!li) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fotoPlato(li)); });
  desk.addEventListener('change', () => pintarCarta({ animar: false }));
}

// =====================================================================
// FIGURITAS: se dan vuelta con un toque o un clic
// =====================================================================
function figus() {
  $('[data-figus]').addEventListener('click', (e) => {
    const b = e.target.closest('.figu__btn'); if (!b || b.hasAttribute('data-kit-open')) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
}

// =====================================================================
// LA FORMACIÓN DE LA CASA (4-3-3)
// =====================================================================
const TITULARES = [
  { id: 'pastel-papa', n: 1, pos: 'Arquero', d: [8, 50] },
  { id: 'burrata', n: 4, pos: 'Lateral', d: [25, 15] }, { id: 'rabas', n: 2, pos: 'Defensor central', d: [24, 39] },
  { id: 'tortilla', n: 6, pos: 'Defensor central', d: [24, 61] }, { id: 'bunuelos', n: 3, pos: 'Lateral', d: [25, 85] },
  { id: 'noquis-hongos', n: 8, pos: 'Volante', d: [50, 24] }, { id: 'mila-parque', n: 10, pos: 'Enganche', d: [47, 50] }, { id: 'lomito', n: 5, pos: 'Volante', d: [50, 76] },
  { id: 'napolitana', n: 7, pos: 'Wing', d: [75, 17] }, { id: 'carne-horno', n: 9, pos: 'Centrodelantero', d: [79, 50] }, { id: 'muzza', n: 11, pos: 'Wing', d: [75, 83] },
];
const BANCO = ['flan', 'tiramisu', 'chocotorta', 'mousse'];
let elegido = 'mila-parque';
function pintarFormacion() {
  const box = $('[data-fichas]');
  box.innerHTML = TITULARES.map((t, i) => {
    const p = prod(t.id); if (!p) return '';
    const [dx, dy] = t.d; const mx = dy, my = 100 - dx + (dx < 15 ? -2 : 0);
    return `<button type="button" class="ficha${t.id === elegido ? ' activa' : ''}" data-ficha="${esc(t.id)}" style="--dx:${dx}%;--dy:${dy}%;--mx:${mx}%;--my:${my}%;--i:${i};background-image:url('${esc(K.asset(mini(p.foto)))}')" aria-label="${t.n}, ${esc(t.pos)}: ${esc(p.nombre)}"><span class="ficha__n">${t.n}</span><span class="ficha__nom">${esc(p.nombre)}</span></button>`;
  }).join('');
  $('[data-banco]').innerHTML = BANCO.map(id => { const p = prod(id); return p ? `<button type="button" class="suplente${id === elegido ? ' activa' : ''}" data-ficha="${esc(id)}"><img src="${esc(K.asset(mini(p.foto)))}" alt="" width="44" height="44" loading="lazy">${esc(p.nombre)}</button>` : ''; }).join('');
  mostrarFicha(elegido, { sinFade: true });
}
function mostrarFicha(id, { sinFade = false } = {}) {
  const p = prod(id); if (!p) return; elegido = id;
  const t = TITULARES.find(x => x.id === id);
  const card = $('[data-ficha-plato]'); const img = $('img', card);
  $$('[data-ficha]').forEach(b => b.classList.toggle('activa', b.dataset.ficha === id));
  $('.ficha-plato__num', card).textContent = t ? t.n : 'S';
  $('.ficha-plato__pos', card).textContent = t ? t.pos : 'Suplente · postre';
  $('.ficha-plato__nom', card).textContent = p.nombre;
  $('.ficha-plato__desc', card).textContent = p.descripcion || '';
  $('.ficha-plato__precio', card).textContent = precioTxt(p);
  const add = $('.ficha-plato__add', card); add.dataset.kitQty = p.id; K.carrito?.sync(card);
  const src = K.asset(p.foto);
  if (img.getAttribute('src') !== src) {
    if (sinFade || reduce) { img.src = src; return; }
    img.classList.add('cambia');
    const n = new Image(); n.src = src;
    const poner = () => { img.src = src; requestAnimationFrame(() => img.classList.remove('cambia')); };
    setTimeout(() => { if (n.complete) poner(); else n.onload = poner; }, 180);
  }
}
function formacion() {
  const sec = $('#formacion');
  sec.addEventListener('click', (e) => { const b = e.target.closest('[data-ficha]'); if (b) mostrarFicha(b.dataset.ficha); });
  let raf;
  sec.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const b = e.target.closest('.ficha'); if (!b) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => mostrarFicha(b.dataset.ficha)); });
}

// =====================================================================
// MENÚ EJECUTIVO (sección "ejecutivo" de la carta, editable en /admin)
// =====================================================================
function pintarEjecutivo() {
  const a = ahoraBA(); const dias = [[2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie']];
  $('[data-dias]').innerHTML = dias.map(([d, n]) => `<span class="dia${d === a.dow ? ' hoy' : ''}">${n}${d === a.dow ? ' · hoy' : ''}</span>`).join('');
  const items = DATA.prods.filter(p => p.categoria === 'ejecutivo' && p.disponible !== false);
  $('[data-ejecutivo]').innerHTML = items.map(p => `<li><span>${esc(p.nombre)}</span><div data-kit-qty="${esc(p.id)}"></div></li>`).join('');
  const conPrecio = items.find(p => p.precio != null);
  $('[data-ej-precio]').textContent = conPrecio ? K.money(conPrecio.precio) : 'A confirmar';
  K.carrito?.sync($('#ejecutivo'));
}

// =====================================================================
// CENA SHOW: la entrada con talón que se corta
// =====================================================================
let showFecha = null;
function pintarShow() {
  const sec = $('#show');
  const s = DATA.prods.find(p => p.categoria === 'shows' && p.disponible !== false);
  sec.hidden = !s;
  $$('a[href="#show"]').forEach(a => { a.hidden = !s; });
  if (!s) return;
  showFecha = proximoDia([6], 21 * 60 + 30);
  $('[data-show-artista]').textContent = s.nombre;
  $('[data-show-fecha]').textContent = `Sábado ${ddmm(showFecha)} · 21:30`;
}
function reservarShow() { K.reservas?.abrir({ fecha: showFecha || proximoDia([6], 1290), hora: '21:30', personas: 2 }); }
function show() {
  $('[data-reservar-show]').addEventListener('click', reservarShow);
  // el talón se corta tirando hacia abajo: gira desde la línea punteada y cae (un toque o Enter también lo corta)
  const talon = $('[data-talon]');
  let y0 = 0, dy = 0, activo = false, id = null, cortando = false;
  const volver = () => { talon.classList.remove('arrastrando'); talon.style.transform = ''; };
  const cortar = () => {
    if (cortando) return; cortando = true; talon.classList.remove('arrastrando'); talon.style.transform = '';
    void talon.offsetWidth; talon.classList.add('cortado');
    setTimeout(reservarShow, reduce ? 0 : 380);
    setTimeout(() => { talon.classList.remove('cortado'); talon.classList.add('vuelve'); setTimeout(() => talon.classList.remove('vuelve'), 500); cortando = false; }, 1600);
  };
  talon.addEventListener('pointerdown', (e) => { if (e.button > 0 || cortando) return; activo = true; id = e.pointerId; y0 = e.clientY; dy = 0; try { talon.setPointerCapture(id); } catch (_) { /* nada */ } });
  talon.addEventListener('pointermove', (e) => {
    if (!activo || e.pointerId !== id) return; dy = Math.max(0, Math.min(40, e.clientY - y0));
    if (dy > 2) { talon.classList.add('arrastrando'); talon.style.transform = `rotate(${dy * .35}deg)`; }
  });
  talon.addEventListener('pointerup', () => { if (!activo) return; activo = false; if (dy > 22 || dy <= 2) cortar(); else volver(); });
  talon.addEventListener('pointercancel', () => { activo = false; volver(); });
  talon.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cortar(); } });
  $('[data-reservar-mediodia]').addEventListener('click', () => K.reservas?.abrir({ fecha: proximoDia([2, 3, 4, 5], 14 * 60), hora: '12:30', personas: 2 }));
}

// confirmación de la reserva con forma de entrada
function reservaLista(e) {
  e.preventDefault();
  const { resumen, reserva, el } = e.detail;
  const esShow = /show/i.test(resumen.servicio || '') || reserva.servicio === 'show';
  const artista = esShow ? (DATA.prods.find(p => p.categoria === 'shows' && p.disponible !== false)?.nombre || 'Cena show') : 'Bodegón Parque';
  const [y, m, d] = reserva.fecha.split('-'); const [hh, mm] = String(reserva.hora).split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const fin = hh * 60 + mm + 120;
  const cal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(esShow ? `Cena show en Bodegón Parque · ${artista}` : 'Mesa en Bodegón Parque')}&dates=${y}${m}${d}T${pad(hh % 24)}${pad(mm)}00/${y}${m}${d}T${pad(Math.floor(fin / 60) % 24)}${pad(fin % 60)}00&ctz=${encodeURIComponent(TZ)}&location=${encodeURIComponent('Marcos Sastre 3258, Villa del Parque, CABA')}`;
  const wa = `https://wa.me/${K.config.whatsapp}?text=${encodeURIComponent(`¡Hola Bodegón Parque! Pedí una mesa para ${resumen.personas} el ${resumen.dia} a las ${resumen.hora}${resumen.servicio ? ` (${resumen.servicio})` : ''}. A nombre de ${resumen.nombre}.`)}`;
  const n = parseInt(resumen.personas, 10) || '';
  el.innerHTML = `<div class="entrada-ok" role="status">
    <div class="entrada papel-bordo">
      <div class="entrada__cuerpo"><span class="entrada__k">${esShow ? 'Entrada · Cena show' : 'Mesa pedida'}</span><b class="entrada__artista">${esc(artista)}</b><span class="entrada__fecha">${esc(resumen.dia)} · ${esc(resumen.hora)}</span><span class="entrada__lugar">A nombre de ${esc(resumen.nombre)}</span></div>
      <div class="entrada__talon"><span class="entrada__talon-k">Mesa</span><b>${esc(n)}</b><span>personas</span></div>
    </div>
    <p class="entrada-ok__nota">¡Golazo! Te confirmamos por WhatsApp. La mesa se guarda 15 minutos.</p>
    <div class="entrada-ok__acc"><a class="btn btn--bordo" href="${esc(wa)}" target="_blank" rel="noopener">Avisar por WhatsApp</a><a class="btn btn--linea" href="${esc(cal)}" target="_blank" rel="noopener">Agendar</a></div>
  </div>`;
}

// =====================================================================
// PARA LLEVAR
// =====================================================================
const LLEVAR = ['mila-parque', 'carne-horno', 'rabas'];
function pintarLlevar() {
  $('[data-llevar]').innerHTML = LLEVAR.map(id => { const p = prod(id); if (!p) return ''; return `<li class="llevar-card">
    <img src="${esc(K.asset(p.foto))}" alt="${esc(p.nombre)}" width="800" height="600" loading="lazy" decoding="async">
    <div class="llevar-card__txt"><h3 class="llevar-card__nom">${esc(p.nombre)}</h3><p class="llevar-card__desc">${esc(p.descripcion || '')}</p>
    <div class="llevar-card__acc"><span class="llevar-card__precio">${esc(precioTxt(p))}</span><div data-kit-qty="${esc(p.id)}"></div></div></div></li>`; }).join('');
  K.carrito?.sync($('#llevar'));
}

// =====================================================================
// GALERÍA: mazo en el celu, fila de fotos sueltas para arrastrar en desktop
// =====================================================================
function crearMazo(cont, cartas) {
  let orden = cartas.slice();
  const giro = cartas.map((_, i) => [-4, 3.5, -2, 4.5, -3][i % 5]);
  function pintar() {
    orden.forEach((c, k) => { c.classList.toggle('arriba', k === 0); c.style.zIndex = String(200 - k); const r = k === 0 ? 0 : giro[cartas.indexOf(c)]; c.style.transform = `translate(${Math.min(k, 2) * 5}px, ${Math.min(k, 2) * 9}px) rotate(${r}deg)`; c.style.opacity = k < 3 ? '1' : '0'; });
  }
  function siguiente(dir = 1) {
    const top = orden[0]; top.classList.add('vuela'); top.style.transform = `translate(${dir * 120}%, -20px) rotate(${dir * 18}deg)`;
    setTimeout(() => { top.classList.remove('vuela'); orden.push(orden.shift()); pintar(); }, reduce ? 0 : 320);
  }
  let x0 = 0, y0 = 0, dx = 0, activa = null, movio = false, id = null;
  const down = (e) => { if (desk.matches) return; const c = e.target.closest('.arriba'); if (!c) return; activa = c; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; movio = false; };
  const move = (e) => {
    if (!activa || e.pointerId !== id) return; dx = e.clientX - x0; const dy = e.clientY - y0;
    if (!movio && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { movio = true; activa.classList.add('arrastrando'); try { cont.setPointerCapture(id); } catch (_) { /* nada */ } }
    if (movio) activa.style.transform = `translate(${dx}px, ${Math.abs(dx) * .05}px) rotate(${dx * .06}deg)`;
  };
  const up = () => { if (!activa) return; const c = activa; activa = null; c.classList.remove('arrastrando'); if (movio && Math.abs(dx) > 70) siguiente(dx > 0 ? 1 : -1); else if (movio) pintar(); else siguiente(1); };
  cont.addEventListener('pointerdown', down); cont.addEventListener('pointermove', move); cont.addEventListener('pointerup', up);
  cont.addEventListener('pointercancel', () => { if (activa) { activa.classList.remove('arrastrando'); activa = null; pintar(); } });
  pintar();
  return { destruir() { cont.removeEventListener('pointerdown', down); cont.removeEventListener('pointermove', move); cont.removeEventListener('pointerup', up); cartas.forEach(c => { c.style.cssText = ''; c.classList.remove('arriba'); }); } };
}
function galeria() {
  const g = $('[data-galeria]'); const figs = $$('.g', g); let m = null;
  const armar = () => {
    if (desk.matches) { if (m) { m.destruir(); m = null; } arrastrable(g); return; }
    if (!m) m = crearMazo(g, figs);
  };
  armar(); desk.addEventListener('change', armar);
}

// =====================================================================
// ARRANQUE
// =====================================================================
function pintarTodo({ animar = true } = {}) {
  pintarCarta({ animar }); pintarFormacion(); pintarEjecutivo(); pintarShow(); pintarLlevar();
}
async function arrancar() {
  intro();
  barra(); entradas(); arrastre(); carta(); figus(); formacion(); show(); galeria();
  document.addEventListener('kit:carta', (e) => {
    DATA.prods = e.detail.productos; DATA.cats = e.detail.categorias;
    if (K) pintarTodo({ animar: false });
  });
  document.addEventListener('kit:reserva-lista', reservaLista);
  try {
    K = await initKit({
      config: 'cliente.json',
      carrito: { label: 'Para llevar', icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14l-1.5 12h-11z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>' },
      badge: true,
      imagenes: { lqip: 'img/lqip.json' },
    });
    if (!DATA.prods.length) { DATA.prods = await K.store.getProductos(); DATA.cats = await K.store.getCategorias(); }
    horarios(); pintarTodo();
  } catch (err) { console.error('[bodegon-parque] kit', err); }
}
arrancar();
