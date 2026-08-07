const INTERACTIVE_SELECTOR = 'button, [role="button"], input[type="checkbox"], input[type="radio"], .history-session-card, .week-day-card, .exercise-library-card';

export function enableTitanHaptics() {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return () => {};

  const handlePointerUp = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null;
    if (!target || target.hasAttribute('disabled')) return;
    navigator.vibrate(8);
  };

  document.addEventListener('pointerup', handlePointerUp, { passive: true });
  return () => document.removeEventListener('pointerup', handlePointerUp);
}
