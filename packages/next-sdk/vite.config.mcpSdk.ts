import { defineConfig } from 'vite'
import { getPackageVersion } from './script/utils'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据构建模式决定是否启用代码压缩
  // development 模式：不压缩，便于调试
  // production 模式：启用压缩，优化性能
  const shouldMinify = mode !== 'dev'

  console.log('mode', mode)

  return {
    build: {
      emptyOutDir: false,
      minify: shouldMinify, // 动态设置压缩配置
      lib: {
        entry: 'McpSdk.ts',
        name: 'MCPSDK',
        formats: ['es', 'umd'],
        fileName: (format) => {
          const version = getPackageVersion('@modelcontextprotocol/sdk')
          return `mcpsdk@${version}${format === 'es' ? '.es' : ''}${shouldMinify ? '' : '.dev'}.js`
        }
      }
    }
  }
})
