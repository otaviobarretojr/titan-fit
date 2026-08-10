const HUB_ID = 'titan-health-hub-switch';

function getNavButtons() {
  const nav = document.querySelector<HTMLElement>('.bottom-navigation');
  if (!nav) return null;
  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'));
  const health = buttons.find((button) => button.textContent?.trim() === 'Saúde');
  const progress = buttons.find((button) => button.textContent?.trim() === 'Progresso');
  return health && progress ? { health, progress } : null;
}

function syncHealthHub() {
  const nav = getNavButtons();
  if (!nav) return;
  const progressActive = nav.progress.getAttribute('aria-current') === 'page';
  const healthActive = nav.health.getAttribute('aria-current') === 'page';
  if (progressActive) nav.health.classList.add('active');

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
      if (target.dataset.healthView === 'evolution') nav.progress.click();
      else nav.health.click();
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
  const observer = new MutationObserver(syncHealthHub);
  const start = () => {
    syncHealthHub();
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-current'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
