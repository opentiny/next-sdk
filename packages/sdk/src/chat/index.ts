import TinyRemoter from './index.vue'
import '@opentiny/tiny-robot/dist/style.css'

TinyRemoter.install = function (Vue: any) {
  Vue.component('tiny-remoter', TinyRemoter)
}

export { TinyRemoter }
