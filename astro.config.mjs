// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import clerk from '@clerk/astro';
// import node from '@astrojs/node'; // Necesitarás instalar esto: npm install @astrojs/node
import react from '@astrojs/react'; // Añadimos la integración de React
// import { ENV } from './src/config/env.js';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless'; // o edge, según tu preferencia

// https://astro.build/config
export default defineConfig({
	site: 'https://semillerodeinvestigaciongeab.vercel.app',
	server: {
		host: true
	},
	vite: {
		server: {
			hmr: {
				clientPort: 4321
			},
			watch: {
				usePolling: true
			},
			host: true,
			strictPort: true,
			allowedHosts: ['vercel.app','.loca.lt', 'localhost']
		}
	},
	integrations: [
		mdx(), 
		sitemap(),
		clerk(),
		react(),
		tailwind()
	],
	adapter: vercel({}),
	output: 'server',
});
