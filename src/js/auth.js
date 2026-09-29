// src/js/auth.js
// Handles tab switching, accessible client-side validation, and mock auth submission

function initAuth() {
  const tabSignIn = document.getElementById('tab-signin');
  const tabRegister = document.getElementById('tab-register');
  const panelSignIn = document.getElementById('panel-signin');
  const panelRegister = document.getElementById('panel-register');
  const statusEl = document.getElementById('auth-status');

  const signInForm = document.getElementById('signin-form');
  const registerForm = document.getElementById('register-form');

  function switchTab(mode) {
    const isSignIn = mode === 'signin';

    tabSignIn?.setAttribute('aria-selected', String(isSignIn));
    tabSignIn?.classList.toggle('auth-tabs__btn--active', isSignIn);

    tabRegister?.setAttribute('aria-selected', String(!isSignIn));
    tabRegister?.classList.toggle('auth-tabs__btn--active', !isSignIn);

    if (panelSignIn) {
      if (isSignIn) {
        panelSignIn.removeAttribute('hidden');
      } else {
        panelSignIn.setAttribute('hidden', '');
      }
    }

    if (panelRegister) {
      if (!isSignIn) {
        panelRegister.removeAttribute('hidden');
      } else {
        panelRegister.setAttribute('hidden', '');
      }
    }

    if (statusEl) {
      statusEl.className = 'form-status';
      statusEl.textContent = '';
    }
  }

  tabSignIn?.addEventListener('click', () => switchTab('signin'));
  tabRegister?.addEventListener('click', () => switchTab('register'));

  function validateInput(input) {
    const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
    if (!errorEl) return true;

    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
      let msg = input.validationMessage;
      if (input.validity.valueMissing) {
        msg = 'This field is required.';
      } else if (input.validity.typeMismatch && input.type === 'email') {
        msg = 'Please enter a valid email address.';
      } else if (input.validity.tooShort) {
        msg = `Must be at least ${input.minLength} characters.`;
      }
      errorEl.textContent = msg;
      return false;
    }

    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    return true;
  }

  function setupFormValidation(form, isRegister) {
    if (!form) return;

    const inputs = form.querySelectorAll('input:not([type="checkbox"])');
    inputs.forEach((input) => {
      input.addEventListener('blur', () => validateInput(input));
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') {
          validateInput(input);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      let firstInvalid = null;

      inputs.forEach((input) => {
        const ok = validateInput(input);
        if (!ok) {
          isValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (isRegister) {
        const terms = document.getElementById('reg-terms');
        const termsError = document.querySelector('[data-error-for="reg-terms"]');
        if (terms && !terms.checked) {
          isValid = false;
          if (termsError) termsError.textContent = 'You must accept the terms to register.';
          if (!firstInvalid) firstInvalid = terms;
        } else if (termsError) {
          termsError.textContent = '';
        }
      }

      if (!isValid) {
        firstInvalid?.focus();
        return;
      }

      // Simulate successful submission
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = isRegister ? 'Create Free Account' : 'Sign In';
        }

        if (statusEl) {
          statusEl.className = 'form-status form-status--success';
          if (isRegister) {
            const name = document.getElementById('reg-name')?.value || 'Student';
            statusEl.textContent = `Account created successfully! Welcome to EduTrack IT, ${name}.`;
            form.reset();
          } else {
            const email = document.getElementById('signin-email')?.value || '';
            statusEl.textContent = `Welcome back! Signed in as ${email}.`;
          }
        }
      }, 600);
    });
  }

  setupFormValidation(signInForm, false);
  setupFormValidation(registerForm, true);
}

document.addEventListener('DOMContentLoaded', initAuth);
