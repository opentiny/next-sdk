import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill'
import { isBrowser } from '../utils/env'

/** `@mcp-b/webmcp-polyfill` 在 StrictWebMCPContext 上打的标记 */
const POLYFILL_MARKER = '__isWebMCPPolyfill'

interface InitializeBuiltinWebMCPOptions {
  /**
   * 强制安装 JS polyfill，覆盖 Chromium 实验性原生 `document.modelContext`。
   * 原生 `getTools()` / `registerTool()` 在部分 Chrome Origin Trial 版本会通过
   * Mojo IPC 触发 `RESULT_CODE_KILLED_BAD_MESSAGE` 杀掉渲染进程。
   *
   * `@mcp-b/webmcp-polyfill` 见 native 即 no-op，且已删除 `forceOverride`。
   * 5.x 把 getter 装在 `Document.prototype`：若原型已有 native，polyfill 不会替换它。
   * SDK 会先摘掉 document（含可配置原型）上的 native，再安装 JS polyfill。
   * 仅在确认原生实现可用时设为 `false`。
   *
   * @default true
   */
  forcePolyfill?: boolean
}

type ModelContextHost = {
  modelContext?: unknown
}

function isWebMCPPolyfill(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && POLYFILL_MARKER in value && (value as Record<string, unknown>)[POLYFILL_MARKER])
}

function readModelContext(target: ModelContextHost): unknown {
  try {
    return target.modelContext
  } catch {
    return undefined
  }
}

function readDescriptorValue(desc: PropertyDescriptor, receiver: object): unknown {
  try {
    if (typeof desc.get === 'function') return desc.get.call(receiver)
    return desc.value
  } catch {
    return undefined
  }
}

function defineModelContext(target: object, value: unknown): boolean {
  try {
    Object.defineProperty(target, 'modelContext', {
      value,
      configurable: true,
      writable: true,
      enumerable: true
    })
    return true
  } catch {
    try {
      if (value === undefined) {
        delete (target as ModelContextHost).modelContext
        return true
      }
      ;(target as ModelContextHost).modelContext = value
      return true
    } catch {
      return false
    }
  }
}

/**
 * 摘掉 document 上的 native：可配置的原型属性直接删除，让 5.x 自己安装 getter；
 * 实例上的 native 影子化为 undefined，避免 `if (doc.modelContext) return` 提前退出。
 */
function neutralizeNativeDocumentModelContext(): void {
  const doc = typeof document !== 'undefined' ? (document as Document & ModelContextHost) : null
  if (!doc) return
  if (isWebMCPPolyfill(readModelContext(doc))) return

  const protoDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'modelContext')
  if (protoDesc?.configurable) {
    const protoValue = readDescriptorValue(protoDesc, doc)
    if (protoValue && !isWebMCPPolyfill(protoValue)) {
      Reflect.deleteProperty(Document.prototype, 'modelContext')
    }
  }

  const current = readModelContext(doc)
  if (current && !isWebMCPPolyfill(current)) {
    defineModelContext(doc, undefined)
  }
}

/**
 * 初始化后若实例上的 undefined 影子挡住了 polyfill 刚装上的原型 getter，则删掉影子。
 * 若原型 native 不可配置、删不掉，则继续影子化，避免走到 native getTools。
 */
function revealPolyfillOnDocument(): void {
  const doc = typeof document !== 'undefined' ? (document as Document & ModelContextHost) : null
  if (!doc) return
  if (isWebMCPPolyfill(readModelContext(doc))) return

  if (Object.prototype.hasOwnProperty.call(doc, 'modelContext')) {
    try {
      delete doc.modelContext
    } catch {
      /* ignore */
    }
  }

  if (isWebMCPPolyfill(readModelContext(doc))) return

  const current = readModelContext(doc)
  if (current && !isWebMCPPolyfill(current)) {
    defineModelContext(doc, undefined)
  }
}

/**
 * 摘除 navigator（及 Navigator.prototype）上的 modelContext getter。
 *
 * WebMCP 2026-05-27 草案将 modelContext 从 Navigator 迁移到了 Document。
 * @mcp-b/webmcp-polyfill@5.1.0 为兼容旧版在 navigator 上挂载了带 warn 的 getter；
 * 但其 initializeWebMCPPolyfill() 内部直接访问了 `nav.modelContext` 探测旧规范原生实现。
 * 若环境中已挂有该 getter，此属性访问会触发自身警告且误走分支。
 * 在安装前先清除该 getter，由 polyfill 在初始化末尾重新建立旧版兼容 alias。
 */
function neutralizeDeprecatedNavigatorModelContext(): void {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & ModelContextHost) : null
  if (!nav) return

  const targets = [nav, Object.getPrototypeOf(nav)].filter(Boolean)
  for (const target of targets) {
    const desc = Object.getOwnPropertyDescriptor(target, 'modelContext')
    if (desc?.get && desc.configurable) {
      Reflect.deleteProperty(target, 'modelContext')
    }
  }
}

export const initializeBuiltinWebMCP = (options?: InitializeBuiltinWebMCPOptions) => {
  if (!isBrowser()) return

  // 若 document 上已存在合格的 JS polyfill，直接幂等返回，无需重复执行安装
  const currentCtx = readModelContext(document as Document & ModelContextHost)
  if (isWebMCPPolyfill(currentCtx)) return

  const forcePolyfill = options?.forcePolyfill !== false

  try {
    neutralizeDeprecatedNavigatorModelContext()

    if (!forcePolyfill) {
      initializeWebMCPPolyfill()
      return
    }

    neutralizeNativeDocumentModelContext()
    initializeWebMCPPolyfill()
    revealPolyfillOnDocument()

    const ctx = readModelContext(document as Document & ModelContextHost)
    if (!isWebMCPPolyfill(ctx)) {
      console.warn(
        '[next-sdk] 未能覆盖原生 document.modelContext，getTools/registerTool 可能触发 Chromium 渲染进程崩溃'
      )
    }
  } catch (err) {
    console.warn('[next-sdk] 自动注入 modelContext polyfill 失败:', err)
  }
}

