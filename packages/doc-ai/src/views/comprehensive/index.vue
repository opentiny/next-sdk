<template>
  <div class="products-page">
    <div class="page-header">
      <h3>商品管理</h3>
    </div>
    <div class="page-content">
      <div class="button-box">
        <div class="button-box-left">
          <tiny-input v-model="searchQuery" placeholder="搜索商品名称" clearable />
          <tiny-base-select
            v-model="statusFilter"
            placeholder="商品状态"
            clearable
            :tiny_mcp_config="{
              server,
              business: {
                id: 'product-status-select',
                description: '商品状态的选择器'
              }
            }"
          >
            <tiny-option label="上架" value="on" />
            <tiny-option label="下架" value="off" />
          </tiny-base-select>
          <tiny-base-select
            v-model="categoryFilter"
            placeholder="商品分类"
            clearable
            :tiny_mcp_config="{
              server,
              business: {
                id: 'product-category-select',
                description: '商品分类的选择器'
              }
            }"
          >
            <tiny-option label="手机" value="phones" />
            <tiny-option label="笔记本" value="laptops" />
            <tiny-option label="平板" value="tablets" />
          </tiny-base-select>
        </div>
        <div class="button-box-right">
          <tiny-button type="info" @click="addProductToEdit"> 添加商品 </tiny-button>
          <tiny-button type="danger" @click="removeProduct"> 删除商品 </tiny-button>
          <tiny-button type="success" @click="saveProduct"> 保存 </tiny-button>
        </div>
      </div>
      <tiny-grid
        auto-resize
        ref="gridRef"
        :data="displayProducts"
        :height="500"
        :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true }"
        :tiny_mcp_config="{
          server,
          business: {
            id: 'product-list',
            description: '商品列表'
          }
        }"
      >
        <tiny-grid-column type="index" width="50" />
        <tiny-grid-column type="selection" width="50" />
        <tiny-grid-column field="name" title="商品名称" :editor="{ component: 'input' }" />
        <tiny-grid-column
          field="price"
          :editor="{
            component: 'input',
            attrs: { type: 'number' }
          }"
          title="价格"
        >
          <template #default="{ row }"> ¥{{ row.price }} </template>
        </tiny-grid-column>
        <tiny-grid-column
          field="stock"
          :editor="{
            component: 'input',
            attrs: { type: 'number' }
          }"
          title="库存"
        />
        <tiny-grid-column
          field="category"
          :editor="{
            component: 'select',
            options: [
              { label: '手机', value: 'phones' },
              { label: '笔记本', value: 'laptops' },
              { label: '平板', value: 'tablets' }
            ]
          }"
          title="分类"
        >
          <template #default="{ row }">
            {{ categoryLabels[row.category] }}
          </template>
        </tiny-grid-column>
        <tiny-grid-column
          field="status"
          :editor="{
            component: 'select',
            options: [
              { label: '上架', value: 'on' },
              { label: '下架', value: 'off' }
            ]
          }"
          title="状态"
        >
          <template #default="{ row }">
            <tiny-tag :type="row.status === 'on' ? 'success' : 'warning'">
              {{ row.status === 'on' ? '上架' : '下架' }}
            </tiny-tag>
          </template>
        </tiny-grid-column>
      </tiny-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import productsData from './products.json'
import { $local } from '../../composable/utils'
import { createServer } from '@opentiny/next-sdk'
import { createInMemoryTransport } from '@opentiny/next-sdk'
import { z } from 'zod'
import { cmpMenus } from '../../mock/menu'

if (!$local.products) {
  $local.products = productsData
}

const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const products = ref($local.products)

const displayProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || product.status === statusFilter.value
    const matchesCategory = !categoryFilter.value || product.category === categoryFilter.value
    return matchesQuery && matchesStatus && matchesCategory
  })
})

const gridRef = ref(null)

const categoryLabels: Record<string, string> = {
  phones: '手机',
  laptops: '笔记本',
  tablets: '平板'
}

// 新增商品到编辑弹窗
const addProductToEdit = async () => {
  gridRef?.value?.insert({
    'image': 'https://img1.baidu.com/it/u=1559062020,1043707656&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=500',
    price: 10000,
    stock: 100,
    category: 'phones',
    status: 'on'
  })
}

const removeProduct = () => {
  const selectedRows = gridRef?.value?.getSelectRecords()
  if (selectedRows.length === 0) {
    TinyModal.confirm({
      message: '请选择要删除的商品',
      title: '删除商品',
      status: 'warning'
    })
    return
  }
  if (selectedRows.length > 0) {
    gridRef?.value?.removeSelecteds()
  }
}

