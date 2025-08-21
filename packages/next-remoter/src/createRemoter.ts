import { createQrCode } from './createQrCode'

// 配置选项接口
interface FloatingBlockOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: number
  theme?: 'light' | 'dark'
  qrCodeUrl?: string
  onShowAIChat?: (show: boolean) => void
  sessionId?: string
}

// 动作类型
type ActionType = 'qr-code' | 'ai-chat' | 'remote-control'

class FloatingBlock {
  private options: Required<FloatingBlockOptions>
  private isExpanded: boolean
  private floatingBlock!: HTMLDivElement
  private dropdownMenu!: HTMLDivElement
  private showAIChatModal: boolean = false

  constructor(options: FloatingBlockOptions = {}) {
    this.options = {
      position: 'bottom-right', // 位置：bottom-right, bottom-left, top-right, top-left
      size: 60, // 浮动块大小
      theme: 'light', // 主题：light, dark
      ...options
    }

    this.isExpanded = false
    this.init()
  }

  private init(): void {
    this.createFloatingBlock()
    this.createDropdownMenu()
    this.bindEvents()
    this.addStyles()
  }

  private createFloatingBlock(): void {
    // 创建主浮动块
    this.floatingBlock = document.createElement('div')
    this.floatingBlock.className = 'tiny-remoter-floating-block'
    this.floatingBlock.innerHTML = `
      <div class="tiny-remoter-floating-block__icon">
        <img style="display: block; width: 40px;" src="https://ai.opentiny.design/next-sdk/logo.png" alt="icon" />
      </div>
    `

    document.body.appendChild(this.floatingBlock)
  }

  private createDropdownMenu(): void {
    // 创建下拉菜单
    this.dropdownMenu = document.createElement('div')
    this.dropdownMenu.className = 'tiny-remoter-floating-dropdown'
    this.dropdownMenu.innerHTML = `
      <div class="tiny-remoter-dropdown-item" data-action="qr-code">
        <div class="tiny-remoter-dropdown-item__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9H6V21H3C2.45 21 2 20.55 2 20V10C2 9.45 2.45 9 3 9Z" fill="currentColor"/>
            <path d="M12 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H12C10.9 22 10 21.1 10 20V4C10 2.9 10.9 2 12 2ZM12 20H20V4H12V20Z" fill="currentColor"/>
            <path d="M15 7H17V9H15V7Z" fill="currentColor"/>
            <path d="M15 11H17V13H15V11Z" fill="currentColor"/>
            <path d="M15 15H17V17H15V15Z" fill="currentColor"/>
            <path d="M19 7H21V9H19V7Z" fill="currentColor"/>
            <path d="M19 11H21V13H19V11Z" fill="currentColor"/>
            <path d="M19 15H21V17H19V15Z" fill="currentColor"/>
          </svg>
        </div>
        <span>弹出二维码</span>
      </div>
      <div class="tiny-remoter-dropdown-item" data-action="ai-chat">
        <div class="tiny-remoter-dropdown-item__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
            <path d="M7 9H17V11H7V9Z" fill="currentColor"/>
            <path d="M7 12H14V14H7V12Z" fill="currentColor"/>
          </svg>
        </div>
        <span>弹出AI对话框</span>
      </div>
      <div class="tiny-remoter-dropdown-item" data-action="remote-control">
        <div class="tiny-remoter-dropdown-item__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 2H17C18.1 2 19 2.9 19 4V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V4C5 2.9 5.9 2 7 2ZM7 4V20H17V4H7Z" fill="currentColor"/>
            <path d="M9 6H15V8H9V6Z" fill="currentColor"/>
            <path d="M9 10H15V12H9V10Z" fill="currentColor"/>
            <path d="M9 14H15V16H9V14Z" fill="currentColor"/>
            <path d="M9 18H15V20H9V18Z" fill="currentColor"/>
          </svg>
        </div>
        <span>发送指令到遥控器</span>
      </div>
    `

    document.body.appendChild(this.dropdownMenu)
  }

