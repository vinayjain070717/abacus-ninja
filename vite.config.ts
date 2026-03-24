/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { PluginOption } from 'vite';

async function vitePwa(): Promise<PluginOption | null> {
  try {
    const { VitePWA } = await import('vite-plugin-pwa');
    return VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'Abacus Master',
        short_name: 'Abacus',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    });
  } catch {
    return null;
  }
}

export default defineConfig(async () => {
  const pwa = await vitePwa();
  return {
    plugins: [react(), tailwindcss(), ...(pwa ? [pwa] : [])],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
