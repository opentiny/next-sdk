import { describe, it, expect, vi, afterEach } from 'vitest'
import { initializeBuiltinWebMCP } from '../../page-tools/initialize-builtin-WebMCP'

const POLYFILL_MARKER = '__isWebMCPPolyfill'

type ModelContextHost = {
  modelContext?: unknown
}

function installFakeNative(target: object, label: string) {
  const native = {
    getTools: vi.fn(async () => {
      throw new Error(`native ${label} getTools should not be called`)
    }),
    registerTool: vi.fn(),
    executeTool: vi.fn()
  }
  Object.defineProperty(target, 'modelContext', {
    value: native,
    configurable: true,
    writable: true,
    enumerable: true
  })
  return native
}

afterEach(() => {
  // 清掉实例属性，避免用例互相污染；原型上若仍有 getter 则交回 polyfill / jsdom 默认
  try {
    delete (document as Document & ModelContextHost).modelContext
  } catch {
    /* ignore */
  }
  try {
    delete (navigator as Navigator & ModelContextHost).modelContext
  } catch {
    /* ignore */
  }
})

describe('initializeBuiltinWebMCP forcePolyfill', () => {
  it('复现：Chrome 原生 document.modelContext.getTools 会杀渲染进程 —— 前置 document 上已有非 polyfill 的伪 native；步骤 initializeBuiltinWebMCP()；期望替换为 JS polyfill 且不调用原生 getTools', async () => {
    const native = installFakeNative(document, 'document')

    initializeBuiltinWebMCP()

    const ctx = (document as Document & ModelContextHost).modelContext as {
      [key: string]: unknown
      getTools?: () => Promise<unknown[]>
    }
    expect(ctx).toBeTruthy()
    expect(ctx[POLYFILL_MARKER]).toBe(true)
    expect(ctx).not.toBe(native)
    expect(native.getTools).not.toHaveBeenCalled()

    const tools = await ctx.getTools?.()
    expect(Array.isArray(tools)).toBe(true)
    expect(native.getTools).not.toHaveBeenCalled()
  })

  it('复现：需要验证原生 API 时关闭强制 polyfill —— 前置 document 上伪 native；步骤 initializeBuiltinWebMCP({ forcePolyfill: false })；期望保留该 native', () => {
    const native = installFakeNative(document, 'opt-out')

    initializeBuiltinWebMCP({ forcePolyfill: false })

    const ctx = (document as Document & ModelContextHost).modelContext
    expect(ctx).toBe(native)
    expect((ctx as Record<string, unknown>)[POLYFILL_MARKER]).toBeUndefined()
  })

  it('已是 polyfill 时再次初始化仍保留 marker，不拆掉 JS context 且不触发告警', () => {
    const warnSpy = vi.spyOn(console, 'warn')
    try {
      initializeBuiltinWebMCP()
      const first = (document as Document & ModelContextHost).modelContext
      expect((first as Record<string, unknown>)[POLYFILL_MARKER]).toBe(true)

      initializeBuiltinWebMCP()
      const second = (document as Document & ModelContextHost).modelContext
      expect(second).toBe(first)
      expect((second as Record<string, unknown>)[POLYFILL_MARKER]).toBe(true)

      const deprecationWarnings = warnSpy.mock.calls.filter(([msg]) =>
        typeof msg === 'string' && msg.includes('[WebMCPPolyfill] navigator.modelContext is deprecated')
      )
      expect(deprecationWarnings).toHaveLength(0)
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('复现：Chromium 把 modelContext 放在 Document.prototype —— 前置原型 getter 返回伪 native；步骤默认初始化；期望实例上是 polyfill 且不调用原生 getTools', async () => {
    const native = {
      getTools: vi.fn(async () => {
        throw new Error('native prototype getTools should not be called')
      }),
      registerTool: vi.fn(),
      executeTool: vi.fn()
    }
    const previous = Object.getOwnPropertyDescriptor(Document.prototype, 'modelContext')
    Object.defineProperty(Document.prototype, 'modelContext', {
      configurable: true,
      enumerable: true,
      get() {
        return native
      }
    })
    try {
      delete (document as Document & ModelContextHost).modelContext
    } catch {
      /* ignore */
    }

    try {
      initializeBuiltinWebMCP()

      const ctx = (document as Document & ModelContextHost).modelContext as Record<string, unknown>
      expect(ctx).toBeTruthy()
      expect(ctx[POLYFILL_MARKER]).toBe(true)
      expect(ctx).not.toBe(native)
      expect(native.getTools).not.toHaveBeenCalled()
      const tools = await (ctx as { getTools: () => Promise<unknown[]> }).getTools()
      expect(Array.isArray(tools)).toBe(true)
    } finally {
      if (previous) {
        Object.defineProperty(Document.prototype, 'modelContext', previous)
      } else {
        delete (Document.prototype as ModelContextHost).modelContext
      }
    }
  })

  it('复现：navigator.modelContext getter 存在时初始化不触发自身告警且正常挂载 polyfill —— 前置 navigator 挂有带警告的兼容 getter；步骤 initializeBuiltinWebMCP()；期望无 deprecation warning 且 document.modelContext 正确安装', () => {
    const warnSpy = vi.spyOn(console, 'warn')
    delete (Document.prototype as ModelContextHost).modelContext
    delete (document as Document & ModelContextHost).modelContext

    Object.defineProperty(navigator, 'modelContext', {
      configurable: true,
      enumerable: true,
      get() {
        console.warn(
          '[WebMCPPolyfill] navigator.modelContext is deprecated. The May 27, 2026 WebMCP draft moved the modelContext getter from Navigator to Document — use document.modelContext instead. See https://github.com/webmachinelearning/webmcp/pull/184.'
        )
        return { [POLYFILL_MARKER]: true }
      }
    })

    try {
      initializeBuiltinWebMCP()

      const deprecationWarnings = warnSpy.mock.calls.filter(([msg]) =>
        typeof msg === 'string' && msg.includes('[WebMCPPolyfill] navigator.modelContext is deprecated')
      )
      expect(deprecationWarnings).toHaveLength(0)

      const docCtx = (document as Document & ModelContextHost).modelContext as Record<string, unknown>
      expect(docCtx).toBeTruthy()
      expect(docCtx[POLYFILL_MARKER]).toBe(true)
    } finally {
      warnSpy.mockRestore()
    }
  })
})

