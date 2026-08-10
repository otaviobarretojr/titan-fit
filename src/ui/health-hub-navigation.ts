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
  if (!refs) return false;
  const { health, progress } = refs;
  const progressActive = progress.getAttribute('aria-current') === 'page';
  const healthActive = health.getAttribute('aria-current') === 'page';

  health.classList.toggle('active', healthActive || progressActive);

  const existing = document.getElementById(HUB_ID);
  if (!healthActive && !progressActive) {
    existing?.remove();
    return true;
  }

  const main = document.querySelector<HTMLElement>('.app-main');
  if (!main) return false;

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
  } else if (switcher.parentElement !== main) {
    main.prepend(switcher);
  }

  const today = switcher.querySelector<HTMLButtonElement>('[data-health-view="today"]');
  const evolution = switcher.querySelector<HTMLButtonElement>('[data-health-view="evolution"]');
  today?.classList.toggle('active', healthActive);
  evolution?.classList.toggle('active', progressActive);
  today?.setAttribute('aria-selected', String(healthActive));
  evolution?.setAttribute('aria-selected', String(progressActive));
  return true;
}

export function enableHealthHubNavigation() {
  let frame = 0;
  let observedNav: HTMLElement | null = null;
  let navObserver: MutationObserver | null = null;
  let mountFrames = 0;

  const scheduleSync = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      const mounted = syncHealthHub();
      attachNavObserver();
      if (!mounted && mountFrames < 180) {
        mountFrames += 1;
        scheduleSync();
      } else if (mounted) {
        mountFrames = 0;
      }
    });
  };

  const attachNavObserver = () => {
    const refs = getNavButtons();
    const nav = refs?.nav ?? null;
    if (!nav) {
      observedNav = null;
      navObserver?.disconnect();
      navObserver = null;
      return;
    }
    if (nav === observedNav && nav.isConnected) return;

    navObserver?.disconnect();
    observedNav = nav;
    navObserver = new MutationObserver(scheduleSync);
    navObserver.observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  };

  const restart = () => {
    mountFrames = 0;
    scheduleSync();
  };

  const start = () => {
    restart();
    document.addEventListener('click', scheduleSync, { passive: true });
    window.addEventListener('popstate', restart);
    window.addEventListener('pageshow', restart);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
