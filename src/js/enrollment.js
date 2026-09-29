// src/js/enrollment.js
// Dynamically pre-fills enrollment.html based on ?id= and manages FormView
import { itemService } from '../services/ItemService.js';
import { FormView } from '../views/FormView.js';

async function fetchCourse(id) {
  try {
    return await itemService.getById(id);
  } catch {
    return null;
  }
}

async function initEnrollment() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id') || '1';

  const course = await fetchCourse(courseId);
  if (!course) return;

  document.title = `Enroll — ${course.title} — EduTrack IT`;

  const breadcrumbCourseLink = document.getElementById('breadcrumb-course-link');
  if (breadcrumbCourseLink) {
    breadcrumbCourseLink.href = `course-details.html?id=${course.id}`;
    breadcrumbCourseLink.textContent = course.title;
  }

  const titleEl = document.getElementById('enrollment-course-title');
  if (titleEl) titleEl.textContent = course.title;

  const metaEl = document.getElementById('enrollment-course-meta');
  if (metaEl) {
    const dur = course.duration || `${course.durationHours || 40} Hours`;
    metaEl.innerHTML = `Starts Monday &bull; ${dur} intensive`;
  }

  const priceEl = document.getElementById('enrollment-course-price');
  if (priceEl) priceEl.textContent = `$${course.price}`;

  const submitBtn = document.getElementById('enrollment-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = `Pay $${course.price} & Enroll Now`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initEnrollment();

  const formEl = document.getElementById('enrollment-form');
  if (formEl) {
    new FormView(formEl, {
      service: itemService,
      storageKey: 'draft:enrollment',
    });
  }
});
