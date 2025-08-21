import QRCode from 'qrcode'

class QrCode {
  private value: string
  private size: number
  private margin: number

  constructor(value: string, options?: { size?: number; margin?: number }) {
    this.value = value
    this.size = options?.size ?? 200
    this.margin = options?.margin ?? 4
  }

  /**
   * 生成二维码的 Data URL（base64 图片）
   */
  async toDataURL(): Promise<string> {
    // 动态导入 qrcode 库，避免打包体积过大
    return QRCode.toDataURL(this.value, {
      width: this.size,
      margin: this.margin
    })
  }

  /**
   * 渲染二维码到指定的 canvas 元素
   */
  async toCanvas(canvas: HTMLCanvasElement): Promise<void> {
    return QRCode.toCanvas(canvas, this.value, {
      width: this.size,
      margin: this.margin
    })
  }

  /**
   * 渲染二维码到指定的 img 元素
   */
  async toImage(img: HTMLImageElement): Promise<void> {
    const url = await this.toDataURL()
    img.src = url
  }
}

export const createQrCode = (value: string, options?: { size?: number; margin?: number }) => {
  return new QrCode(value, options)
}
