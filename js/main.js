/* ============================================
   BCG LAW — main.js
   Handles contact form submission via fetch
   to the Node.js/Express backend on /contact
============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form      = document.getElementById('contact-form');
  const btn       = document.getElementById('form-btn');
  const successEl = document.getElementById('form-success');
  const errorEl   = document.getElementById('form-error');

  if (!form) return;

  /* --- Simple client-side validation --- */
  function validateForm(data) {
    let valid = true;

    // Clear previous error states
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.classList.remove('error');
    });

    const required = ['fname', 'lname', 'email', 'service', 'message'];
    required.forEach(name => {
      const el = form.elements[name];
      if (!el.value.trim()) {
        el.classList.add('error');
        valid = false;
      }
    });

    // Basic email format check
    const emailEl = form.elements['email'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailEl.value && !emailRegex.test(emailEl.value)) {
      emailEl.classList.add('error');
      valid = false;
    }

    return valid;
  }

  /* --- Form submit handler --- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide any previous messages
    successEl.style.display = 'none';
    errorEl.style.display   = 'none';

    const data = {
      fname:   form.elements['fname'].value.trim(),
      lname:   form.elements['lname'].value.trim(),
      email:   form.elements['email'].value.trim(),
      phone:   form.elements['phone'].value.trim(),
      service: form.elements['service'].value,
      message: form.elements['message'].value.trim()
    };

    if (!validateForm(data)) {
      errorEl.textContent  = 'Please fill in all required fields correctly.';
      errorEl.style.display = 'block';
      return;
    }

    // Disable button while sending
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        successEl.style.display = 'block';
        form.reset();
      } else {
        errorEl.textContent   = result.message || 'Something went wrong. Please try again.';
        errorEl.style.display = 'block';
      }

    } catch (err) {
      console.error('Form submission error:', err);
      errorEl.textContent   = 'Could not connect to the server. Please call us directly on 0800 83 83 83.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Send enquiry';
    }
  });

  /* --- Remove error highlight on input --- */
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });

});

/* --- Mobile nav toggle --- */
const navToggle = document.getElementById('nav-toggle');
const headerNav = document.getElementById('header-nav');

if (navToggle && headerNav) {

  // Open/close the main menu
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    headerNav.classList.toggle('open');
  });

  // Open/close the services dropdown on mobile
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  dropdownToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const dropdown = btn.nextElementSibling;
      btn.classList.toggle('open');
      dropdown.classList.toggle('open');
    });
  });

  // Close menu when a link is clicked
  headerNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      headerNav.classList.remove('open');
    });
  });

}