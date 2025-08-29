import { defineConfig } from 'vite'
import { getPackageVersion } from './script/utils'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'Zod.ts',
      name: 'Zod',
      formats: ['es', 'umd'],
      fileName: (format) => {
        const version = getPackageVersion('zod')
        return `zod@${version}${format === 'es' ? '.es' : ''}.js`
      }
    }
  }
})
