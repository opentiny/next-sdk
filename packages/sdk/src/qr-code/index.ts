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
    const QRCode = await import('qrcode')
    return QRCode.toDataURL(this.value, {
      width: this.size,
      margin: this.margin
    })
  }

  /**
   * 渲染二维码到指定的 canvas 元素
   */
  async toCanvas(canvas: HTMLCanvasElement): Promise<void> {
    const QRCode = await import('qrcode')
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

class QrCodeModal {
  private modal: HTMLDivElement | null = null
  private qrCode: QrCode | null = null

  /**
   * 打开二维码弹窗
   * @param value 二维码内容
   * @param options 二维码参数
   */
  open(value: string, options?: { size?: number; margin?: number }) {
    // 如果已存在弹窗，先关闭
    this.close()

    // 创建遮罩层
    const modal = document.createElement('div')
    modal.style.position = 'fixed'
    modal.style.top = '0'
    modal.style.left = '0'
    modal.style.width = '100vw'
    modal.style.height = '100vh'
    modal.style.background = 'rgba(0,0,0,0.4)'
    modal.style.display = 'flex'
    modal.style.alignItems = 'center'
    modal.style.justifyContent = 'center'
    modal.style.zIndex = '9999'

    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close()
      }
    })

    // 创建二维码容器
    const box = document.createElement('div')
    box.style.background = '#fff'
    box.style.padding = '24px'
    box.style.borderRadius = '8px'
    box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
    box.style.display = 'flex'
    box.style.flexDirection = 'column'
    box.style.alignItems = 'center'

    // 阻止点击内容冒泡到遮罩
    box.addEventListener('click', (e) => e.stopPropagation())

    // 创建二维码canvas
    const canvas = document.createElement('canvas')
    box.appendChild(canvas)

    // 可选：添加提示文字
    const tip = document.createElement('div')
    tip.innerText = '扫描二维码进入控制器'
    tip.style.marginTop = '12px'
    tip.style.color = '#888'
    tip.style.fontSize = '14px'
    box.appendChild(tip)

    modal.appendChild(box)
    document.body.appendChild(modal)

    // 生成二维码
    this.qrCode = new QrCode(value, options)
    this.qrCode.toCanvas(canvas)

    this.modal = modal
  }

  /**
   * 关闭弹窗
   */
  close() {
    if (this.modal) {
      document.body.removeChild(this.modal)
      this.modal = null
      this.qrCode = null
    }
  }
}

export { QrCode, QrCodeModal }
