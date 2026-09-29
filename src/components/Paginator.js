// src/components/Paginator.js
// Accessible, responsive pagination with smart windowing for mobile

export class Paginator {
  constructor(root, { onChange } = {}) {
    this.root = root;
    this.onChange = onChange;

    this.root.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-page]');
      if (button && !button.disabled && this.onChange) {
        this.onChange(Number(button.dataset.page));
      }
    });
  }

  generatePages(current, total) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items = [];
    const left = Math.max(1, current - 1);
    const right = Math.min(total, current + 1);

    items.push(1);

    if (left > 2) {
      items.push('...');
    }

    for (let p = Math.max(2, left); p <= Math.min(total - 1, right); p++) {
      items.push(p);
    }

    if (right < total - 1) {
      items.push('...');
    }

    if (total > 1) {
      items.push(total);
    }

    return items;
  }

  render({ page, total, limit }) {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) {
      this.root.innerHTML = '';
      return;
    }

    const createButton = (targetPage, label, disabled = false, isCurrent = false) => `
      <li>
        <button
          type="button"
          class="pagination__link${isCurrent ? ' pagination__link--active' : ''}"
          data-page="${targetPage}"
          ${disabled ? 'disabled' : ''}
          ${isCurrent ? 'aria-current="page"' : ''}
          aria-label="${typeof label === 'string' ? `${label} page` : `Page ${label}`}"
        >
          ${label}
        </button>
      </li>
    `;

    const pageElements = this.generatePages(page, pages).map((p) => {
      if (p === '...') {
        return '<li><span class="pagination__ellipsis" aria-hidden="true">&hellip;</span></li>';
      }
      return createButton(p, p, false, p === page);
    });

    this.root.innerHTML = `
      <ul class="pagination__list" role="list">
        ${createButton(page - 1, 'Prev', page === 1, false)}
        ${pageElements.join('')}
        ${createButton(page + 1, 'Next', page === pages, false)}
      </ul>
    `;
  }
}
