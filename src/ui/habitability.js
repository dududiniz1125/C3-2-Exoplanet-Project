import { HABITABILITY, LOCALS } from '../data/c32.js';
import { LOCALS_SVG } from './locals.js';

// "Could you live here?" scorecard + human adaptations + "Meet the locals"
const TAG = { good: 'Good', challenge: 'Challenge', problem: 'Serious problem' };

export function createHabitability(el) {
  el.innerHTML = `
    <div class="habit-head">
      <div>
        <h2 id="habit-title">${HABITABILITY.title}</h2>
        <p style="margin:0;color:var(--muted)">Green = good · Amber = challenge · Red = serious problem</p>
      </div>
      <button class="btn btn-icon" data-close aria-label="Close">×</button>
    </div>
    <div class="habit-grid">
      <div>
        <ul class="score">
          ${HABITABILITY.items
            .map(
              (it) => `<li class="s-${it.status}"><span class="dot"></span><span>${it.label}<small>${it.detail}</small></span><span class="tag">${TAG[it.status]}</span></li>`,
            )
            .join('')}
        </ul>
        <p class="verdict">Verdict: ${HABITABILITY.verdict}</p>
      </div>
      <div>
        <h3>Human adaptations</h3>
        <ul class="adapt">${HABITABILITY.adaptations.map((a) => `<li>${a}</li>`).join('')}</ul>
        <h3>${LOCALS.title} <span class="hypo-tag">Hypothetical</span></h3>
        <div class="locals">
          ${LOCALS_SVG}
          <p><b>Creature:</b> ${LOCALS.creature}</p>
          <p><b>Plants:</b> ${LOCALS.plants}</p>
        </div>
      </div>
    </div>`;

  const api = {
    open() {
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
    },
    close() {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
    },
    get isOpen() {
      return el.classList.contains('is-open');
    },
  };
  el.querySelector('[data-close]').addEventListener('click', api.close);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && api.close());
  return api;
}
