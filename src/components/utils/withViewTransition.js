export function withViewTransition(fn) {
    if (document.startViewTransition) {
      return document.startViewTransition(fn);
    }
    return fn();
  }