import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldMinify = mode !== 'dev'

  return {
    build: {
      emptyOutDir: false,
      minify: shouldMinify,
      lib: {
        entry: 'WebMcp.ts',
        name: 'WebMCP',
        formats: ['es', 'umd'],
        fileName: (format) => `webmcp-full${format === 'es' ? '.es' : ''}${shouldMinify ? '' : '.dev'}.js`
      }
    }
  }
})
