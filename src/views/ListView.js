// src/views/ListView.js
import { likesStorage } from '../utils/likesStorage.js';

export class ListView {
  constructor(root, { onRetry } = {}) {
    this.root = root;
    this.onRetry = onRetry;
  }

  renderLoading(count = 6) {
    this.root.setAttribute('aria-busy', 'true');
    this.root.innerHTML = Array.from({ length: count })
      .map(() => '<li><div class="card--skeleton" aria-hidden="true"></div></li>')
      .join('');
  }

  renderError(message) {
    this.root.setAttribute('aria-busy', 'false');
    this.root.innerHTML = `
      <li class="state state--error" role="alert">
        <span>${message}</span>
        <button type="button" data-action="retry">Retry</button>
      </li>
    `;
    this.root.querySelector('[data-action="retry"]')
      ?.addEventListener('click', () => this.onRetry?.());
  }

  renderEmpty() {
    this.root.setAttribute('aria-busy', 'false');
    this.root.innerHTML = '<li class="state">No courses found matching your criteria. Try adjusting your search or filters.</li>';
  }

  render(items) {
    this.root.setAttribute('aria-busy', 'false');
    if (!items || !items.length) {
      this.renderEmpty();
      return;
    }
    this.root.innerHTML = items.map((item) => this.cardTemplate(item)).join('');
  }

  cardTemplate(item) {
    const imgKey = item.slug || item.imagePrefix || item.id;
    const duration = item.duration || `${item.durationHours || 40} Weeks`;
    const rating = item.rating != null ? Number(item.rating).toFixed(1) : '4.8';
    const reviewsDisplay = item.reviewsCount || (typeof item.reviews === 'string' ? item.reviews : '500+');
    const likes = item.likes ?? 0;
    const isLiked = likesStorage.isLiked(item.id);

    return `
      <li>
        <article class="course-card" data-id="${item.id}" aria-labelledby="course-${item.id}">
          <div class="course-card__thumbnail">
            <picture>
              <source
                type="image/webp"
                srcset="img/${imgKey}-380.webp 380w, img/${imgKey}-640.webp 640w"
                sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
              >
              <img
                src="img/${imgKey}-380.jpg"
                srcset="img/${imgKey}-380.jpg 380w, img/${imgKey}-640.jpg 640w"
                sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw"
                width="380"
                height="214"
                alt="${item.title} — course thumbnail"
                loading="lazy"
              >
            </picture>
          </div>
          <div class="course-card__body">
            <div class="course-card__category">
              <span class="badge">${item.category || item.domain || 'Technology'}</span>
            </div>
            <h3 id="course-${item.id}" class="course-card__title">
              <a href="course-details.html?id=${item.id}">${item.title}</a>
            </h3>
            <div class="course-card__meta">
              <span class="course-card__duration">${duration}</span>
              <span class="course-card__rating" aria-label="Rating ${rating} out of 5, ${reviewsDisplay} reviews">
                &#9733; ${rating} (${reviewsDisplay})
              </span>
            </div>
          </div>
          <div class="course-card__footer">
            <span class="course-card__price">$${item.price}</span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button
                class="course-card__like ${isLiked ? 'course-card__like--active is-liked' : ''}"
                type="button"
                data-action="like"
                data-likes="${likes}"
                data-liked="${isLiked}"
                aria-pressed="${isLiked}"
                aria-label="${isLiked ? 'Unlike' : 'Like'} ${item.title}"
              >
                ♥ <span>${likes}</span>
              </button>
              <a href="course-details.html?id=${item.id}" class="btn btn--primary btn--sm">Details</a>
            </div>
          </div>
        </article>
      </li>
    `;
  }
}
