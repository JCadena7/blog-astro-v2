import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    hmr: {
      clientPort: 4321
    },
    watch: {
      usePolling: true
    },
    strictPort: true,
    allowedHosts: ['.loca.lt', 'localhost']
  }
}); 