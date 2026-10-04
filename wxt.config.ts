import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vue: {
    vite: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('s-') || tag === 'ms-icon',
        },
      },
    },
  },
  manifest: {
    permissions: ['offscreen', 'storage'],
    icons: {
      128: '/icon.png',
    },
    optional_host_permissions: [
      'https://*/*',
      'http://*/*'
    ],
  },
});
