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

  // Scattered product-board layout: the active card becomes the featured card,
  // while the other eight cards occupy distinct, overlapping positions around it.
  // One gesture always advances exactly one card.
  function getLayout() {
    const mobile = window.matchMedia('(max-width:650px)').matches;
    const W = Math.max(stage.clientWidth || 700, 320);
    const compact = W < 900;
    const side = mobile ? Math.min(118, W * .29) : compact ? 180 : 245;
    const far = mobile ? Math.min(105, W * .26) : compact ? 300 : 390;
    const result = [];
    const spots = mobile ? [
      {x:0,y:0,z:80,s:1,rz:0,o:1,b:1,zI:100},
      {x:side*.82,y:-82,z:28,s:.76,rz:7,o:.88,b:.96,zI:82},
      {x:-side*.82,y:-74,z:22,s:.76,rz:-7,o:.88,b:.96,zI:81},
      {x:far*.58,y:82,z:10,s:.68,rz:9,o:.78,b:.92,zI:70},
      {x:-far*.58,y:88,z:8,s:.68,rz:-10,o:.78,b:.92,zI:69},
      {x:far*.90,y:-10,z:-5,s:.61,rz:13,o:.62,b:.88,zI:55},
      {x:-far*.90,y:0,z:-8,s:.61,rz:-13,o:.62,b:.88,zI:54},
      {x:side*.38,y:128,z:-14,s:.56,rz:5,o:.5,b:.84,zI:43},
      {x:-side*.38,y:132,z:-16,s:.56,rz:-5,o:.5,b:.84,zI:42}
    ] : [
      {x:0,y:0,z:90,s:1,rz:0,o:1,b:1,zI:100},
      {x:side,y:-105,z:30,s:.79,rz:7,o:.9,b:.97,zI:86},
      {x:-side,y:-92,z:26,s:.79,rz:-7,o:.9,b:.97,zI:85},
      {x:far*.58,y:96,z:12,s:.70,rz:9,o:.8,b:.93,zI:74},
      {x:-far*.58,y:104,z:10,s:.70,rz:-10,o:.8,b:.93,zI:73},
      {x:far*.88,y:-12,z:-4,s:.62,rz:13,o:.66,b:.89,zI:58},
      {x:-far*.88,y:-2,z:-6,s:.62,rz:-13,o:.66,b:.89,zI:57},
      {x:side*.42,y:150,z:-12,s:.58,rz:5,o:.54,b:.86,zI:46},
      {x:-side*.42,y:156,z:-14,s:.58,rz:-5,o:.54,b:.86,zI:45}
    ];
    return spots;
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

  // Keyboard control: when the hero is meaningfully visible, arrow keys control the cards
  // instead of scrolling the whole document. Outside the hero, normal page scrolling remains intact.
  document.addEventListener('keydown', e => {
    const r = stage.getBoundingClientRect();
    const visible = r.bottom > window.innerHeight * .22 && r.top < window.innerHeight * .78;
    if (!visible || locked) return;
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
    let dir = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    if (e.key === 'Home') dir = -1;
    if (e.key === 'End') dir = 1;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    step(dir);
  }, {capture:true});

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render(false));
  });
  window.addEventListener('orientationchange', () => setTimeout(() => render(false), 120));

  render(false);
})();

/* UPDATED_9_DEMO_CLICK */
document.addEventListener('click',function(e){
  const s=e.target.closest('.new-site-card .preview-shield');
  if(s){const c=s.closest('.new-site-card'); if(c?.dataset.demo) window.open(c.dataset.demo,'_blank','noopener');}
});
document.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('new-site-card')){
    e.preventDefault(); if(e.target.dataset.demo) window.open(e.target.dataset.demo,'_blank','noopener');
  }
});


/* Mobile navigation: six What We Do options + Contact */
(function(){
  const toggle=document.getElementById('menuToggle');
  const menu=document.getElementById('mobileMenu');
  if(!toggle||!menu) return;
  const setOpen=(open)=>{
    toggle.classList.toggle('is-open',open);
    menu.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    menu.setAttribute('aria-hidden',String(!open));
    document.body.classList.toggle('menu-open',open);
  };
  toggle.addEventListener('click',()=>setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('[data-menu-link]').forEach(link=>link.addEventListener('click',()=>setOpen(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('is-open')) setOpen(false)});
})();

/* NEXORA contact actions */
(function(){
  // Replace this once with the business WhatsApp number, digits only, including country code.
  // Example: '919876543210'
  const WHATSAPP_NUMBER = 'REPLACE_WITH_YOUR_WHATSAPP_NUMBER';
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  const note = document.getElementById('projectFormNote');

  function openWhatsApp(message){
    const text = encodeURIComponent(message || 'Hello Nexora, I would like to discuss a website project.');
    const url = (!WHATSAPP_NUMBER || WHATSAPP_NUMBER.includes('REPLACE_'))
      ? 'https://api.whatsapp.com/send?text=' + text
      : 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  document.querySelectorAll('.js-whatsapp').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const message = btn.dataset.whatsappMessage || 'Hello Nexora, I would like to discuss a website project.';
    const url = (!WHATSAPP_NUMBER || WHATSAPP_NUMBER.includes('REPLACE_'))
      ? 'https://wa.me/?text=' + encodeURIComponent(message)
      : 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    window.location.assign(url);
  }, true));

  function setModal(open){
    if(!modal) return;
    modal.classList.toggle('is-open', open);
    modal.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('modal-open', open);
    if(open) setTimeout(()=>modal.querySelector('input')?.focus(),80);
  }
  document.querySelectorAll('.js-open-form').forEach(btn => btn.addEventListener('click', e => {e.preventDefault();setModal(true);}));
  modal?.querySelectorAll('[data-close-form]').forEach(el => el.addEventListener('click', ()=>setModal(false)));
  document.addEventListener('keydown', e => { if(e.key==='Escape' && modal?.classList.contains('is-open')) setModal(false); });

    document.querySelectorAll('[data-service-page]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { window.location.href = card.dataset.servicePage; });
    card.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = card.dataset.servicePage; } });
    card.setAttribute('role','link');
    card.setAttribute('tabindex','0');
  });

document.querySelectorAll('.js-explore').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const target = document.getElementById('work');
    if(target){
      history.replaceState(null, '', '#work');
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }, true));

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const message = `Hello Nexora, I would like to discuss a website project.\n\nName: ${data.get('name')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email')}\nMessage: ${data.get('message')}`;
    if(!WHATSAPP_NUMBER || WHATSAPP_NUMBER.includes('REPLACE_')){
      if(note) note.textContent = 'Opening WhatsApp so you can choose the chat and send your enquiry.';
      openWhatsApp(message);
      form.reset();
      setModal(false);
      return;
    }
    openWhatsApp(message);
    form.reset();
    setModal(false);
  });
})();
