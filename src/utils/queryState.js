// src/utils/queryState.js
export const DEFAULTS = {
  q: '',
  level: '',
  domain: '',
  sort: 'publishedAt',
  order: 'desc',
  page: 1,
  limit: 6,
};

export function readState() {
  const params = new URLSearchParams(window.location.search);
  return {
    ...DEFAULTS,
    ...Object.fromEntries(params.entries()),
    page: Number(params.get('page') ?? DEFAULTS.page),
    limit: Number(params.get('limit') ?? DEFAULTS.limit),
  };
}

export function writeState(state, { replace = false } = {}) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== '' && value !== DEFAULTS[key]) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  if (replace) {
    window.history.replaceState(state, '', url);
  } else {
    window.history.pushState(state, '', url);
  }
}
