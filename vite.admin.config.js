import { defineConfig } from 'vite';
export default defineConfig({
  base: '/', publicDir: false, esbuild: { jsx: 'automatic' },
  build: { outDir: 'build/admin-client', rollupOptions: { input: 'admin/index.html' } },
});
