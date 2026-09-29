// src/views/FormView.js
export class FormView {
  constructor(form, { service, storageKey = 'draft:enrollment' } = {}) {
    this.form = form;
    this.service = service;
    this.storageKey = storageKey;

    if (this.form) {
      this.form.setAttribute('novalidate', '');
      this.restoreDraft();
      this.form.addEventListener('input', () => this.saveDraft());
      this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    }
  }

  fields() {
    return [...this.form.elements].filter((el) => el.name);
  }

  values() {
    return Object.fromEntries(new FormData(this.form).entries());
  }

  saveDraft() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.values()));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  restoreDraft() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      this.fields().forEach((el) => {
        if (draft[el.name] !== undefined) {
          if (el.type === 'checkbox') {
            el.checked = Boolean(draft[el.name]);
          } else {
            el.value = draft[el.name];
          }
        }
      });
    } catch {
      // Invalid JSON in localStorage
    }
  }

  showError(field, message) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    const box = this.form.querySelector(`[data-error-for="${field.name}"]`);
    if (box) {
      box.textContent = message;
    }
  }

  validate() {
    let firstInvalid = null;
    this.fields().forEach((field) => {
      const valid = field.checkValidity();
      this.showError(field, valid ? '' : this.messageFor(field));
      if (!valid && !firstInvalid) {
        firstInvalid = field;
      }
    });

    firstInvalid?.focus();
    return !firstInvalid;
  }

  messageFor(field) {
    const v = field.validity;
    if (v.valueMissing) return 'This field is required.';
    if (v.typeMismatch) return 'Please enter a valid value.';
    if (v.patternMismatch) return field.title || 'Please match the requested format.';
    if (v.tooShort) return `Minimum ${field.minLength} characters.`;
    if (v.tooLong) return `Maximum ${field.maxLength} characters.`;
    return 'Invalid value.';
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (!this.validate()) return;

    const submit = this.form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;

    const statusEl = this.form.querySelector('[data-status]')
      || document.getElementById('enrollment-status');

    try {
      if (this.service) {
        await this.service.createEnrollment(this.values());
      }
      localStorage.removeItem(this.storageKey);
      this.form.reset();

      if (statusEl) {
        statusEl.className = 'form-status form-status--success';
        statusEl.textContent = 'Enrollment successful! Our mentors will contact you shortly.';
      }
    } catch (error) {
      if (statusEl) {
        statusEl.className = 'form-status form-status--error';
        statusEl.textContent = error.message || 'Submission failed. Please check your connection and try again.';
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  }
}
