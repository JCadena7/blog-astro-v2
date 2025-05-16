// Solo usa data-theme en <html> y sincroniza correctamente el selector, localStorage y CSS

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('preferred-theme', theme);

  // Manejar clase 'dark' para Tailwind
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (theme === 'auto') {
    // Se decide en applyAutoTheme
    applyAutoTheme();
  }

  // Actualizar botones activos
  const themeLight = document.getElementById('theme-light');
  const themeDark = document.getElementById('theme-dark');
  const themeAuto = document.getElementById('theme-auto');
  if (themeLight) themeLight.classList.toggle('active', theme === 'light');
  if (themeDark) themeDark.classList.toggle('active', theme === 'dark');
  if (themeAuto) themeAuto.classList.toggle('active', theme === 'auto');
}

function applyAutoTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('preferred-theme') || 'auto';
  if (savedTheme === 'auto') {
    applyAutoTheme();
    if (document.getElementById('theme-auto')) document.getElementById('theme-auto').classList.add('active');
  } else {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (document.getElementById('theme-light')) document.getElementById('theme-light').classList.add('active');
    if (document.getElementById('theme-dark')) document.getElementById('theme-dark').classList.add('active');
  }
  // Escuchar cambios en la preferencia del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('preferred-theme') === 'auto') {
      applyAutoTheme();
    }
  });
}

function setupThemeListeners() {
  document.getElementById('theme-light')?.addEventListener('click', () => setTheme('light'));
  document.getElementById('theme-dark')?.addEventListener('click', () => setTheme('dark'));
  document.getElementById('theme-auto')?.addEventListener('click', () => setTheme('auto'));
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeListeners();
});

 