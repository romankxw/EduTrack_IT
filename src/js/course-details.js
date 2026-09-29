// src/js/course-details.js
// Dynamically populates course-details.html based on ?id= URL parameter
import { itemService } from '../services/ItemService.js';

async function fetchCourse(id) {
  try {
    return await itemService.getById(id);
  } catch {
    return null;
  }
}

async function initCourseDetails() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id') || '1';

  const course = await fetchCourse(courseId);
  if (!course) return;

  const imgKey = course.slug || course.imagePrefix || course.id;

  // Title and breadcrumb
  document.title = `${course.title} — EduTrack IT`;
  const breadcrumbEl = document.getElementById('breadcrumb-title');
  if (breadcrumbEl) breadcrumbEl.textContent = course.title;

  // Category badge
  const categoryEl = document.getElementById('course-category');
  if (categoryEl) categoryEl.textContent = course.category || course.domain || 'Technology';

  // Heading title
  const titleEl = document.getElementById('course-title');
  if (titleEl) titleEl.textContent = course.title;

  // Quick stats
  const durationEl = document.getElementById('course-duration');
  if (durationEl) durationEl.textContent = course.duration || `${course.durationHours || 40} Hours`;

  const levelEl = document.getElementById('course-level');
  if (levelEl) {
    const lvl = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'All Levels';
    levelEl.textContent = lvl;
  }

  // Rating and reviews count formatting
  const ratingEl = document.getElementById('course-rating');
  if (ratingEl) {
    const ratingVal = course.rating != null ? Number(course.rating).toFixed(1) : '4.8';
    let reviewsDisplay = course.reviewsCount;
    if (!reviewsDisplay) {
      if (typeof course.reviews === 'string' || typeof course.reviews === 'number') {
        reviewsDisplay = String(course.reviews);
      } else if (Array.isArray(course.reviews) && course.reviews.length > 0) {
        reviewsDisplay = `${course.reviews.length * 150}+`;
      } else {
        reviewsDisplay = '480';
      }
    }
    ratingEl.textContent = `★ ${ratingVal} (${reviewsDisplay})`;
    ratingEl.setAttribute('aria-label', `${ratingVal} out of 5, ${reviewsDisplay} reviews`);
  }

  // Description / summary
  const descEl = document.getElementById('course-description');
  if (descEl && course.summary) {
    descEl.textContent = course.summary;
  }

  // Price
  const priceEl = document.getElementById('course-price');
  if (priceEl) priceEl.textContent = `$${course.price}`;

  const origPriceEl = document.getElementById('course-original-price');
  if (origPriceEl) origPriceEl.textContent = `$${course.price + 100}`;

  // Enroll button
  const enrollBtn = document.getElementById('enroll-btn');
  if (enrollBtn) {
    enrollBtn.href = `enrollment.html?id=${course.id}`;
  }

  // Hero picture (with responsive sources)
  const pictureEl = document.getElementById('course-picture');
  if (pictureEl) {
    pictureEl.innerHTML = `
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcset="img/${imgKey}-640.webp 640w, img/${imgKey}-640.webp 1280w"
        sizes="(min-width: 1280px) 760px, calc(100vw - 2rem)"
      >
      <source
        media="(min-width: 768px)"
        srcset="img/${imgKey}-640.jpg 640w, img/${imgKey}-640.jpg 1280w"
        sizes="(min-width: 1280px) 760px, calc(100vw - 2rem)"
      >
      <source type="image/webp" srcset="img/${imgKey}-380.webp">
      <img
        src="img/${imgKey}-380.jpg"
        width="760"
        height="428"
        alt="${course.title} — course cover"
        loading="eager"
        fetchpriority="high"
      >
    `;
  }

  // Render student reviews if present (loaded via ?_embed=reviews)
  const reviewsContainer = document.getElementById('course-reviews-list');
  if (reviewsContainer && Array.isArray(course.reviews) && course.reviews.length > 0) {
    reviewsContainer.innerHTML = course.reviews.map((r) => {
      const stars = '★'.repeat(Math.round(r.rating || 5)) + '☆'.repeat(5 - Math.round(r.rating || 5));
      return `
        <article class="course-review" role="listitem">
          <header class="course-review__header">
            <strong class="course-review__author">${r.author || 'Verified Student'}</strong>
            <span class="course-review__stars" aria-label="${r.rating || 5} out of 5 stars">${stars}</span>
            <time class="course-review__date">${r.date || '2026-03'}</time>
          </header>
          <p class="course-review__text">${r.text}</p>
        </article>
      `;
    }).join('');
  }
}

document.addEventListener('DOMContentLoaded', initCourseDetails);
