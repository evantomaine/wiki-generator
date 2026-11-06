import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Allow development environments to disable hot module replacement.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching alongside hot module replacement.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
