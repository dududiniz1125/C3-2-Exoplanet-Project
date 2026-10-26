import { defineConfig } from 'vite';

// The build is a single classic script (IIFE) with relative paths, so dist/
// works from any host or sub-folder, and also when index.html is opened
// straight from disk (browsers block ES modules on file:// URLs).
function classicScript() {
  return {
    name: 'classic-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, '<script defer')
        .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"');
    },
  };
}

export default defineConfig({
  base: './',
  server: { host: true },
  plugins: [classicScript()],
  build: {
    target: 'es2020',
    modulePreload: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
});
