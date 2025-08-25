import QRCodePck from 'qrcode'

/** QrCode 类的配置信息 */
export type QrCodeOption = ConstructorParameters<typeof QrCode>[1]

/**
 * 二维码工具类,根据传入的value,生成相应的二维码，并输出到 <canvas> 或  <img>上。
 * @example
 * const qr= new QrCode('https://www.baidu.com', { size: 100 })
 *
 * qr.toCanvas(canvasDom)
 * qr.toImage(imgDom)
 */
export class QrCode {
  private value: string
  private size: number
  private margin: number
  private color: string
  private bgColor: string

  constructor(value: string, { size = 200, margin = 4, color = '#000', bgColor = '#fff' }) {
    this.value = value
    this.size = size
    this.margin = margin
    this.color = color
    this.bgColor = bgColor
  }

  get qrCodeOption() {
    return {
      width: this.size,
      margin: this.margin,
      color: {
        dark: this.color, // 前景色
        light: this.bgColor // 背景色
      }
    }
  }

  /** 生成二维码的 Data URL（base64 图片） */
  async toDataURL(): Promise<string> {
    return QRCodePck.toDataURL(this.value, this.qrCodeOption)
  }

  /** 渲染二维码到指定的 canvas 元素 */
  async toCanvas(canvas: HTMLCanvasElement): Promise<void> {
    return QRCodePck.toCanvas(canvas, this.value, this.qrCodeOption)
  }

  /** 渲染二维码到指定的 img 元素 */
  async toImage(img: HTMLImageElement): Promise<void> {
    img.src = await this.toDataURL()
  }
}
