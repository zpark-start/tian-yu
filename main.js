const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* On narrow screens the tab row scrolls sideways; keep the current tab in view. */
const tabs = $('.tabs'), current = $('.tabs a.on');
if (tabs && current && tabs.scrollWidth > tabs.clientWidth) {
  tabs.scrollLeft = current.offsetLeft - (tabs.clientWidth - current.offsetWidth) / 2;
}

/* Photo strip (home page): drifts slowly, can be dragged or flung, click a photo to open it. */
const strip = $('#strip');
if (strip) {
  const track = $('.strip-track', strip);
  const originals = $$('img', track);
  originals.forEach(img => { const c = img.cloneNode(); c.alt = ''; c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  const drift = reduceMotion ? 0 : -0.35;
  let x = 0, v = drift, half = 0, dragging = false, startX = 0, startOff = 0, lastPX = 0, moved = 0;
  const size = () => { half = track.scrollWidth / 2; };
  addEventListener('load', size); addEventListener('resize', size); size();
  (function loop() {
    if (!dragging) { v += (drift - v) * 0.025; x += v; }
    if (half) { while (x <= -half) x += half; while (x > 0) x -= half; }
    track.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(loop);
  })();
  strip.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; startX = lastPX = e.clientX; startOff = x;
    strip.classList.add('dragging'); strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener('pointermove', e => {
    if (!dragging) return;
    v = e.clientX - lastPX; lastPX = e.clientX;
    x = startOff + (e.clientX - startX);
    moved = Math.max(moved, Math.abs(e.clientX - startX));
  });
  const end = e => {
    if (!dragging) return;
    dragging = false; strip.classList.remove('dragging');
    if (moved < 6) {
      const hit = $$('img', track).find(img => { const r = img.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right; });
      if (hit) openLightbox(hit.src, hit.alt);
    }
  };
  strip.addEventListener('pointerup', end);
  strip.addEventListener('pointercancel', end);
}

/* Lightbox for photos */
const lb = document.createElement('div');
lb.className = 'lightbox'; lb.hidden = true; lb.innerHTML = '<img alt="">';
document.body.appendChild(lb);
function openLightbox(src, alt) { const i = $('img', lb); i.src = src; i.alt = alt || ''; lb.hidden = false; }
$$('.photos img').forEach(img => img.addEventListener('click', () => openLightbox(img.src, img.alt)));
lb.addEventListener('click', () => { lb.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });
