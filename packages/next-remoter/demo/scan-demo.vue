<template>
  <div class="scan-demo">
    <div class="demo-header">
      <h1>📱 扫码组件演示</h1>
      <p>基于 scan.ts 实现的 Vue3 扫码功能组件</p>
    </div>

    <div class="demo-content">
      <!-- 基础扫码功能 -->
      <div class="demo-section">
        <h2>🔍 基础扫码功能</h2>
        <p>点击下方按钮开始扫码，体验完整的扫码流程</p>
        <ScanComponent />
      </div>

      <!-- 功能说明 -->
      <div class="demo-section">
        <h2>📋 功能特性</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🚀</div>
            <h3>一键扫码</h3>
            <p>点击按钮即可启动扫码功能，操作简单直观</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <h3>实时状态</h3>
            <p>实时显示扫码状态，包括空闲、扫码中、成功、错误等</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔒</div>
            <h3>权限管理</h3>
            <p>自动处理摄像头权限请求，提供友好的错误提示</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <h3>响应式设计</h3>
            <p>适配不同屏幕尺寸，在移动设备和桌面端都有良好体验</p>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="demo-section">
        <h2>📖 使用方法</h2>
        <div class="usage-code">
          <h3>1. 导入组件</h3>
          <pre><code>import ScanComponent from './src/scan.vue'</code></pre>

          <h3>2. 在模板中使用</h3>
          <pre><code>&lt;template&gt;
  &lt;div&gt;
    &lt;ScanComponent /&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

          <h3>3. 注册组件</h3>
          <pre><code>&lt;script setup lang="ts"&gt;
// 组件会自动注册，无需额外配置
&lt;/script&gt;</code></pre>
        </div>
      </div>

      <!-- 技术架构 -->
      <div class="demo-section">
        <h2>🏗️ 技术架构</h2>
        <div class="architecture-info">
          <div class="arch-item">
            <h3>前端框架</h3>
            <p>Vue 3 + TypeScript + Composition API</p>
          </div>
          <div class="arch-item">
            <h3>扫码核心</h3>
            <p>基于 scan.ts 组合式函数实现</p>
          </div>
          <div class="arch-item">
            <h3>样式系统</h3>
            <p>Less + CSS 变量 + 响应式设计</p>
          </div>
          <div class="arch-item">
            <h3>构建工具</h3>
            <p>Vite + TypeScript 编译</p>
          </div>
        </div>
      </div>

      <!-- 浏览器兼容性 -->
      <div class="demo-section">
        <h2>🌐 浏览器兼容性</h2>
        <div class="browser-support">
          <div class="browser-item supported">
            <span class="browser-name">Chrome</span>
            <span class="version">53+</span>
            <span class="status">✅ 支持</span>
          </div>
          <div class="browser-item supported">
            <span class="browser-name">Firefox</span>
            <span class="version">36+</span>
            <span class="status">✅ 支持</span>
          </div>
          <div class="browser-item supported">
            <span class="browser-name">Safari</span>
            <span class="version">11+</span>
            <span class="status">✅ 支持</span>
          </div>
          <div class="browser-item supported">
            <span class="browser-name">Edge</span>
            <span class="version">79+</span>
            <span class="status">✅ 支持</span>
          </div>
          <div class="browser-item not-supported">
            <span class="browser-name">IE</span>
            <span class="version">-</span>
            <span class="status">❌ 不支持</span>
          </div>
        </div>
      </div>
    </div>

    <div class="demo-footer">
      <p>OpenTiny Next Remoter - 扫码功能演示</p>
      <p>基于 scan.ts 组合式函数实现</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScanComponent from '../src/scan.vue'

// 定义组件名称
defineOptions({
  name: 'ScanDemo'
})
</script>

<style scoped lang="less">
.scan-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;

  h1 {
    margin: 0 0 16px 0;
    font-size: 2.5rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: 1.2rem;
    opacity: 0.9;
  }
}

.demo-content {
  margin-bottom: 40px;
}

.demo-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.8rem;
    border-bottom: 2px solid #667eea;
    padding-bottom: 10px;
  }

  p {
    margin: 0 0 20px 0;
    color: #666;
    line-height: 1.6;
    font-size: 1.1rem;
  }
}

// 功能特性网格
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.feature-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 1.3rem;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

// 使用说明代码块
.usage-code {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;

  h3 {
    margin: 20px 0 10px 0;
    color: #333;
    font-size: 1.1rem;

    &:first-child {
      margin-top: 0;
    }
  }

  pre {
    background: #2d3748;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 10px 0 20px 0;

    code {
      font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
      font-size: 0.9rem;
    }
  }
}

// 技术架构信息
.architecture-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.arch-item {
  text-align: center;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #bbdefb;

  h3 {
    margin: 0 0 12px 0;
    color: #1976d2;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    color: #1565c0;
    font-size: 0.95rem;
  }
}

// 浏览器兼容性
.browser-support {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.browser-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  text-align: center;

  &.supported {
    background: #e8f5e8;
    border: 1px solid #c8e6c9;
  }

  &.not-supported {
    background: #ffebee;
    border: 1px solid #ffcdd2;
  }

  .browser-name {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 1.1rem;
  }

  .version {
    color: #666;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }

  .status {
    font-weight: 500;
    font-size: 0.9rem;

    .supported & {
      color: #2e7d32;
    }

    .not-supported & {
      color: #c62828;
    }
  }
}

.demo-footer {
  text-align: center;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  color: #666;

  p {
    margin: 8px 0;
    font-size: 1rem;

    &:first-child {
      font-weight: 600;
      color: #333;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .scan-demo {
    padding: 16px;
  }

  .demo-header {
    padding: 30px 16px;

    h1 {
      font-size: 2rem;
    }

    p {
      font-size: 1rem;
    }
  }

  .demo-section {
    padding: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .architecture-info {
    grid-template-columns: 1fr;
  }

  .browser-support {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .demo-header {
    h1 {
      font-size: 1.8rem;
    }
  }

  .browser-support {
    grid-template-columns: 1fr;
  }
}
</style>
