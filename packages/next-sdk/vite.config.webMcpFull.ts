import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'WebMcp.ts',
      name: 'WebMCP',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `webmcp-full.${format}.js`
    }
  }
})