const saveProduct = () => {
  setTimeout(() => {
    const data = gridRef?.value?.getTableData()
    $local.products = data.tableData
    TinyModal.message({
      message: '保存成功',
      status: 'success'
    })
  }, 1000)
}

const server = createServer(
  {
    name: 'comprehensive-config',
    version: '1.0.0'
  },
  {
    capabilities: {
      logging: {},
      resources: { subscribe: true, listChanged: true }
    }
  }
)

server.use(createInMemoryTransport())

server.registerResource(
  'site-menus',
  'site-menus://app',
  {
    title: 'TinyVue官网的菜单数据',
    description: 'TinyVue官网的菜单数据，其中"key"为路由路径，"name"为菜单名称，"children"为子菜单',
    mimeType: 'text/plain'
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(cmpMenus)
      }
    ]
  })
)

// 长任务示例
server.registerTool(
  'long-task',
  {
    title: 'long-task',
    description: '可以帮用户订机票'
  },
  async ({}) => {
    // 执行一个长任务
    await new Promise((resolve) => setTimeout(resolve, 10000))
    return {
      content: [
        {
          type: 'text',
          text: '执行一个长任务，执行完成'
        }
      ]
    }
  }
)

const validates = ['2025-07-22', '2025-07-23']

const checkAvailability = async (restaurant: string, date: string, partySize: number) => {
  return validates.some((item) => date.includes(item))
}

const findAlternatives = async (restaurant: string, date: string, partySize: number) => {
  return validates
}

const makeBooking = async (restaurant: string, date: string, partySize: number) => {
  return true
}
// 帮我预定79号渔船餐厅今天晚上7点的桌子，可以容纳10个人
// 订阅餐厅的工具
server.registerTool(
  'book-restaurant',
  {
    title: 'book-restaurant',
    description: '预定一个餐厅的桌子',
    inputSchema: {
      restaurant: z.string(),
      date: z.string(),
      partySize: z.number()
    }
  },
  async ({ restaurant, date, partySize }) => {
    // 检查有没有可以预定的餐厅
    const available = await checkAvailability(restaurant, date, partySize)

    if (!available) {
      // 询问用户的意见
      const result = await server.server.elicitInput({
        message: `在${restaurant}的${date}没有桌子了。您是否想检查其他日期？`,
        requestedSchema: {
          type: 'object',
          properties: {
            checkAlternatives: {
              type: 'boolean',
              title: '检查替代日期',
              description: '您是否想检查其他日期？'
            },
            flexibleDates: {
              type: 'string',
              title: '日期灵活性',
              description: '您想检查其他日期吗？',
              enum: ['next_day', 'same_week', 'next_week'],
              enumNames: ['明天', '本周', '下周']
            }
          },
          required: ['checkAlternatives']
        }
      })
      if (result.action === 'accept' && result.content?.checkAlternatives) {
        const alternatives = await findAlternatives(restaurant, date, partySize)
        return {
          content: [
            {
              type: 'text',
              text: `找到这些替代日期: ${alternatives.join(', ')}`
            }
          ]
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: '没有预定。原日期没有可以预定的桌子。'
          }
        ]
      }
    }

    // 预定桌子
    await makeBooking(restaurant, date, partySize)
    return {
      content: [
        {
          type: 'text',
          text: `预定了一个${partySize}人的桌子在${restaurant}的${date}`
        }
      ]
    }
  }
)

server.registerTool(
  'summarize',
  {
    description: 'Summarize any text using an LLM',
    inputSchema: {
      text: z.string().describe('Text to summarize')
    }
  },
  async ({ text }) => {
    // Call the LLM through MCP sampling
    const response = await server.$createMessage('summarize', {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please summarize the following text concisely:\n\n${text}`
          }
        }
      ],
      maxTokens: 500
    })

    return {
      content: [
        {
          type: 'text',
          text: response.content.type === 'text' ? response.content.text : 'Unable to generate summary'
        }
      ]
    }
  }
)

server.registerTool(
  'expand',
  {
    description: 'Expand any text using an LLM',
    inputSchema: {
      text: z.string().describe('Text to expand')
    }
  },
  async ({ text }) => {
    // Call the LLM through MCP sampling
    const response = await server.server.createMessage({
      $id: 'expand',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please expand the following text concisely:\n\n${text}`
          }
        }
      ],
      maxTokens: 500
    })

    return {
      content: [
        {
          type: 'text',
          text: response.content.type === 'text' ? response.content.text : 'Unable to generate summary'
        }
      ]
    }
  }
)

onMounted(() => {
  server.connectTransport()
})
</script>

<style scoped lang="less">
.products-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    height: 32px;
  }
}

.button-box {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  justify-content: space-between;
}
.button-box-left {
  display: flex;
  gap: 8px;
}

.loading-state {
  padding: 20px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}
.page-content {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}
</style>
