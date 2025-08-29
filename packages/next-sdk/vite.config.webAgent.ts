import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const shouldMinify = mode !== 'dev'

  return {
    build: {
      emptyOutDir: false,
      minify: shouldMinify,
      lib: {
        entry: 'WebAgent.ts',
        name: 'WebAgent',
        formats: ['es', 'umd'],
        fileName: (format) => `webagent${format === 'es' ? '.es' : ''}${shouldMinify ? '' : '.dev'}.js`
      }
    }
  }
})
