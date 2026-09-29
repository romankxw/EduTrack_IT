// src/views/DetailsView.js
export class DetailsView {
  constructor(root) {
    this.root = root;
  }

  render(course) {
    if (!this.root) return;
    const imgKey = course.slug || course.imagePrefix || course.id;
    const duration = course.duration || `${course.durationHours || 40} Weeks`;
    const rating = course.rating != null ? Number(course.rating).toFixed(1) : '4.8';
    const reviews = course.reviewsCount || (typeof course.reviews === 'string' ? course.reviews : (Array.isArray(course.reviews) && course.reviews.length ? `${course.reviews.length * 150}+` : '500+'));

    this.root.innerHTML = `
      <article class="course-details" aria-labelledby="course-details-title">
        <div class="course-details__thumbnail">
          <picture>
            <source media="(min-width: 768px)" type="image/webp" srcset="img/${imgKey}-640.webp 640w">
            <source media="(min-width: 768px)" srcset="img/${imgKey}-640.jpg 640w">
            <source type="image/webp" srcset="img/${imgKey}-380.webp">
            <img src="img/${imgKey}-380.jpg" width="760" height="428" alt="${course.title} — course cover">
          </picture>
        </div>
        <span class="badge">${course.category || course.domain || 'Technology'}</span>
        <h1 id="course-details-title" class="course-details__title">${course.title}</h1>
        <ul class="course-stats" role="list">
          <li><strong>Duration:</strong> <span>${duration}</span></li>
          <li><strong>Level:</strong> <span>${course.level}</span></li>
          <li><strong>Rating:</strong> <span>★ ${rating} (${reviews})</span></li>
          <li><strong>Language:</strong> <span>English</span></li>
        </ul>
        <section>
          <h2>About this course</h2>
          <p>${course.summary}</p>
        </section>
        <div style="margin-top: 24px;">
          <a href="enrollment.html?id=${course.id}" class="btn btn--primary">Enroll Now ($${course.price})</a>
          <a href="#/list" class="btn btn--secondary" style="margin-left: 12px;">Back to Catalog</a>
        </div>
      </article>
    `;
  }

  renderNotFound() {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="state state--error" role="alert">
        <h2>Course not found</h2>
        <p>The requested course does not exist.</p>
        <a href="#/list" class="btn btn--primary" style="margin-top: 16px;">Back to Catalog</a>
      </div>
    `;
  }
}
