import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'WebAgent.ts',
      name: 'WebAgent',
      formats: ['es', 'umd'],
      fileName: (format) => `webagent${format === 'es' ? '.es' : ''}.js`
    }
  }
})
