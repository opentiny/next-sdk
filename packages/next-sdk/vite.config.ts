import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldMinify = mode !== 'dev'

  return {
    build: {
      emptyOutDir: shouldMinify,
      minify: shouldMinify,
      lib: {
        entry: 'index.ts',
        name: 'WebMCP',
        formats: ['es', 'umd'],
        fileName: (format) => `index.${format}${shouldMinify ? '' : '.dev'}.js`
      }
    }
  }
})
