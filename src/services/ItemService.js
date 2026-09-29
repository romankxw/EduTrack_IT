// src/services/ItemService.js
import { http } from '../api/http.js';
import { requestCache, RequestCache } from '../api/cache.js';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strict course search matching:
 * Matches terms against title, tags, domain, category, and summary.
 * For short terms (<= 3 characters, e.g. "ai", "go", "ml", "aws"), requires word boundary
 * to prevent false positives like matching "ai" inside "containerization" or "training".
 */
export function matchCourseQuery(course, query) {
  if (!query) return true;
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return true;

  return terms.every((term) => {
    const isShort = term.length <= 3;
    const safeTerm = escapeRegExp(term);
    const boundaryRegex = new RegExp(`(?:^|[^a-z0-9])${safeTerm}(?:[^a-z0-9]|$)`, 'i');

    const tagMatch = course.tags?.some((t) => {
      const tag = t.toLowerCase();
      if (isShort) {
        return tag === term || boundaryRegex.test(tag);
      }
      return tag.includes(term);
    });
    if (tagMatch) return true;

    const title = course.title || '';
    if (isShort) {
      if (boundaryRegex.test(title)) return true;
    } else if (title.toLowerCase().includes(term)) {
      return true;
    }

    const category = course.category || '';
    const domain = course.domain || '';
    if (isShort) {
      if (boundaryRegex.test(category) || boundaryRegex.test(domain)) {
        return true;
      }
    } else if (category.toLowerCase().includes(term) || domain.toLowerCase().includes(term)) {
      return true;
    }

    const summary = course.summary || '';
    if (isShort) {
      if (boundaryRegex.test(summary)) return true;
    } else if (summary.toLowerCase().includes(term)) {
      return true;
    }

    return false;
  });
}

export class ItemService {
  constructor(client = http, cache = requestCache, resource = 'courses') {
    this.client = client;
    this.cache = cache;
    this.resource = resource;
  }

  async getList({
    q = '',
    level = '',
    domain = '',
    sort = 'publishedAt',
    order = 'desc',
    page = 1,
    limit = 6,
  } = {}) {
    const domains = domain ? domain.split(',').filter(Boolean) : [];
    const levels = level ? level.split(',').filter(Boolean) : [];

    const params = {
      _sort: sort,
      _order: order,
    };

    if (domains.length === 1) {
      params.domain = domains[0];
    } else if (domains.length > 1) {
      params.domain = domains;
    }

    if (levels.length === 1) {
      params.level = levels[0];
    } else if (levels.length > 1) {
      params.level = levels;
    }

    if (!q) {
      params._page = page;
      params._limit = limit;
    }

    const cacheKey = RequestCache.key(`/${this.resource}`, {
      q,
      domain: [...domains].sort().join(','),
      level: [...levels].sort().join(','),
      sort,
      order,
      page,
      limit,
    });

    const cached = this.cache?.get(cacheKey);
    if (cached) {
      return cached;
    }

    const isStaticHost = typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');

    if (isStaticHost) {
      const fallbackResult = await this.fallbackGetList({ q, level, domain, sort, order, page, limit });
      if (fallbackResult) {
        this.cache?.set(cacheKey, fallbackResult);
        return fallbackResult;
      }
    }

    try {
      const response = await this.client.get(`/${this.resource}`, { params });

      let items = response.data;
      let total = 0;

      if (q) {
        const filtered = items.filter((course) => matchCourseQuery(course, q));
        total = filtered.length;
        const start = (page - 1) * limit;
        items = filtered.slice(start, start + limit);
      } else {
        total = Number(response.headers['x-total-count'] ?? items.length);
      }

      const result = {
        items,
        total,
        page,
        limit,
      };

      this.cache?.set(cacheKey, result);
      return result;
    } catch (networkError) {
      // Fallback for static hosts (e.g. GitHub Pages) where json-server backend process cannot run
      const fallbackResult = await this.fallbackGetList({ q, level, domain, sort, order, page, limit });
      if (fallbackResult) {
        this.cache?.set(cacheKey, fallbackResult);
        return fallbackResult;
      }
      throw networkError;
    }
  }

  async fallbackGetList({
    q = '',
    level = '',
    domain = '',
    sort = 'publishedAt',
    order = 'desc',
    page = 1,
    limit = 6,
  }) {
    try {
      const res = await fetch('./db.json');
      if (!res.ok) return null;
      const data = await res.json();
      let list = [...data.courses];

      if (domain) {
        const domains = domain.split(',').filter(Boolean);
        if (domains.length) {
          list = list.filter((c) => domains.includes(c.domain) || domains.includes(c.category?.toLowerCase()));
        }
      }

      if (level) {
        const levels = level.split(',').filter(Boolean);
        if (levels.length) {
          list = list.filter((c) => levels.includes(c.level?.toLowerCase()));
        }
      }

      if (q) {
        list = list.filter((c) => matchCourseQuery(c, q));
      }

      list.sort((a, b) => {
        let valA = a[sort];
        let valB = b[sort];
        if (sort === 'price' || sort === 'rating' || sort === 'likes') {
          valA = Number(valA || 0);
          valB = Number(valB || 0);
        } else {
          valA = String(valA || '');
          valB = String(valB || '');
        }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });

      const total = list.length;
      const start = (page - 1) * limit;
      const items = list.slice(start, start + limit);

      return {
        items,
        total,
        page,
        limit,
      };
    } catch {
      return null;
    }
  }

  async getById(id) {
    const isStaticHost = typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') || window.location.protocol === 'file:');

    if (isStaticHost) {
      try {
        const res = await fetch('./db.json');
        if (res.ok) {
          const dbData = await res.json();
          const course = dbData.courses.find((c) => String(c.id) === String(id) || c.slug === id);
          if (course) {
            course.instructor = dbData.instructors?.find((i) => i.id === course.instructorId);
            course.reviews = dbData.reviews?.filter((r) => String(r.courseId) === String(course.id)) || [];
            return course;
          }
        }
      } catch {
        // Fallback error
      }
    }

    try {
      const { data } = await this.client.get(`/${this.resource}/${id}`, {
        params: { _expand: 'instructor', _embed: 'reviews' },
      });
      return data;
    } catch (networkError) {
      try {
        const res = await fetch('./db.json');
        if (res.ok) {
          const dbData = await res.json();
          const course = dbData.courses.find((c) => String(c.id) === String(id) || c.slug === id);
          if (course) {
            course.instructor = dbData.instructors?.find((i) => i.id === course.instructorId);
            course.reviews = dbData.reviews?.filter((r) => String(r.courseId) === String(course.id)) || [];
            return course;
          }
        }
      } catch {
        // Fallback error
      }
      throw networkError;
    }
  }

  async setLikes(id, likes) {
    try {
      const { data } = await this.client.patch(`/${this.resource}/${id}`, { likes });
      this.cache?.clear();
      return data;
    } catch (err) {
      // In static demo mode (GitHub Pages), resolve gracefully so demo remains interactive
      if (typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:')) {
        this.cache?.clear();
        return { id, likes };
      }
      throw err;
    }
  }

  async createEnrollment(enrollmentData) {
    try {
      const { data } = await this.client.post('/enrollments', enrollmentData);
      this.cache?.clear();
      return data;
    } catch (err) {
      if (typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:')) {
        this.cache?.clear();
        return { id: Date.now(), ...enrollmentData };
      }
      throw err;
    }
  }
}

export const itemService = new ItemService();
