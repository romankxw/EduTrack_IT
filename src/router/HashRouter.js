// src/router/HashRouter.js
export class HashRouter {
  constructor(routes, { notFound } = {}) {
    this.routes = routes.map(({ path, handler }) => ({
      handler,
      pattern: new RegExp(`^${path.replace(/:\w+/g, '([^/]+)')}$`),
    }));
    this.notFound = notFound;
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('DOMContentLoaded', () => this.resolve());
  }

  resolve() {
    const rawHash = window.location.hash.slice(1);
    // If no hash is set on the page, don't hijack standard page render unless requested
    if (!rawHash && !window.location.hash.startsWith('#/')) {
      return;
    }

    const path = rawHash || '/list';
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        return route.handler(...match.slice(1));
      }
    }

    return this.notFound?.(path);
  }
}
