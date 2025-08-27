<template>
  <div>
    <tr-icon-button :icon="TinyIconScan" size="28" svgSize="20" @click="handleScan()" />
    <teleport to="body">
      <div v-show="isScanning" class="scan-code">
        <div class="container">
          <div class="qrcode">
            <div id="reader"></div>
          </div>
        </div>
        <div class="btn">
          <div class="left-back"><van-icon name="arrow-left" @click="clickBack" /></div>
        </div>
      </div>
    </teleport>
  </div>
</template>
​
<script setup>
import { reactive, toRefs, onMounted, onUnmounted, ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { IconScan } from '@opentiny/vue-icon'
import { TrIconButton } from '@opentiny/tiny-robot'
import { showToast } from 'vant'

const TinyIconScan = IconScan()

// 响应式状态管理
const state = reactive({
  html5QrCode: null,
  fileList: []
})

const isScanning = ref(false)

// 开始扫描二维码
const start = () => {
  if (!state.html5QrCode) {
    alert('摄像头无访问权限！')
    return
  }

  isScanning.value = true
  state.html5QrCode
    .start(
      { facingMode: 'environment' },
      {
        fps: 1,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText, decodedResult) => {
        console.log('decodedText', decodedText)
        console.log('decodedResult', decodedResult)
        stop()
      }
    )
    .catch((err) => {
      stop()
      console.log('扫码错误信息', err)
      let message = ''
      // 错误信息处理仅供参考，具体描述自定义
      if (typeof err == 'string') {
        message = '二维码识别失败！'
      } else {
        if (err.name == 'NotAllowedError') {
          message = '您需要授予相机访问权限！'
        }
        if (err.name == 'NotFoundError') {
          message = '这个设备上没有摄像头！'
        }
        if (err.name == 'NotSupportedError') {
          message = '摄像头访问只支持在安全的上下文中，如https或localhost！'
        }
        if (err.name == 'NotReadableError') {
          message = '相机被占用！'
        }
        if (err.name == 'OverconstrainedError') {
          message = '安装摄像头不合适！'
        }
        if (err.name == 'StreamApiNotSupportedError') {
          message = '此浏览器不支持流API！'
        }
      }

      showToast({
        message: message,
        duration: 3000
      })
    })
}

const handleScan = () => {
  start()
}

const clickBack = () => {
  stop()
}

// 获取摄像头权限并初始化
const getCameras = () => {
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        state.html5QrCode = new Html5Qrcode('reader')
      }
    })
    .catch((err) => {
      showToast({
        message: '摄像头无访问权限！',
        duration: 3000
      })
    })
}

// 停止扫描
const stop = () => {
  state.html5QrCode
    .stop()
    .then((ignore) => {
      console.log('停止扫码', ignore)
    })
    .catch((err) => {
      console.log(err)
      showToast('停止扫码失败')
    })
    .finally(() => {
      isScanning.value = false
    })
}

// 组件挂载时获取摄像头权限
onMounted(() => {
  getCameras()
})

// 组件卸载时停止扫描
onUnmounted(() => {
  // 扫描设备是否在运行
  if (state.html5QrCode && state.html5QrCode.isScanning) {
    stop()
  }
})

// 解构响应式状态供模板使用
const { fileList } = toRefs(state)
</script>

<style lang="less" scoped>
.scan-code {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0);
}
.container {
  height: 90vh;
  position: relative;
  width: 100%;
}
.qrcode {
  height: 100%;
}
#reader {
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}
.btn {
  flex: 1;
  padding: 3vw;
  display: flex;
  justify-content: space-around;
  color: #fff;
  font-size: 8vw;
  align-items: flex-start;
}
</style>
