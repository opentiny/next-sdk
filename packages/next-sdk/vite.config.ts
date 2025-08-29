import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: 'WebMCP',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`
    }
  }
})
