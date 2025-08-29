import { defineConfig } from 'vite'
import { getPackageVersion } from './script/utils'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'McpSdk.ts',
      name: 'MCPSDK',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        const version = getPackageVersion('@modelcontextprotocol/sdk')
        return `mcpsdk@${version}.${format}.js`
      }
    }
  }
})
