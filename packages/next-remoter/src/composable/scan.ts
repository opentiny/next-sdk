import { ref, Ref } from 'vue'

// 扫码结果接口定义
export interface ScanResult {
  text: string
  format?: string
  timestamp: number
}

// 扫码错误接口定义
export interface ScanError {
  code: string
  message: string
  timestamp: number
}

// 扫码配置选项
export interface ScanOptions {
  facingMode?: 'environment' | 'user' // 摄像头朝向：后置/前置
  width?: number // 视频宽度
  height?: number // 视频高度
  aspectRatio?: number // 宽高比
}

// 扫码状态枚举
export enum ScanStatus {
  IDLE = 'idle', // 空闲状态
  SCANNING = 'scanning', // 扫码中
  SUCCESS = 'success', // 扫码成功
  ERROR = 'error', // 扫码错误
  PERMISSION_DENIED = 'permission_denied' // 权限被拒绝
}

// 扫码组合式函数
export const useScan = () => {
  // 响应式状态
  const status = ref<ScanStatus>(ScanStatus.IDLE)
  const result = ref<ScanResult | null>(null)
  const error = ref<ScanError | null>(null)
  const isSupported = ref<boolean>(false)

  // 内部变量
  let mediaStream: MediaStream | null = null
  let videoElement: HTMLVideoElement | null = null
  let canvasElement: HTMLCanvasElement | null = null
  let animationFrameId: number | null = null

  // 检查浏览器是否支持扫码功能
  const checkSupport = async (): Promise<boolean> => {
    try {
      // 检查是否支持getUserMedia API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持getUserMedia API')
      }

      // 检查是否支持Canvas API
      if (!document.createElement('canvas').getContext) {
        throw new Error('浏览器不支持Canvas API')
      }

      isSupported.value = true
      return true
    } catch (err) {
      isSupported.value = false
      error.value = {
        code: 'NOT_SUPPORTED',
        message: err instanceof Error ? err.message : '浏览器不支持扫码功能',
        timestamp: Date.now()
      }
      return false
    }
  }

  // 请求摄像头权限并开始扫码
  const startScan = async (options: ScanOptions = {}): Promise<void> => {
    try {
      // 重置状态
      status.value = ScanStatus.SCANNING
      result.value = null
      error.value = null

      // 检查支持性
      if (!(await checkSupport())) {
        status.value = ScanStatus.ERROR
        return
      }

      // 获取摄像头权限
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: options.width || 640,
          height: options.height || 480,
          aspectRatio: options.aspectRatio || 4 / 3
        }
      }

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

      // 创建视频元素
      if (!videoElement) {
        videoElement = document.createElement('video')
        videoElement.autoplay = true
        videoElement.muted = true
        videoElement.playsInline = true
      }

      // 创建Canvas元素用于图像处理
      if (!canvasElement) {
        canvasElement = document.createElement('canvas')
        canvasElement.width = options.width || 640
        canvasElement.height = options.height || 480
      }

      // 设置视频源
      videoElement.srcObject = mediaStream

      // 等待视频加载完成
      await new Promise<void>((resolve, reject) => {
        if (!videoElement) {
          reject(new Error('视频元素未创建'))
          return
        }

        videoElement.onloadedmetadata = () => resolve()
        videoElement.onerror = () => reject(new Error('视频加载失败'))

        // 设置超时
        setTimeout(() => reject(new Error('视频加载超时')), 10000)
      })

      // 开始扫码循环
      startScanLoop()
    } catch (err) {
      handleError(err)
    }
  }

  // 停止扫码
  const stopScan = (): void => {
    try {
      // 停止动画帧
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }

      // 停止媒体流
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
        mediaStream = null
      }

      // 清理视频元素
      if (videoElement) {
        videoElement.srcObject = null
        videoElement = null
      }

      // 重置状态
      status.value = ScanStatus.IDLE
    } catch (err) {
      console.error('停止扫码时发生错误:', err)
    }
  }

  // 扫码循环处理
  const startScanLoop = (): void => {
    if (!videoElement || !canvasElement) return

    const scanFrame = () => {
      try {
        // 获取Canvas上下文
        const ctx = canvasElement!.getContext('2d')
        if (!ctx) return

        // 将视频帧绘制到Canvas
        ctx.drawImage(videoElement!, 0, 0, canvasElement!.width, canvasElement!.height)

        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvasElement!.width, canvasElement!.height)

        // 尝试识别二维码/条形码
        const scanResult = detectCode(imageData)

        if (scanResult) {
          // 扫码成功
          result.value = {
            text: scanResult,
            timestamp: Date.now()
          }
          status.value = ScanStatus.SUCCESS
          stopScan()
          return
        }

        // 继续下一帧
        animationFrameId = requestAnimationFrame(scanFrame)
      } catch (err) {
        handleError(err)
      }
    }

    // 开始第一帧
    scanFrame()
  }

  // 检测二维码/条形码（简化实现，实际项目中可能需要引入专门的库）
  const detectCode = (imageData: ImageData): string | null => {
    // 这里是一个简化的实现
    // 在实际项目中，你可能需要使用专门的二维码/条形码识别库
    // 比如 jsQR, QuaggaJS 等

    // 简单的图像分析（这只是一个示例，不是真正的扫码实现）
    const { data, width, height } = imageData

    // 检查图像是否包含足够的对比度（简单的边缘检测）
    let edgeCount = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3

      // 简单的边缘检测逻辑
      if (brightness < 128) {
        edgeCount++
      }
    }

    // 如果检测到足够的边缘，假设可能包含二维码
    // 注意：这是一个非常简化的实现，实际扫码需要更复杂的算法
    if (edgeCount > width * height * 0.3) {
      // 返回一个模拟的扫码结果
      // 在实际实现中，这里应该返回真正的扫码结果
      return `模拟扫码结果_${Date.now()}`
    }

    return null
  }

  // 错误处理
  const handleError = (err: any): void => {
    let errorCode = 'UNKNOWN_ERROR'
    let errorMessage = '未知错误'

    if (err instanceof Error) {
      errorMessage = err.message

      if (err.name === 'NotAllowedError') {
        errorCode = 'PERMISSION_DENIED'
        errorMessage = '摄像头权限被拒绝'
        status.value = ScanStatus.PERMISSION_DENIED
      } else if (err.name === 'NotFoundError') {
        errorCode = 'CAMERA_NOT_FOUND'
        errorMessage = '未找到摄像头设备'
      } else if (err.name === 'NotReadableError') {
        errorCode = 'CAMERA_BUSY'
        errorMessage = '摄像头被其他应用占用'
      } else if (err.name === 'OverconstrainedError') {
        errorCode = 'CONSTRAINTS_NOT_SATISFIED'
        errorMessage = '摄像头参数不满足要求'
      }
    }

    error.value = {
      code: errorCode,
      message: errorMessage,
      timestamp: Date.now()
    }

    status.value = ScanStatus.ERROR
    stopScan()
  }

  // 清理资源
  const cleanup = (): void => {
    stopScan()
    status.value = ScanStatus.IDLE
    result.value = null
    error.value = null
  }

  // 手动设置扫码结果（用于测试或外部输入）
  const setResult = (text: string, format?: string): void => {
    result.value = {
      text,
      format,
      timestamp: Date.now()
    }
    status.value = ScanStatus.SUCCESS
  }

  // 重置状态
  const reset = (): void => {
    cleanup()
    isSupported.value = false
  }

  // 返回公共API
  return {
    // 状态
    status: status as Ref<ScanStatus>,
    result: result as Ref<ScanResult | null>,
    error: error as Ref<ScanError | null>,
    isSupported: isSupported as Ref<boolean>,

    // 方法
    checkSupport,
    startScan,
    stopScan,
    cleanup,
    setResult,
    reset
  }
}

// 导出类型和枚举，供外部使用
// 注意：类型和枚举已经在文件顶部声明，可以直接使用
