import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: ['WebMcp.ts'],
      name: 'WebMCP',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `webmcp.${format}.js`
    },
    rollupOptions: {
      external: [/@modelcontextprotocol\/sdk\//, 'zod', 'ajv'],
      output: {
        globals: {
          '@modelcontextprotocol/sdk/client/streamableHttp.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/types.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/client/index.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/client/sse.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/client/auth.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/server/mcp.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/shared/uriTemplate.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/server/completable.js': 'MCPSDK',
          '@modelcontextprotocol/sdk/shared/metadataUtils.js': 'MCPSDK',
          'zod': 'Zod',
          'ajv': 'MCPSDK'
        }
      }
    }
  }
})
