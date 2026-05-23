const menuButton = document.getElementById('menuButton');
const siteNav = document.getElementById('siteNav');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
}
