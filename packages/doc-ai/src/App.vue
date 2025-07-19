<template>
  <div class="app-container">
    <div class="keep-icon-and-hideme">
      <IconAi />
      <IconUser />
    </div>
    <!-- 主体内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
    <div class="right-panel" :class="{ collapsed: !showTinyRobot }">
      <div class="right-panel-header">智能助手操作区</div>
      <tiny-robot-chat />
    </div>
    <IconAi @click="showTinyRobot = !showTinyRobot" class="style-settings-icon"></IconAi>
  </div>
</template>

<script setup lang="ts">
import '@opentiny/icons/style/all.css'
import TinyRobotChat from './components/tiny-robot-chat.vue'
import { showTinyRobot } from './composable/utils'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
</script>

<style scoped>
.header {
  width: calc(100% - 502px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
}

/* 隐藏区域，保留svg永远可见 */
.keep-icon-and-hideme,
.keep-icon-and-hideme svg {
  width: 0;
  height: 0;
}

.qr-code {
  margin-right: 20px;
}

.app-container {
  display: flex;
  height: 100%;
  position: relative;
}

.main-content {
  padding: 10px 10px;
  height: 100%;
  width: calc(100% - 502px);
  position: relative;
}

.right-panel {
  width: 480px;
  height: 100%;
  position: relative;
  background: #fff;
  border-left: 1px solid #e4e7ed;
}

.right-panel.collapsed {
  width: 0;
  overflow: hidden;
}

.style-settings-icon {
  position: fixed;
  bottom: 100px;
  right: 100px;
  font-size: 24px;
  z-index: 30;
  cursor: pointer;
}
</style>
