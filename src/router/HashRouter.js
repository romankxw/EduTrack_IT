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
    // Only handle routes that explicitly start with '#/' (e.g. '#/list', '#/item/1')
    // Standard in-page anchors (e.g. '#main') or empty hash should never trigger router 404
    if (!window.location.hash.startsWith('#/')) {
      return;
    }

    const path = window.location.hash.slice(1);
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        return route.handler(...match.slice(1));
      }
    }

    return this.notFound?.(path);
  }
}
