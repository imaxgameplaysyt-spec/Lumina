// Aplica el tema guardado (o el del sistema) antes de pintar la página
// para evitar el parpadeo de colores al cargar.
(function () {
  let theme = null;
  try {
    theme = localStorage.getItem('lumina-theme');
  } catch (e) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-bs-theme', theme);
})();
