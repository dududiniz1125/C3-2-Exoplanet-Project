import { TABLES } from '../data/c32.js';
import { createLightCurve } from './lightCurve.js';

// "Learn more" side drawer: every number for the current view in a table
// (value + short "how we got this" line).
const TITLES = {
  intro: 'C3-2 at a glance',
  system: 'Distance and orbit',
  planet: 'The planet C3-2',
  star: 'Host star (K6V)',
  interior: 'Inside C3-2',
};
const SECTIONS = {
  intro: ['overview', 'reference'],
  system: ['system'],
  planet: ['planet'],
  star: ['star', 'reference'],
  interior: ['interior'],
};

function tableHTML(section) {
  const rows = section.rows
    .map(
      ([label, value, how]) =>
        `<tr><td>${label}</td><td>${value}${how ? `<span class="how">${how}</span>` : ''}</td></tr>`,
    )
    .join('');
  return `<h4>${section.title}</h4>${section.note ? `<p class="table-note">${section.note}</p>` : ''}<table class="data-table"><tbody>${rows}</tbody></table>`;
}

export function createDrawer({ el, title, body, closeBtn }) {
  const lightCurve = createLightCurve();
  let openFor = null;

  function render(view) {
    title.textContent = TITLES[view] || TITLES.intro;
    const parts = (SECTIONS[view] || SECTIONS.intro).flatMap((k) => TABLES[k]);
    let html = '';
    if (view === 'interior') html += '<p><span class="hypo-tag">Hypothetical</span></p>';
    html += parts.map(tableHTML).join('');
    body.innerHTML = html;
    if (view === 'planet') {
      const h = document.createElement('h4');
      h.textContent = 'Transit light curve';
      body.prepend(lightCurve.element);
      body.prepend(h);
    }
  }

  function open(view) {
    openFor = view;
    render(view);
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    body.scrollTop = 0;
    if (view === 'planet') requestAnimationFrame(() => lightCurve.start());
  }
  function close() {
    openFor = null;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    lightCurve.stop();
  }
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  window.addEventListener('resize', () => openFor === 'planet' && lightCurve.resize());

  return {
    open,
    close,
    toggle(view) {
      if (openFor === view) close();
      else open(view);
    },
    // keep the drawer in sync if the view changes while it is open
    sync(view) {
      if (openFor && openFor !== view) open(view);
    },
    get isOpen() {
      return !!openFor;
    },
  };
}
