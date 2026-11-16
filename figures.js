/* Animated figures for the research page. Ink + accent only; all schematic. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  // small seeded random so drawings look the same every time
  const rand = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const whenVisible = (node, on, off) => new IntersectionObserver(([e]) => (e.isIntersecting ? on : off)?.(), { threshold: .35 }).observe(node);

  /* ---------- Fig 1: EdU then BrdU ---------- */
  const fig1 = document.getElementById('fig1');
  if (fig1) {
    const g = fig1.querySelector('#cells'), ph = fig1.querySelector('#ph');
    const cE = fig1.querySelector('#cE'), cB = fig1.querySelector('#cB'), cBoth = fig1.querySelector('#cBoth');
    const R = rand(7), cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
      const x = 96 + c * 58 + (R() - .5) * 10, y = 100 + r * 64 + (R() - .5) * 10;
      const grp = el('g', { class: 'cell', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, g);
      el('circle', { class: 'ln-s', r: 16 }, grp);
      el('circle', { class: 'ln-a brdu', r: 16, 'stroke-width': 2.2 }, grp);
      el('circle', { class: 'ln-a ring2', r: 20.5, 'stroke-width': 1 }, grp);
      el('circle', { class: 'fill-i edu', r: 7 }, grp);
      cells.push({ grp, e: R() < .42, b: R() < .4, d: R() * 500 });
    }
    let t0 = 0, raf = 0, firedE = false, firedB = false, done = false, visible = false, timer = 0;
    const reset = () => {
      cells.forEach(c => c.grp.classList.remove('e', 'b', 'both'));
      [cE, cB, cBoth].forEach(n => n.textContent = '–');
      firedE = firedB = done = false;
    };
    const DUR = 5200;
    const frame = now => {
      const t = Math.min(1, (now - t0) / DUR), x = 60 + 620 * t;
      ph.setAttribute('x1', x); ph.setAttribute('x2', x);
      if (!firedE && x >= 210) { firedE = true; cells.filter(c => c.e).forEach(c => setTimeout(() => c.grp.classList.add('e'), c.d)); }
      if (!firedB && x >= 470) { firedB = true; cells.filter(c => c.b).forEach(c => setTimeout(() => c.grp.classList.add('b'), c.d)); }
      if (t < 1) { raf = requestAnimationFrame(frame); return; }
      done = true;
      setTimeout(() => {
        cells.filter(c => c.e && c.b).forEach(c => c.grp.classList.add('both'));
        cE.textContent = cells.filter(c => c.e && !c.b).length;
        cB.textContent = cells.filter(c => c.b && !c.e).length;
        cBoth.textContent = cells.filter(c => c.e && c.b).length;
      }, 600);
      clearTimeout(timer);
      if (visible && !reduce) timer = setTimeout(play, 5000);
    };
    function play() { cancelAnimationFrame(raf); clearTimeout(timer); reset(); t0 = performance.now(); raf = requestAnimationFrame(frame); }
    fig1.querySelector('#fig1Replay').onclick = play;
    whenVisible(fig1, () => { visible = true; if (!raf || done) play(); }, () => { visible = false; clearTimeout(timer); });
  }

  /* ---------- Fig 2: cells grow with maturation ---------- */
  const fig2 = document.getElementById('fig2');
  if (fig2) {
    const tissue = fig2.querySelector('#tissue'), slider = fig2.querySelector('#age'), area = fig2.querySelector('#area');
    const R0 = 10, R1 = 30, W = 720, H = 250;
    const draw = v => {
      const s = v / 1000, r = R0 + (R1 - R0) * Math.pow(s, 1.1), sp = r * 2, rowH = sp * .87;
      tissue.replaceChildren();
      const frag = document.createDocumentFragment();
      for (let row = -1; row * rowH < H + sp; row++) {
        for (let col = -1; col * sp < W + sp; col++) {
          const h1 = hash(row, col), h2 = hash(col + 99, row), h3 = hash(row + 7, col * 3);
          const x = col * sp + (row % 2 ? sp / 2 : 0) + (h1 - .5) * r * .35;
          const y = row * rowH + (h2 - .5) * r * .35;
          const e = document.createElementNS(NS, 'ellipse');
          e.setAttribute('cx', x.toFixed(1)); e.setAttribute('cy', y.toFixed(1));
          e.setAttribute('rx', (r * (.9 + h3 * .2)).toFixed(1)); e.setAttribute('ry', (r * (.8 + h1 * .2)).toFixed(1));
          e.setAttribute('transform', `rotate(${((h2 - .5) * 50).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`);
          e.setAttribute('class', 'ln'); e.setAttribute('stroke-width', '1.1');
          frag.appendChild(e);
          if (h3 > .62) {
            const n = document.createElementNS(NS, 'ellipse');
            n.setAttribute('cx', (x + (h1 - .5) * r * .4).toFixed(1)); n.setAttribute('cy', (y + (h2 - .5) * r * .3).toFixed(1));
            n.setAttribute('rx', (r * .24).toFixed(1)); n.setAttribute('ry', (r * .15).toFixed(1));
            n.setAttribute('fill', 'var(--faint)');
            frag.appendChild(n);
          }
        }
      }
      tissue.appendChild(frag);
      area.textContent = '×' + Math.pow(r / R0, 2).toFixed(1);
    };
    slider.addEventListener('input', () => { auto = false; draw(+slider.value); });
    let auto = true;
    draw(0);
    let swept = false;
    whenVisible(fig2, () => {
      if (swept || reduce) return; swept = true;
      const t0 = performance.now(), D = 3200;
      const step = now => {
        if (!auto) return;
        const k = Math.min(1, (now - t0) / D), v = Math.round(1000 * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) * .78);
        slider.value = v; draw(v);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Fig 3: Hippo on / off ---------- */
  const fig3 = document.getElementById('fig3');
  if (fig3) {
    const svg = fig3.querySelector('svg'), yap = fig3.querySelector('#yap');
    const bOn = fig3.querySelector('#hOn'), bOff = fig3.querySelector('#hOff');
    let hippoOn = true, auto = true, timer = 0;
    const set = on => {
      hippoOn = on;
      svg.classList.toggle('off', !on);
      yap.style.transform = on ? 'translate(307px, 196px)' : 'translate(565px, 196px)';
      bOn.classList.toggle('on', on); bOff.classList.toggle('on', !on);
    };
    bOn.onclick = () => { auto = false; set(true); };
    bOff.onclick = () => { auto = false; set(false); };
    const loop = () => { if (!auto) return; set(!hippoOn); timer = setTimeout(loop, 3200); };
    whenVisible(fig3, () => { if (auto && !reduce) { clearTimeout(timer); timer = setTimeout(loop, 1400); } }, () => clearTimeout(timer));
  }
})();
