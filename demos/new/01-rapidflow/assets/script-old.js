const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', e => {
  document.documentElement.style.setProperty('--mx', e.clientX + 'px');
  document.documentElement.style.setProperty('--my', e.clientY + 'px');
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav').classList.toggle('open');
});

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('pointermove', e => {
    if (window.innerWidth < 800) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${y * -3}deg) translateY(-5px)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = '');
});





/* Original-style 9-card wheel: tight overlapping fan, one gesture = one card */
(() => {
  const stage = document.getElementById('heroShowcase');
  const scene = document.getElementById('wheelScene');
  const cards = Array.from(scene?.querySelectorAll('.wheel-card') || []);
  const quote = document.getElementById('showcaseQuote');
  const label = document.getElementById('showcaseLabel');
  if (!stage || !scene || cards.length !== 9) return;

  let active = 0;
  let locked = false;
  let wheelDelta = 0;
  let wheelReset;
  let touchStart = null;
  let startTime = 0;
  let pointerMoved = false;
  let activePointerCard = null;
  let raf;

  // Positions are a circular/fan wheel, not a stack or carousel.
  // rel 0 is always the front card. Other cards orbit around that fixed point.
  function getLayout() {
    const mobile = window.matchMedia('(max-width:650px)').matches;
    const rx = mobile ? 72 : 118;
    const ry = mobile ? 27 : 34;
    const depth = mobile ? 72 : 96;
    const backY = mobile ? 24 : 34;
    const scaleBack = mobile ? .88 : .84;
    const result = [];

    for (let rel = 0; rel < 9; rel++) {
      if (rel === 0) {
        result.push({x:0,y:0,z:depth+45,s:1,rz:0,o:1,b:1,zI:100});
        continue;
      }

      // Signed wheel angle: cards 1-4 move around the right side,
      // cards 5-8 around the left side. The rear cards meet behind the front.
      let a = rel * 40;
      if (a > 180) a -= 360;
      const rad = a * Math.PI / 180;
      const side = Math.sin(rad);
      const back = 1 - Math.cos(rad);
      const x = side * rx;
      const y = back * ry;
      const z = depth * Math.cos(rad) - 8;
      const s = scaleBack + (1-scaleBack) * Math.max(0, Math.cos(rad));
      const o = .72 + .28 * Math.max(0, Math.cos(rad));
      const b = .88 + .12 * Math.max(0, Math.cos(rad));
      result.push({x,y,z,s,rz:side*5.2,o,b,zI:Math.round(60+45*Math.max(0,Math.cos(rad)))});
    }
    return result;
  }

  function updateCopy() {
    const current = cards[active];
    if (label) label.textContent = current.dataset.label;
    if (quote) {
      quote.classList.add('fade');
      clearTimeout(updateCopy.timer);
      updateCopy.timer = setTimeout(() => {
        quote.textContent = '“' + current.dataset.quote + '”';
        quote.classList.remove('fade');
      }, 60);
    }
  }

  function render(animate=true) {
    const pos = getLayout();
    cards.forEach((card, i) => {
      const rel = (i - active + cards.length) % cards.length;
      const q = pos[rel];
      card.style.transition = animate
        ? 'transform .38s cubic-bezier(.22,.8,.2,1), opacity .22s ease, filter .22s ease, box-shadow .22s ease'
        : 'none';
      card.style.transform = `translate3d(${q.x}px,${q.y}px,${q.z}px) rotateZ(${q.rz}deg) scale(${q.s})`;
      card.style.opacity = q.o;
      card.style.filter = `brightness(${q.b})`;
      card.style.zIndex = q.zI;
      card.classList.toggle('is-front', rel === 0);
    });
    updateCopy();
  }

  function step(dir) {
    if (locked) return;
    locked = true;
    active = (active + dir + cards.length) % cards.length;
    render(true);
    clearTimeout(step.unlock);
    step.unlock = setTimeout(() => { locked = false; }, 410);
  }

  // Mouse wheel / trackpad: absorb the gesture and move exactly one card.
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    if (locked) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelDelta += d;
    clearTimeout(wheelReset);
    wheelReset = setTimeout(() => { wheelDelta = 0; }, 130);
    if (Math.abs(wheelDelta) >= 18) {
      const dir = wheelDelta > 0 ? 1 : -1;
      wheelDelta = 0;
      step(dir);
    }
  }, {passive:false});

  // Touch: one deliberate horizontal swipe = one wheel rotation.
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    touchStart = {x:e.clientX, y:e.clientY};
    startTime = performance.now();
    pointerMoved = false;
    activePointerCard = e.target.closest('.wheel-card');
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });

  stage.addEventListener('pointerup', e => {
    if (!touchStart || locked) { touchStart = null; activePointerCard = null; return; }
    const dx = e.clientX - touchStart.x;
    const dy = e.clientY - touchStart.y;
    if (Math.hypot(dx,dy) > 8) pointerMoved = true;
    const elapsed = Math.max(1, performance.now() - startTime);
    touchStart = null;
    const distance = Math.abs(dx);
    const horizontal = distance > Math.abs(dy) * 1.15;
    if (horizontal && (distance > 42 || distance / elapsed > .45)) {
      step(dx < 0 ? 1 : -1);
      pointerMoved = true;
      activePointerCard = null;
      return;
    }

    // A clean tap/click on a website preview opens its live sample in a new tab.
    if (!pointerMoved && activePointerCard && activePointerCard.dataset.demo) {
      window.open(activePointerCard.dataset.demo, '_blank', 'noopener,noreferrer');
    }
    activePointerCard = null;
  });
  stage.addEventListener('pointercancel', () => { touchStart = null; activePointerCard = null; pointerMoved = false; });

  // Keyboard access for desktop users.
  cards.forEach(card => {
    card.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && card.dataset.demo) {
        e.preventDefault();
        window.open(card.dataset.demo, '_blank', 'noopener,noreferrer');
      }
    });
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render(false));
  });
  window.addEventListener('orientationchange', () => setTimeout(() => render(false), 120));

  render(false);
})();
