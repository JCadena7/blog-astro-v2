// Este script se ejecuta inmediatamente y se inserta en el head
// para evitar el parpadeo de tema (FOUC - Flash of Unstyled Content)
(function() {
  try {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Auto theme based on user preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  } catch (e) {
    console.error('Error al aplicar el tema inicial:', e);
  }
})(); 