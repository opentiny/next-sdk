import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'WebAgent.ts',
      name: 'WebAgent',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `webagent.${format}.js`
    }
  }
})
