import { reactive } from 'vue'
import { orders, saveOrders, type Order } from '@/data/mockData'

// 全局应用状态
export const appState = reactive({
  // 福利商城 - 在线商品数量
  onlineProducts: 0,
  // 我的兑换 - 待处理订单数量
  pendingOrders: 0,
  // 积分明细 - 今日积分变动次数
  todayPointsChanges: 0,
  // 积分规则 - 规则版本号
  ruleVersion: 1,
  // 用户积分
  userPoints: 0,
  // 累计兑换
  totalExchanged: 0,
  // 累计获得
  totalEarned: 0,
  // 累计消费
  totalSpent: 0
})

// 模块级状态更新函数（供 appActions 内部复用，避免 this 绑定问题）
function setOnlineProducts(count: number) {
  appState.onlineProducts = count
}
function setPendingOrders(count: number) {
  appState.pendingOrders = count
}
function setTodayPointsChanges(count: number) {
  appState.todayPointsChanges = count
}
function setRuleVersion(version: number) {
  appState.ruleVersion = version
}
function setUserPoints(points: number) {
  appState.userPoints = points
}
function setTotalExchanged(count: number) {
  appState.totalExchanged = count
}
function setTotalEarned(count: number) {
  appState.totalEarned = count
}
function setTotalSpent(count: number) {
  appState.totalSpent = count
}

// 更新方法
export const appActions = {
  setOnlineProducts,
  setPendingOrders,
  setTodayPointsChanges,
  setRuleVersion,
  setUserPoints,
  setTotalExchanged,
  setTotalEarned,
  setTotalSpent,
  updateOrderStatus(orderId: string, status: Order['status']) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.statusLabel = getStatusLabel(status)
    }
    setPendingOrders(orders.value.filter(o => o.status === 'pending').length)
    saveOrders()
  },
  addOrder(order: Order) {
    orders.value.push(order)
    setPendingOrders(orders.value.filter(o => o.status === 'pending').length)
    saveOrders()
  }
}

// 获取状态标签
function getStatusLabel(status: Order['status']): string {
  const labelMap: Record<Order['status'], string> = {
    pending: '待处理',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labelMap[status] || status
}
