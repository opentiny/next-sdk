<template>
  <div>
    <tiny-dropdown class="next-sdk-trigger-btn" :show-icon="false">
      <slot name="trigger">
        <IconAi></IconAi>
      </slot>
      <template #dropdown>
        <tiny-dropdown-menu>
          <tiny-dropdown-item @click="showTinyRobot = true">弹出 AI对话框</tiny-dropdown-item>
          <tiny-dropdown-item @click="boxVisibility = true">弹出 二维码</tiny-dropdown-item>
        </tiny-dropdown-menu>
      </template>
    </tiny-dropdown>
    <div class="next-sdk-ai-panel" v-show="showTinyRobot">
      <!-- mcp-robot弹窗 -->
      <slot name="chat">
        <tiny-robot-chat :is-fullscreen="false"></tiny-robot-chat>
      </slot>
    </div>
    <tiny-dialog-box v-model:visible="boxVisibility" center title="扫描二维码进入控制器" width="30%">
      <div class="next-sdk-qr-code-content"><tiny-qr-code v-bind="params"></tiny-qr-code></div>
    </tiny-dialog-box>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { TinyDialogBox, TinyQrCode, TinyDropdown, TinyDropdownMenu, TinyDropdownItem } from '@opentiny/vue'
import { IconAi } from '@opentiny/tiny-robot-svgs'
import { globalConversation } from './composable/utils'
import { showTinyRobot } from './composable/utils'
import TinyRobotChat from './components/tiny-robot-chat.vue'

const props = defineProps({
  sessionId: {
    type: String,
    default: ''
  }
})

const params = reactive({
  value: 'null',
  size: 250
})
const boxVisibility = ref(false)

watch(
  () => props.sessionId,
  (newVal) => {
    if (newVal) {
      globalConversation.sessionId = props.sessionId
      params.value = `https://ai.opentiny.design/next-remoter?sessionId=${props.sessionId}`
    }
  },
  {
    immediate: true
  }
)
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

:deep(.tiny-sender){
  margin-top: 330px;
}
</style>
