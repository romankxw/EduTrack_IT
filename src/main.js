// src/main.js
// Catalog orchestrator: ItemService, ListView, Paginator, queryState, optimistic likes, HashRouter

import { itemService } from './services/ItemService.js';
import { ListView } from './views/ListView.js';
import { DetailsView } from './views/DetailsView.js';
import { Paginator } from './components/Paginator.js';
import { readState, writeState } from './utils/queryState.js';
import { likesStorage } from './utils/likesStorage.js';
import { HashRouter } from './router/HashRouter.js';

function initCatalog() {
  const searchInput = document.getElementById('course-search');
  const sortSelect = document.getElementById('course-sort');
  const countEl = document.getElementById('catalog-count');
  const listRoot = document.getElementById('courses-list');
  const paginationRoot = document.getElementById('pagination');
  const viewContainer = document.getElementById('catalog-view-container');
  const domainInputs = document.querySelectorAll('input[name="domain"]');
  const levelInputs = document.querySelectorAll('input[name="level"]');

  const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
  const mobileFiltersLabel = document.getElementById('mobile-filters-label');
  const mobileSortBtn = document.getElementById('mobile-sort-btn');
  const mobileSortLabel = document.getElementById('mobile-sort-label');
  const mobileSortMenu = document.getElementById('mobile-sort-menu');
  const filtersAside = document.getElementById('catalog-filters');
  const filtersCloseBtn = document.getElementById('filters-close-btn');

  if (!listRoot) return;

  let state = readState();

  const listView = new ListView(listRoot, {
    onRetry: () => load(),
  });

  const detailsView = new DetailsView(viewContainer);

  const paginator = new Paginator(paginationRoot, {
    onChange: (newPage) => {
      state = { ...state, page: newPage };
      writeState(state);
      load();
      window.scrollTo({ top: listRoot.offsetTop - 80, behavior: 'smooth' });
    },
  });

  function syncControls(s) {
    if (searchInput) searchInput.value = s.q || '';
    if (sortSelect) sortSelect.value = `${s.sort}:${s.order}`;

    if (domainInputs.length) {
      domainInputs.forEach((input) => {
        if (!s.domain) {
          input.checked = false;
        } else {
          input.checked = s.domain.split(',').includes(input.value);
        }
      });
    }

    if (levelInputs.length) {
      levelInputs.forEach((input) => {
        if (!s.level) {
          input.checked = false;
        } else {
          input.checked = s.level.split(',').includes(input.value);
        }
      });
    }

    // Sync mobile sort options and button label
    const currentSortVal = `${s.sort}:${s.order}`;
    if (mobileSortMenu) {
      mobileSortMenu.querySelectorAll('[data-sort-val]').forEach((opt) => {
        const isActive = opt.dataset.sortVal === currentSortVal;
        opt.classList.toggle('mobile-sort-menu__option--active', isActive);
        if (isActive && mobileSortLabel) {
          const cleanText = opt.textContent.replace(/^✓\s*/, '').trim();
          mobileSortLabel.textContent = `Sort: ${cleanText}`;
        }
      });
    }

    // Sync mobile filter badge count
    let activeFiltersCount = 0;
    if (s.domain) activeFiltersCount += s.domain.split(',').filter(Boolean).length;
    if (s.level) activeFiltersCount += s.level.split(',').filter(Boolean).length;
    if (mobileFiltersLabel) {
      mobileFiltersLabel.textContent = activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Filters';
    }
  }

  async function load() {
    listView.renderLoading(state.limit || 6);

    try {
      const data = await itemService.getList({
        q: state.q,
        level: state.level,
        domain: state.domain,
        sort: state.sort,
        order: state.order,
        page: state.page,
        limit: state.limit,
      });

      listView.render(data.items);
      paginator.render(data);

      if (countEl) {
        countEl.textContent = `Showing ${data.items.length} of ${data.total} courses`;
      }
    } catch (error) {
      listView.renderError(
        error.message || 'Could not connect to API server. Please make sure json-server is running on port 3001.',
      );
      if (countEl) {
        countEl.textContent = 'Showing 0 courses';
      }
    }
  }

  // Search with debounce 300ms
  const DEBOUNCE_MS = 300;
  let searchTimer;
  searchInput?.addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state = { ...state, q: event.target.value.trim(), page: 1 };
      writeState(state);
      load();
    }, DEBOUNCE_MS);
  });

  // Sort dropdown
  sortSelect?.addEventListener('change', (event) => {
    const [sort, order] = event.target.value.split(':');
    state = { ...state, sort, order, page: 1 };
    writeState(state);
    load();
  });

  // Domain checkboxes filter
  domainInputs.forEach((cb) => {
    cb.addEventListener('change', () => {
      const checked = [...domainInputs].filter((c) => c.checked).map((c) => c.value);
      state = { ...state, domain: checked.join(','), page: 1 };
      writeState(state);
      load();
    });
  });

  // Level checkboxes filter
  levelInputs.forEach((cb) => {
    cb.addEventListener('change', () => {
      const checked = [...levelInputs].filter((c) => c.checked).map((c) => c.value);
      state = { ...state, level: checked.join(','), page: 1 };
      writeState(state);
      load();
    });
  });

  // Mobile filters toggle
  mobileFiltersBtn?.addEventListener('click', () => {
    const isOpen = filtersAside?.classList.toggle('filters--mobile-open');
    mobileFiltersBtn.setAttribute('aria-expanded', String(isOpen));
    mobileFiltersBtn.classList.toggle('catalog-mobile-actions__btn--active', isOpen);
    if (isOpen && mobileSortMenu?.classList.contains('is-open')) {
      mobileSortMenu.classList.remove('is-open');
      mobileSortMenu.setAttribute('hidden', '');
      mobileSortBtn?.setAttribute('aria-expanded', 'false');
      mobileSortBtn?.classList.remove('catalog-mobile-actions__btn--active');
    }
  });

  filtersCloseBtn?.addEventListener('click', () => {
    filtersAside?.classList.remove('filters--mobile-open');
    mobileFiltersBtn?.setAttribute('aria-expanded', 'false');
    mobileFiltersBtn?.classList.remove('catalog-mobile-actions__btn--active');
  });

  // Mobile sort menu toggle
  mobileSortBtn?.addEventListener('click', () => {
    const isHidden = mobileSortMenu?.hasAttribute('hidden');
    if (isHidden) {
      mobileSortMenu?.removeAttribute('hidden');
      mobileSortMenu?.classList.add('is-open');
      mobileSortBtn.setAttribute('aria-expanded', 'true');
      mobileSortBtn.classList.add('catalog-mobile-actions__btn--active');
      if (filtersAside?.classList.contains('filters--mobile-open')) {
        filtersAside.classList.remove('filters--mobile-open');
        mobileFiltersBtn?.setAttribute('aria-expanded', 'false');
        mobileFiltersBtn?.classList.remove('catalog-mobile-actions__btn--active');
      }
    } else {
      mobileSortMenu?.setAttribute('hidden', '');
      mobileSortMenu?.classList.remove('is-open');
      mobileSortBtn.setAttribute('aria-expanded', 'false');
      mobileSortBtn.classList.remove('catalog-mobile-actions__btn--active');
    }
  });

  // Mobile sort options selection
  mobileSortMenu?.addEventListener('click', (event) => {
    const opt = event.target.closest('[data-sort-val]');
    if (!opt || !sortSelect) return;
    sortSelect.value = opt.dataset.sortVal;
    mobileSortMenu.setAttribute('hidden', '');
    mobileSortMenu.classList.remove('is-open');
    mobileSortBtn?.setAttribute('aria-expanded', 'false');
    mobileSortBtn?.classList.remove('catalog-mobile-actions__btn--active');
    sortSelect.dispatchEvent(new Event('change'));
  });

  // Popstate navigation (browser Back / Forward buttons)
  window.addEventListener('popstate', () => {
    state = readState();
    syncControls(state);
    load();
  });

  // Optimistic Toggleable Likes with Rollback (Bonus)
  listRoot.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="like"]');
    if (!button || button.disabled) return;

    const card = button.closest('[data-id]');
    if (!card) return;

    const id = Number(card.dataset.id);
    const counterEl = button.querySelector('span') || button;
    const previousLikes = Number(button.dataset.likes ?? counterEl.textContent.replace(/\D/g, ''));
    const wasLiked = button.classList.contains('is-liked') || button.dataset.liked === 'true';
    const nextLiked = !wasLiked;
    const nextLikes = nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1);

    // 1. Instant optimistic UI update & localStorage update
    button.disabled = true;
    button.dataset.likes = String(nextLikes);
    button.dataset.liked = String(nextLiked);
    button.setAttribute('aria-pressed', String(nextLiked));
    button.setAttribute('aria-label', `${nextLiked ? 'Unlike' : 'Like'} ${card.querySelector('.course-card__title')?.textContent?.trim() || 'course'}`);
    button.classList.toggle('course-card__like--active', nextLiked);
    button.classList.toggle('is-liked', nextLiked);
    counterEl.textContent = String(nextLikes);
    likesStorage.setLiked(id, nextLiked);

    try {
      // 2. Persist to API
      const updated = await itemService.setLikes(id, nextLikes);
      button.dataset.likes = String(updated.likes);
      counterEl.textContent = String(updated.likes);
    } catch (error) {
      // 3. Rollback UI and localStorage on network / server error
      button.dataset.likes = String(previousLikes);
      button.dataset.liked = String(wasLiked);
      button.setAttribute('aria-pressed', String(wasLiked));
      button.classList.toggle('course-card__like--active', wasLiked);
      button.classList.toggle('is-liked', wasLiked);
      counterEl.textContent = String(previousLikes);
      likesStorage.setLiked(id, wasLiked);
      alert(`Could not update like for course #${id} (${error.message}). Rolling back.`);
    } finally {
      button.disabled = false;
    }
  });

  // HashRouter integration (#/list, #/item/:id)
  new HashRouter(
    [
      {
        path: '/list',
        handler: () => {
          if (viewContainer) {
            viewContainer.innerHTML = `
              <ul id="courses-list" class="course-grid" role="list" aria-live="polite"></ul>
              <nav id="pagination" class="pagination" aria-label="Catalog pagination"></nav>
            `;
            initCatalog();
          }
        },
      },
      {
        path: '/item/:id',
        handler: async (id) => {
          listView.renderLoading(1);
          try {
            const course = await itemService.getById(id);
            detailsView.render(course);
          } catch {
            detailsView.renderNotFound();
          }
        },
      },
    ],
    {
      notFound: () => detailsView.renderNotFound(),
    },
  );

  syncControls(state);
  load();
}

document.addEventListener('DOMContentLoaded', initCatalog);
