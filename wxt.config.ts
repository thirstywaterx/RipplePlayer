import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
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
    permissions: ['offscreen','storage'],
  },
});