  private bindEvents(): void {
    // 绑定浮动块点击事件
    this.floatingBlock.addEventListener('click', () => {
      this.toggleDropdown()
    })

    // 绑定菜单项点击事件
    this.dropdownMenu.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      const actionItem = target.closest('.tiny-remoter-dropdown-item') as HTMLElement
      const action = actionItem?.dataset.action as ActionType
      if (action) {
        this.handleAction(action)
      }
    })

    // 点击外部关闭菜单
    document.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement
      if (!this.floatingBlock.contains(target) && !this.dropdownMenu.contains(target)) {
        this.closeDropdown()
      }
    })

    // ESC键关闭菜单
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDropdown()
      }
    })
  }

  private toggleDropdown(): void {
    if (this.isExpanded) {
      this.closeDropdown()
    } else {
      this.openDropdown()
    }
  }

  private openDropdown(): void {
    this.isExpanded = true
    this.floatingBlock.classList.add('expanded')
    this.dropdownMenu.classList.add('show')
  }

  private closeDropdown(): void {
    this.isExpanded = false
    this.floatingBlock.classList.remove('expanded')
    this.dropdownMenu.classList.remove('show')
  }

  private handleAction(action: ActionType): void {
    switch (action) {
      case 'qr-code':
        this.showQRCode()
        break
      case 'ai-chat':
        this.showAIChat()
        break
      case 'remote-control':
        this.showRemoteControl()
        break
    }
    this.closeDropdown()
  }

  private async showQRCode(): Promise<void> {
    const qrCode = createQrCode(this.options.qrCodeUrl + '?sessionId=' + this.options.sessionId)
    const base64 = await qrCode.toDataURL()
    // 创建二维码弹窗
    const modal = this.createModal(
      '扫码打开智能遥控器',
      `
      <div style="text-align: center; padding: 20px;">
        <div style="width: 200px; height: 200px; background: #f0f0f0; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <img src="${base64}" alt="二维码" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <p style="color: #666; margin: 0;">扫描二维码获取更多信息</p>
      </div>
    `
    )
    this.showModal(modal)
  }

  private showAIChat(): void {
    this.showAIChatModal = !this.showAIChatModal
    this.options.onShowAIChat?.(this.showAIChatModal)
  }

  private showRemoteControl(): void {
    // 创建遥控器弹窗
    const modal = this.createModal(
      '输入需要发送的用户名',
      `
      <div style="padding: 20px;">
        <div style="display: flex; gap: 10px;">
          <input type="text" placeholder="输入用户名..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <button style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">发送</button>
        </div>
      </div>
    `
    )
    this.showModal(modal)
  }

  private createModal(title: string, content: string): HTMLDivElement {
    const modal = document.createElement('div')
    modal.className = 'tiny-remoter-floating-modal'
    modal.innerHTML = `
      <div class="tiny-remoter-modal-overlay"></div>
      <div class="tiny-remoter-modal-content">
        <div class="tiny-remoter-modal-header">
          <h3>${title}</h3>
          <button class="tiny-remoter-modal-close">&times;</button>
        </div>
        <div class="tiny-remoter-modal-body">
          ${content}
        </div>
      </div>
    `

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.tiny-remoter-modal-close') as HTMLButtonElement
    const overlay = modal.querySelector('.tiny-remoter-modal-overlay') as HTMLDivElement

    closeBtn.addEventListener('click', () => this.hideModal(modal))
    overlay.addEventListener('click', () => this.hideModal(modal))

    return modal
  }

  private showModal(modal: HTMLDivElement): void {
    document.body.appendChild(modal)
    // 添加显示动画
    setTimeout(() => modal.classList.add('show'), 10)
  }

  private hideModal(modal: HTMLDivElement): void {
    modal.classList.remove('show')
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal)
      }
    }, 100)
  }

  private addStyles(): void {
    // 创建样式表
    const style = document.createElement('style')
    style.textContent = `
      /* 浮动块样式 */
      .tiny-remoter-floating-block {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        overflow: hidden;
      }

      .tiny-remoter-floating-block:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
      }

      .tiny-remoter-floating-block__icon {
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }

      .tiny-remoter-floating-block.expanded .tiny-remoter-floating-block__icon {
        transform: scale(1.1);
      }

      /* 下拉菜单样式 */
      .tiny-remoter-floating-dropdown {
        position: fixed;
        bottom: 100px;
        right: 30px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        padding: 8px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999;
        min-width: 200px;
      }

      .tiny-remoter-floating-dropdown.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      .tiny-remoter-dropdown-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #333;
      }

      .tiny-remoter-dropdown-item:hover {
        background: #f8f9fa;
        transform: translateX(4px);
      }

      .tiny-remoter-dropdown-item__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f8f9fa;
        border-radius: 8px;
        color: #667eea;
      }

      /* 弹窗样式 */
      .tiny-remoter-floating-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tiny-remoter-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .tiny-remoter-modal-content {
        background: white;
        border-radius: 16px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        transform: scale(0.9) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tiny-remoter-floating-modal.show .tiny-remoter-modal-overlay {
        opacity: 1;
      }

      .tiny-remoter-floating-modal.show .tiny-remoter-modal-content {
        transform: scale(1) translateY(0);
      }

      .tiny-remoter-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #f0f0f0;
      }

      .tiny-remoter-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .tiny-remoter-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .tiny-remoter-modal-close:hover {
        background: #f5f5f5;
        color: #666;
      }

      .tiny-remoter-modal-body {
        padding: 24px;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .tiny-remoter-floating-block {
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
        }

        .tiny-remoter-floating-dropdown {
          bottom: 90px;
          right: 20px;
          min-width: 180px;
        }

        .tiny-remoter-modal-content {
          width: 95%;
          margin: 20px;
        }
      }

      /* 深色主题支持 */
      @media (prefers-color-scheme: dark) {
        .tiny-remoter-floating-dropdown {
          background: #1a1a1a;
          color: white;
        }

        .tiny-remoter-dropdown-item {
          color: white;
        }

        .tiny-remoter-dropdown-item:hover {
          background: #2a2a2a;
        }

        .tiny-remoter-dropdown-item__icon {
          background: #2a2a2a;
        }

        .tiny-remoter-modal-content {
          background: #1a1a1a;
          color: white;
        }

        .tiny-remoter-modal-header {
          border-bottom-color: #333;
        }

        .tiny-remoter-modal-header h3 {
          color: white;
        }
      }
    `

    document.head.appendChild(style)
  }

  // 销毁组件
  public destroy(): void {
    if (this.floatingBlock.parentNode) {
      this.floatingBlock.parentNode.removeChild(this.floatingBlock)
    }
    if (this.dropdownMenu.parentNode) {
      this.dropdownMenu.parentNode.removeChild(this.dropdownMenu)
    }
  }
}

// 导出组件
export const createRemoter = (options: FloatingBlockOptions = {}) => {
  return new FloatingBlock(options)
}
