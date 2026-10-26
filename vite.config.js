import { defineConfig } from 'vite';

// base: './' makes the built dist/ folder work from any sub-path or host.
export default defineConfig({
  base: './',
  server: { host: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
});
