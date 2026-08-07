type TrendTone = 'favorable' | 'unfavorable' | 'neutral';

const LOWER_IS_BETTER = new Set(['gordura', 'cintura']);
const HIGHER_IS_BETTER = new Set(['massa muscular', 'massa magra']);

function classify(label: string, diff: number): TrendTone {
  const normalized = label.trim().toLocaleLowerCase('pt-BR');
  if (Math.abs(diff) < 0.05) return 'neutral';
  if (LOWER_IS_BETTER.has(normalized)) return diff < 0 ? 'favorable' : 'unfavorable';
  if (HIGHER_IS_BETTER.has(normalized)) return diff > 0 ? 'favorable' : 'unfavorable';
  return 'neutral';
}

function parseDiff(value: string): number | null {
  const match = value.replace(',', '.').match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function decorateComparisonCards() {
  document.querySelectorAll<HTMLElement>('.comparison-item').forEach((card) => {
    const label = card.querySelector('span')?.textContent ?? '';
    const strong = card.querySelector('strong');
    const diff = parseDiff(strong?.textContent ?? '');
    if (diff === null) return;

    const tone = classify(label, diff);
    card.dataset.trendTone = tone;
    card.dataset.trendDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  });
}

export function enableEvolutionFeedback() {
  if (typeof document === 'undefined') return;
  decorateComparisonCards();

  const observer = new MutationObserver(() => decorateComparisonCards());
  observer.observe(document.body, { childList: true, subtree: true });
}
