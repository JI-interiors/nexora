// NEXORA — clean interaction controller
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Cursor glow
  window.addEventListener('pointermove', e => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }, {passive:true});

  // Reveal-on-scroll
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, {threshold:.12});
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  // Small tilt on selected-work cards
  $$('.project-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (window.innerWidth < 800) return;
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateY(${x*3}deg) rotateX(${y*-3}deg) translateY(-5px)`;
    });
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });

  // Hero: exactly one card per wheel gesture / swipe / arrow press.
  const stage=$('#heroShowcase');
  const scene=$('#wheelScene');
  const cards=$$('.wheel-card',scene||document);
  if(stage && scene && cards.length===9){
    let active=0, locked=false, wheelDelta=0, wheelReset=null;
    let pointerStart=null, pointerStartTime=0, pointerCard=null, moved=false;

    const getLayout=()=>{
      const mobile=matchMedia('(max-width:650px)').matches;
      const W=Math.max(stage.clientWidth||700,320), compact=W<900;
      const side=mobile?Math.min(118,W*.29):compact?180:245;
      const far=mobile?Math.min(105,W*.26):compact?300:390;
      return mobile?[
        {x:0,y:0,z:80,s:1,rz:0,o:1,b:1,zI:100},{x:side*.82,y:-82,z:28,s:.76,rz:7,o:.88,b:.96,zI:82},{x:-side*.82,y:-74,z:22,s:.76,rz:-7,o:.88,b:.96,zI:81},
        {x:far*.58,y:82,z:10,s:.68,rz:9,o:.78,b:.92,zI:70},{x:-far*.58,y:88,z:8,s:.68,rz:-10,o:.78,b:.92,zI:69},{x:far*.90,y:-10,z:-5,s:.61,rz:13,o:.62,b:.88,zI:55},
        {x:-far*.90,y:0,z:-8,s:.61,rz:-13,o:.62,b:.88,zI:54},{x:side*.38,y:128,z:-14,s:.56,rz:5,o:.5,b:.84,zI:43},{x:-side*.38,y:132,z:-16,s:.56,rz:-5,o:.5,b:.84,zI:42}
      ]:[
        {x:0,y:0,z:90,s:1,rz:0,o:1,b:1,zI:100},{x:side,y:-105,z:30,s:.79,rz:7,o:.9,b:.97,zI:86},{x:-side,y:-92,z:26,s:.79,rz:-7,o:.9,b:.97,zI:85},
        {x:far*.58,y:96,z:12,s:.70,rz:9,o:.8,b:.93,zI:74},{x:-far*.58,y:104,z:10,s:.70,rz:-10,o:.8,b:.93,zI:73},{x:far*.88,y:-12,z:-4,s:.62,rz:13,o:.66,b:.89,zI:58},
        {x:-far*.88,y:-2,z:-6,s:.62,rz:-13,o:.66,b:.89,zI:57},{x:side*.42,y:150,z:-12,s:.58,rz:5,o:.54,b:.86,zI:46},{x:-side*.42,y:156,z:-14,s:.58,rz:-5,o:.54,b:.86,zI:45}
      ];
    };

    const updateCopy=()=>{
      const current=cards[active];
      const label=$('#showcaseLabel');
      const quote=$('#showcaseQuote');
      if(label) label.textContent=current.dataset.label||'';
      if(quote){ quote.textContent=current.dataset.quote||'“Your website should feel like your best salesperson — working 24/7.”'; quote.classList.remove('fade'); }
    };
    const render=(animate=true)=>{
      const pos=getLayout();
      cards.forEach((card,i)=>{
        const rel=(i-active+cards.length)%cards.length,q=pos[rel];
        card.style.transition=animate?'transform .38s cubic-bezier(.22,.8,.2,1),opacity .22s ease,filter .22s ease,box-shadow .22s ease':'none';
        card.style.transform=`translate3d(${q.x}px,${q.y}px,${q.z}px) rotateZ(${q.rz}deg) scale(${q.s})`;
        card.style.opacity=q.o; card.style.filter=`brightness(${q.b})`; card.style.zIndex=q.zI; card.classList.toggle('is-front',rel===0);
      });
      updateCopy();
    };
    const step=dir=>{
      if(locked)return; locked=true; active=(active+dir+cards.length)%cards.length; render(true);
      clearTimeout(step.timer); step.timer=setTimeout(()=>locked=false,410);
    };

    stage.addEventListener('wheel',e=>{
      e.preventDefault();
      if(locked)return;
      const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      wheelDelta+=d; clearTimeout(wheelReset); wheelReset=setTimeout(()=>wheelDelta=0,130);
      if(Math.abs(wheelDelta)>=18){const dir=wheelDelta>0?1:-1;wheelDelta=0;step(dir);}
    },{passive:false});

    stage.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      pointerStart={x:e.clientX,y:e.clientY}; pointerStartTime=performance.now(); pointerCard=e.target.closest('.wheel-card'); moved=false;
      try{stage.setPointerCapture(e.pointerId)}catch(_){}
    });
    stage.addEventListener('pointerup',e=>{
      if(!pointerStart||locked){pointerStart=null;pointerCard=null;return;}
      const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y,elapsed=Math.max(1,performance.now()-pointerStartTime);
      moved=Math.hypot(dx,dy)>8; pointerStart=null;
      const distance=Math.abs(dx), horizontal=distance>Math.abs(dy)*1.15;
      if(horizontal&&(distance>42||distance/elapsed>.45)){step(dx<0?1:-1);pointerCard=null;return;}
      if(!moved&&pointerCard?.dataset.demo) window.open(pointerCard.dataset.demo,'_blank','noopener,noreferrer');
      pointerCard=null;
    });
    stage.addEventListener('pointercancel',()=>{pointerStart=null;pointerCard=null;moved=false});
    cards.forEach(card=>card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&card.dataset.demo){e.preventDefault();window.open(card.dataset.demo,'_blank','noopener,noreferrer')}}));
    document.addEventListener('keydown',e=>{
      const r=stage.getBoundingClientRect(),visible=r.bottom>innerHeight*.22&&r.top<innerHeight*.78;
      if(!visible||locked||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
      let dir=0; if(['ArrowRight','ArrowDown','PageDown'].includes(e.key))dir=1; if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key))dir=-1;
      if(e.key==='Home')dir=-1;if(e.key==='End')dir=1;if(!dir)return; e.preventDefault();e.stopPropagation();step(dir);
    },{capture:true});
    addEventListener('resize',()=>requestAnimationFrame(()=>render(false)));
    addEventListener('orientationchange',()=>setTimeout(()=>render(false),120));
    render(false);
  }

  // Mobile / tablet menu
  const toggle=$('#menuToggle'),menu=$('#mobileMenu');
  const setMenuOpen=open=>{
    if(!toggle||!menu)return;
    toggle.classList.toggle('is-open',open); menu.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open?'Close menu':'Open menu'); menu.setAttribute('aria-hidden',String(!open));
    document.body.classList.toggle('menu-open',open);
  };
  toggle?.addEventListener('click',()=>setMenuOpen(!menu.classList.contains('is-open')));
  $$('.mobile-menu-links [data-menu-link]',menu||document).forEach(link=>link.addEventListener('click',()=>setMenuOpen(false)));
  $$('.mobile-menu-links .mobile-contact-link',menu||document).forEach(link=>link.addEventListener('click',()=>setMenuOpen(false)));
  document.addEventListener('pointerdown',e=>{
    if(!menu?.classList.contains('is-open'))return;
    if(menu.contains(e.target)||toggle?.contains(e.target))return;
    setMenuOpen(false);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('is-open'))setMenuOpen(false)});

  // Contact / CTA actions
  const WHATSAPP_NUMBER='REPLACE_WITH_YOUR_WHATSAPP_NUMBER';
  const whatsappUrl=message=>{const text=encodeURIComponent(message||'Hello Nexora, I would like to discuss a website project.');return(!WHATSAPP_NUMBER||WHATSAPP_NUMBER.includes('REPLACE_'))?'https://wa.me/?text='+text:'https://wa.me/'+WHATSAPP_NUMBER+'?text='+text};
  $$('.js-whatsapp').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.location.assign(whatsappUrl(btn.dataset.whatsappMessage))},{capture:true}));

  $$('.js-explore').forEach(btn=>btn.addEventListener('click',e=>{
    e.preventDefault(); const target=$('#work'); if(!target)return; history.replaceState(null,'','#work'); target.scrollIntoView({behavior:'smooth',block:'start'});
  }));

  const modal=$('#projectModal'),form=$('#projectForm'),note=$('#projectFormNote');
  const setModal=open=>{if(!modal)return;modal.classList.toggle('is-open',open);modal.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('modal-open',open);if(open)setTimeout(()=>modal.querySelector('input')?.focus(),80)};
  $$('.js-open-form').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();setModal(true)}));
  $$('[data-close-form]',modal||document).forEach(el=>el.addEventListener('click',()=>setModal(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('is-open'))setModal(false)});

  // Service cards
  $$('[data-service-page]').forEach(card=>{
    card.style.cursor='pointer';card.setAttribute('role','link');card.setAttribute('tabindex','0');
    card.addEventListener('click',()=>{window.location.href=card.dataset.servicePage});
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.location.href=card.dataset.servicePage}});
  });

  form?.addEventListener('submit',e=>{
    e.preventDefault(); const data=new FormData(form);
    const message=`Hello Nexora, I would like to discuss a website project.\n\nName: ${data.get('name')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email')}\nMessage: ${data.get('message')}`;
    if(note)note.textContent='Opening WhatsApp so you can send your enquiry.';
    window.location.assign(whatsappUrl(message)); form.reset(); setModal(false);
  });
})();
