const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitButton = document.getElementById('submitBtn');
const contactFormWrap = document.querySelector('.contact-form-wrap');

if (contactForm && submitButton) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const originalText = submitButton.textContent;
    submitButton.textContent = '送信中...';
    submitButton.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('submit failed');

      contactForm.style.display = 'none';
      contactFormWrap?.classList.add('is-success');
      formSuccess?.classList.add('show');
      formSuccess?.setAttribute('aria-hidden', 'false');
      formSuccess?.focus?.();
      contactFormWrap?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      submitButton.textContent = '送信に失敗しました。もう一度お試しください';
      submitButton.disabled = false;
      setTimeout(() => {
        submitButton.textContent = originalText;
      }, 4000);
    }
  });
}
