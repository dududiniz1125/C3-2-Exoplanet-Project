import { FACTS } from '../data/c32.js';

// "Did you know?" button: each press shows the next fact for a few seconds.
export function createFacts(button, toast) {
  let index = -1;
  let timer = null;
  function show() {
    index = (index + 1) % FACTS.length;
    toast.innerHTML = `<span class="toast-kicker">DID YOU KNOW? ${index + 1}/${FACTS.length}</span>${FACTS[index]}`;
    toast.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(hide, 9000);
  }
  function hide() {
    toast.classList.remove('is-visible');
  }
  button.addEventListener('click', show);
  toast.addEventListener('click', show);
  return { show, hide };
}
