/**
 * Utility to smoothly scroll to on-page sections.
 * If the user is currently on another view (e.g. 'properties', 'pricing', 'dashboard'),
 * it switches to 'home' view first, waits for DOM mounting, and then smoothly scrolls to the target.
 */
export const smoothScrollToSection = (
  targetIdOrSelector: string,
  currentView: string,
  setCurrentView: (view: any) => void
) => {
  const cleanId = targetIdOrSelector.replace(/^#/, '');

  if (currentView !== 'home') {
    setCurrentView('home');
    // Allow the Home components to mount into the DOM before triggering scroll
    setTimeout(() => {
      const el = document.getElementById(cleanId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 120);
  } else {
    const el = document.getElementById(cleanId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};
