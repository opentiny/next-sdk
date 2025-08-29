import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据构建模式决定是否启用代码压缩
  // development 模式：不压缩，便于调试
  // production 模式：启用压缩，优化性能
  const shouldMinify = mode !== 'dev'

  return {
    build: {
      emptyOutDir: false,
      minify: shouldMinify, // 动态设置压缩配置
      lib: {
        entry: 'WebMcp.ts',
        name: 'WebMCP',
        formats: ['es', 'umd'],
        fileName: (format) => `webmcp${format === 'es' ? '.es' : ''}${shouldMinify ? '' : '.dev'}.js`
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
  }
})
