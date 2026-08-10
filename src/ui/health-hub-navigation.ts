const HUB_ID = 'titan-health-hub-switch';

function getNavButtons() {
  const nav = document.querySelector<HTMLElement>('.bottom-navigation');
  if (!nav) return null;
  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'));
  const health = buttons.find((button) => button.textContent?.trim() === 'Saúde');
  const progress = buttons.find((button) => button.textContent?.trim() === 'Progresso');
  return health && progress ? { nav, health, progress } : null;
}

function syncHealthHub() {
  const refs = getNavButtons();
  if (!refs) return;
  const { health, progress } = refs;
  const progressActive = progress.getAttribute('aria-current') === 'page';
  const healthActive = health.getAttribute('aria-current') === 'page';

  health.classList.toggle('active', healthActive || progressActive);

  const existing = document.getElementById(HUB_ID);
  if (!healthActive && !progressActive) {
    existing?.remove();
    return;
  }

  const main = document.querySelector<HTMLElement>('.app-main');
  if (!main) return;

  let switcher = existing;
  if (!switcher) {
    switcher = document.createElement('div');
    switcher.id = HUB_ID;
    switcher.className = 'health-hub-switch';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Seções de saúde');
    switcher.innerHTML = '<button type="button" role="tab" data-health-view="today">Visão geral</button><button type="button" role="tab" data-health-view="evolution">Evolução</button>';
    switcher.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-health-view]');
      if (!target) return;
      const current = getNavButtons();
      if (!current) return;
      if (target.dataset.healthView === 'evolution') current.progress.click();
      else current.health.click();
    });
    main.prepend(switcher);
  }

  const today = switcher.querySelector<HTMLButtonElement>('[data-health-view="today"]');
  const evolution = switcher.querySelector<HTMLButtonElement>('[data-health-view="evolution"]');
  today?.classList.toggle('active', healthActive);
  evolution?.classList.toggle('active', progressActive);
  today?.setAttribute('aria-selected', String(healthActive));
  evolution?.setAttribute('aria-selected', String(progressActive));
}

export function enableHealthHubNavigation() {
  let frame = 0;
  let observedNav: HTMLElement | null = null;
  let navObserver: MutationObserver | null = null;

  const scheduleSync = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      syncHealthHub();
      attachNavObserver();
    });
  };

  const attachNavObserver = () => {
    const refs = getNavButtons();
    const nav = refs?.nav ?? null;
    if (!nav || nav === observedNav) return;
    navObserver?.disconnect();
    observedNav = nav;
    navObserver = new MutationObserver(scheduleSync);
    navObserver.observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    nav.addEventListener('click', scheduleSync);
  };

  const start = () => {
    attachNavObserver();
    syncHealthHub();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
