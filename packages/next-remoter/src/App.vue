<template>
  <div>
    <tiny-robot-chat></tiny-robot-chat>
  </div>
</template>

<script setup lang="ts">
import { globalConversation } from './composable/utils'
import { showTinyRobot } from './composable/utils'
import TinyRobotChat from './components/tiny-robot-chat.vue'

showTinyRobot.value = true

const query = new URLSearchParams(window.location.search)

globalConversation.sessionId = query.get('sessionId') as string
</script>

<style scoped lang="less">
.next-sdk-ai-panel {
  width: 480px;
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
}

.next-sdk-trigger-btn {
  position: fixed;
  bottom: 136px;
  right: 100px;
  font-size: 24px;
  z-index: 30;
  cursor: pointer;
}

.next-sdk-qr-code-content {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.chat-input {
  margin-top: 8px;
  padding: 10px 15px;
}

.tr-container {
  container-type: inline-size;

  :deep(.tr-welcome__title-wrapper) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.welcome-footer {
  margin-top: 12px;
  color: rgb(128, 128, 128);
  font-size: 12px;
  line-height: 20px;
}

.tiny-prompts {
  padding: 16px 24px;

  :deep(.prompt-item) {
    width: 100%;
    box-sizing: border-box;

    @container (width >=64rem) {
      width: calc(50% - 8px);
    }

    .tr-prompt__content-label {
      font-size: 14px;
      line-height: 24px;
    }
  }
}

.tr-history-demo {
  position: absolute;
  right: 100%;
  top: 100%;
  z-index: 100;
  width: 300px;
  height: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}
</style>
