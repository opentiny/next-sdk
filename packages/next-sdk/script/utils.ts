import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// 获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

// 读取目标包的版本号
export function getPackageVersion(packageName: string): string {
  try {
    // 直接读取 node_modules 中目标包的 package.json 获取实际版本号
    const packagePath = resolve(__dirname, `../node_modules/${packageName}/package.json`)
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    if (packageJson.version) {
      return packageJson.version
    }

    // 如果没有找到版本号，返回默认版本
    return 'latest'
  } catch (error) {
    console.warn(`无法读取 node_modules/${packageName} 版本号，使用默认命名:`, error)
    return 'latest'
  }
}
