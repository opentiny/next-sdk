<template>
  <div class="scan-container">
    <!-- 扫码按钮区域 -->
    <div class="scan-controls" v-if="!isScanning">
      <button class="scan-button" @click="handleStartScan" :disabled="!isSupported || status === 'scanning'">
        <span class="scan-icon">📷</span>
        开始扫码
      </button>

      <!-- 支持状态提示 -->
      <div v-if="!isSupported" class="support-warning">⚠️ 当前浏览器不支持扫码功能</div>
    </div>

    <!-- 扫码状态显示 -->
    <div class="scan-status" v-if="status !== 'idle'">
      <div class="status-indicator" :class="status">
        <span v-if="status === 'scanning'" class="scanning-text"> 🔍 正在扫码中... </span>
        <span v-else-if="status === 'success'" class="success-text"> ✅ 扫码成功！ </span>
        <span v-else-if="status === 'error'" class="error-text"> ❌ 扫码失败 </span>
        <span v-else-if="status === 'permission_denied'" class="permission-text"> 🚫 摄像头权限被拒绝 </span>
      </div>
    </div>

    <!-- 扫码结果展示 -->
    <div v-if="result" class="scan-result">
      <h3>扫码结果</h3>
      <div class="result-content">
        <div class="result-text">{{ result.text }}</div>
        <div class="result-meta">
          <span>格式: {{ result.format || '未知' }}</span>
          <span>时间: {{ formatTimestamp(result.timestamp) }}</span>
        </div>
      </div>
      <button class="reset-button" @click="handleReset">重新扫码</button>
    </div>

    <!-- 错误信息展示 -->
    <div v-if="error" class="scan-error">
      <h3>错误信息</h3>
      <div class="error-content">
        <div class="error-code">错误代码: {{ error.code }}</div>
        <div class="error-message">{{ error.message }}</div>
        <div class="error-time">时间: {{ formatTimestamp(error.timestamp) }}</div>
      </div>
      <button class="retry-button" @click="handleRetry">重试</button>
    </div>

    <!-- 扫码预览界面 -->
    <div v-if="isScanning" class="scan-preview">
      <div class="preview-header">
        <h3>扫码预览</h3>
        <button class="stop-button" @click="handleStopScan">停止扫码</button>
      </div>

      <!-- 摄像头预览区域 -->
      <div class="camera-preview">
        <div class="preview-placeholder">
          <span class="camera-icon">📹</span>
          <p>摄像头预览区域</p>
          <p class="preview-tip">请将二维码/条形码对准摄像头</p>
        </div>
      </div>

      <!-- 扫码提示 -->
      <div class="scan-tips">
        <p>💡 扫码提示:</p>
        <ul>
          <li>确保二维码/条形码清晰可见</li>
          <li>保持适当距离（建议10-30cm）</li>
          <li>避免强光直射</li>
          <li>保持设备稳定</li>
        </ul>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-buttons" v-if="status !== 'idle'">
      <button v-if="status === 'scanning'" class="action-button stop" @click="handleStopScan">停止扫码</button>
      <button v-if="status === 'success' || status === 'error'" class="action-button reset" @click="handleReset">
        重新开始
      </button>
      <button v-if="status === 'permission_denied'" class="action-button retry" @click="handleRetry">重试权限</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useScan, type ScanOptions } from './composable/scan'

// 定义组件名称
defineOptions({
  name: 'ScanComponent'
})

// 使用扫码组合式函数
const { status, result, error, isSupported, checkSupport, startScan, stopScan, cleanup, reset } = useScan()

// 计算属性：是否正在扫码
const isScanning = computed(() => status.value === 'scanning')

// 扫码配置选项
const scanOptions: ScanOptions = {
  facingMode: 'environment', // 默认使用后置摄像头
  width: 640,
  height: 480,
  aspectRatio: 4 / 3
}

// 处理开始扫码
const handleStartScan = async () => {
  try {
    await startScan(scanOptions)
  } catch (err) {
    console.error('启动扫码失败:', err)
  }
}

// 处理停止扫码
const handleStopScan = () => {
  stopScan()
}

// 处理重置
const handleReset = () => {
  reset()
}

// 处理重试
const handleRetry = async () => {
  try {
    // 重新检查支持性
    await checkSupport()
    // 如果支持，重新开始扫码
    if (isSupported.value) {
      await startScan(scanOptions)
    }
  } catch (err) {
    console.error('重试失败:', err)
  }
}

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 组件挂载时检查支持性
onMounted(async () => {
  await checkSupport()
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="less">
.scan-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// 扫码控制区域样式
.scan-controls {
  text-align: center;
  margin-bottom: 30px;
}

.scan-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.scan-icon {
  font-size: 20px;
}

.support-warning {
  margin-top: 16px;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  color: #856404;
  font-size: 14px;
}

// 扫码状态样式
.scan-status {
  margin-bottom: 20px;
}

.status-indicator {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;

  &.scanning {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
  }

  &.success {
    background-color: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  &.error {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  }

  &.permission_denied {
    background-color: #fff3e0;
    color: #ef6c00;
    border: 1px solid #ffcc02;
  }
}

// 扫码结果样式
.scan-result {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 16px 0;
    color: #495057;
    font-size: 18px;
  }
}

.result-content {
  margin-bottom: 16px;
}

.result-text {
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  word-break: break-all;
  margin-bottom: 12px;
}

.result-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6c757d;

  span {
    background-color: #e9ecef;
    padding: 4px 8px;
    border-radius: 4px;
  }
}

// 错误信息样式
.scan-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 16px 0;
    color: #721c24;
    font-size: 18px;
  }
}

.error-content {
  margin-bottom: 16px;
}

.error-code {
  font-weight: 500;
  margin-bottom: 8px;
}

.error-message {
  color: #721c24;
  margin-bottom: 8px;
}

.error-time {
  font-size: 12px;
  color: #6c757d;
}

// 扫码预览样式
.scan-preview {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #495057;
    font-size: 18px;
  }
}

.camera-preview {
  background-color: #000;
  border-radius: 8px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.preview-placeholder {
  text-align: center;
  color: white;
}

.camera-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.preview-tip {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 8px;
}

.scan-tips {
  background-color: white;
  border-radius: 6px;
  padding: 16px;

  p {
    margin: 0 0 12px 0;
    font-weight: 500;
    color: #495057;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    color: #6c757d;

    li {
      margin-bottom: 6px;
      line-height: 1.4;
    }
  }
}

// 按钮样式
.reset-button,
.retry-button,
.stop-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.reset-button {
  background-color: #6c757d;
  color: white;

  &:hover {
    background-color: #5a6268;
  }
}

.retry-button {
  background-color: #007bff;
  color: white;

  &:hover {
    background-color: #0056b3;
  }
}

.stop-button {
  background-color: #dc3545;
  color: white;

  &:hover {
    background-color: #c82333;
  }
}

// 操作按钮区域样式
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &.stop {
    background-color: #dc3545;
    color: white;

    &:hover {
      background-color: #c82333;
    }
  }

  &.reset {
    background-color: #6c757d;
    color: white;

    &:hover {
      background-color: #5a6268;
    }
  }

  &.retry {
    background-color: #007bff;
    color: white;

    &:hover {
      background-color: #0056b3;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .scan-container {
    padding: 16px;
  }

  .scan-button {
    padding: 10px 20px;
    font-size: 14px;
  }

  .camera-preview {
    height: 250px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .scan-container {
    padding: 12px;
  }

  .scan-button {
    padding: 8px 16px;
    font-size: 13px;
  }

  .camera-preview {
    height: 200px;
  }

  .result-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
