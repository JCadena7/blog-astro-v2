// Función para establecer el tema
function setTheme(theme) {
  // Asignar el tema al elemento HTML
  document.documentElement.setAttribute('data-theme', theme);
  
  // Guardar en localStorage
  localStorage.setItem('preferred-theme', theme);
  
  // Actualizar botones activos
  const themeLight = document.getElementById('theme-light');
  const themeDark = document.getElementById('theme-dark');
  const themeAuto = document.getElementById('theme-auto');
  
  if (themeLight) themeLight.classList.toggle('active', theme === 'light');
  if (themeDark) themeDark.classList.toggle('active', theme === 'dark');
  if (themeAuto) themeAuto.classList.toggle('active', theme === 'auto');
}

// Función para aplicar el tema automático
function applyAutoTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

// Función para inicializar el tema
function initTheme() {
  // Obtener tema guardado
  const savedTheme = localStorage.getItem('preferred-theme') || 'auto';
  
  // Aplicar tema inicial
  if (savedTheme === 'auto') {
    applyAutoTheme();
    const themeAuto = document.getElementById('theme-auto');
    if (themeAuto) themeAuto.classList.add('active');
  } else {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
      const themeLight = document.getElementById('theme-light');
      if (themeLight) themeLight.classList.add('active');
    } else if (savedTheme === 'dark') {
      const themeDark = document.getElementById('theme-dark');
      if (themeDark) themeDark.classList.add('active');
    }
  }
  
  // Escuchar cambios en la preferencia del sistema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (localStorage.getItem('preferred-theme') === 'auto') {
      applyAutoTheme();
    }
  });
}

// Función para agregar event listeners a los botones de tema
function setupThemeListeners() {
  const themeLight = document.getElementById('theme-light');
  const themeDark = document.getElementById('theme-dark');
  const themeAuto = document.getElementById('theme-auto');
  
  if (themeLight) {
    themeLight.addEventListener('click', () => setTheme('light'));
  }
  
  if (themeDark) {
    themeDark.addEventListener('click', () => setTheme('dark'));
  }
  
  if (themeAuto) {
    themeAuto.addEventListener('click', () => {
      setTheme('auto');
      applyAutoTheme();
    });
  }
}

// Función para aplica el tema instantáneamente (evitar parpadeo)
function applyThemeInstantly() {
  const savedTheme = localStorage.getItem('preferred-theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Auto theme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

// Script inmediato para evitar parpadeo de tema
(function() {
  applyThemeInstantly();
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeListeners();
});

// Re-inicializar cuando Astro navegue entre páginas
document.addEventListener('astro:page-load', () => {
  setupThemeListeners();
});

// Exportar funciones para uso en otros scripts
export { setTheme, applyAutoTheme, initTheme, setupThemeListeners }; 