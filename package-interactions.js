/* NALVO package interaction layer — scoped to service package cards. */
(() => {
  const page = document.title.toLowerCase();
  const service = page.includes('web design') ? 'Web Design'
    : page.includes('lead generation') ? 'Lead Generation'
    : page.includes('seo') ? 'SEO'
    : page.includes('maintenance') ? 'Website Maintenance'
    : '';
  if (!service) return;

  const cards = [...document.querySelectorAll('.wd-card, .plan')];
  const packages = cards.filter(card => card.querySelector('ul, .wd-columns'));
  if (!packages.length) return;

  const getName = card => {
    const h = card.querySelector('h3');
    if (h?.textContent.trim()) return h.textContent.trim();
    const named = card.querySelector('.plan-number, .wd-number');
    if (named?.textContent.trim()) return named.textContent.replace(/^\s*\d+\s*\/\s*/,'').trim();
    const first = card.querySelector(':scope > span');
    return first?.textContent.trim() || 'Package';
  };

  packages.forEach((card, index) => {
    if (card.querySelector(':scope > .package-controls')) return;
    const name = getName(card);
    const details = [...card.querySelectorAll(':scope > ul, :scope > .wd-columns')];
    if (!details.length) return;

    details.forEach((el, i) => {
      el.classList.add('package-details');
      el.id ||= `package-details-${index}-${i}`;
    });

    const controls = document.createElement('div');
    controls.className = 'package-controls';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'package-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', details[0].id);
    toggle.innerHTML = '<span>View package details</span><b aria-hidden="true">+</b>';

    const cta = document.createElement('a');
    cta.className = 'package-cta';
    cta.href = `index.html?service=${encodeURIComponent(service)}&package=${encodeURIComponent(name)}#contact-form`;
    cta.innerHTML = `Choose ${name} <span aria-hidden="true">→</span>`;

    controls.append(toggle, cta);
    const anchor = details[0];
    anchor.parentNode.insertBefore(controls, anchor);
    card.classList.add('package-collapsed');

    const setExpanded = open => {
      card.classList.toggle('package-expanded', open);
      card.classList.toggle('package-collapsed', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('span').textContent = open ? 'Hide package details' : 'View package details';
      toggle.querySelector('b').textContent = open ? '−' : '+';
    };

    toggle.addEventListener('click', event => {
      event.stopPropagation();
      setExpanded(!card.classList.contains('package-expanded'));
    });

    card.addEventListener('click', event => {
      if (event.target.closest('a,button,ul,.wd-columns')) return;
      setExpanded(!card.classList.contains('package-expanded'));
    });
  });
})();
