import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { TinyVueSingleResolver } from '@opentiny/unplugin-tiny-vue'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/next-remoter/',
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        scan: 'scan.html'
      }
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [TinyVueSingleResolver]
    }),
    AutoImport({
      resolvers: [TinyVueSingleResolver]
    }),
    svgLoader({
      defaultImport: 'component',
      svgo: false
    })
  ]
})
