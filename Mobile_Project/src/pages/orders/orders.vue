<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">我的兑换</text>
      <view class="nav-placeholder"></view>
    </view>

    <view class="tabs-section">
      <view class="tabs">
        <view 
          class="tab" 
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          全部
          <view v-if="orderCounts.all > 0" class="tab-badge">{{ orderCounts.all }}</view>
        </view>
        <view 
          class="tab" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          待处理
          <view v-if="orderCounts.pending > 0" class="tab-badge">{{ orderCounts.pending }}</view>
        </view>
        <view 
          class="tab" 
          :class="{ active: activeTab === 'shipped' }"
          @click="activeTab = 'shipped'"
        >
          已发货
          <view v-if="orderCounts.shipped > 0" class="tab-badge">{{ orderCounts.shipped }}</view>
        </view>
        <view 
          class="tab" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'"
        >
          已完成
          <view v-if="orderCounts.completed > 0" class="tab-badge">{{ orderCounts.completed }}</view>
        </view>
        <view 
          class="tab" 
          :class="{ active: activeTab === 'cancelled' }"
          @click="activeTab = 'cancelled'"
        >
          已取消
          <view v-if="orderCounts.cancelled > 0" class="tab-badge">{{ orderCounts.cancelled }}</view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="orders-scroll">
      <view v-if="filteredOrders.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无兑换记录</text>
        <text class="empty-hint">快去商城挑选心仪的商品吧~</text>
      </view>
      <view 
        v-for="order in filteredOrders" 
        :key="order.id"
        class="order-card"
        @click="viewOrderDetail(order)"
      >
        <view class="order-header">
          <text class="order-id">订单号: {{ order.id }}</text>
          <text class="order-status" :class="order.status">{{ order.statusLabel }}</text>
        </view>
        <view class="order-content">
          <image :src="order.productImage" class="order-image" mode="aspectFill" />
          <view class="order-info">
            <text class="order-product-name">{{ order.productName }}</text>
            <text class="order-time">{{ order.exchangeTime }}</text>
            <text class="order-points">{{ order.points }} 积分</text>
          </view>
        </view>
        <view class="order-footer">
          <text class="order-user">兑换人: {{ order.userName }}</text>
          <view v-if="order.status === 'pending'" class="order-action">
            <text class="action-btn" @click.stop="cancelOrder(order)">取消订单</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { appActions } from '@/stores/appStore'
import { dataService } from '@/data/dataService'
import { getToken } from '@/utils/auth'
import type { Order } from '@shared/types'

/**
 * 订单数据经 dataService 获取（默认走后端 API）。
 * 取消订单由服务端完成「状态变更 + 返还积分 + 回补库存」，
 * 前端不再自行改状态，避免与后端不一致。
 */
const orders = ref<Order[]>([])
const loading = ref(false)

const loadOrders = async () => {
  // 路由守卫：未登录回登录页（服务端仍会二次校验）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    orders.value = await dataService.fetchOrders()
    appActions.setPendingOrders(orderCounts.value.pending)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      try {
        uni.reLaunch({
          url: '/pages/index/index',
          fail: () => {
            uni.navigateTo({
              url: '/pages/index/index',
              fail: () => {
                if (typeof window !== 'undefined') {
                  location.href = '/pages/index/index'
                }
              }
            })
          }
        })
      } catch (e) {
        if (typeof window !== 'undefined') {
          location.href = '/pages/index/index'
        }
      }
    }
  })
}

const activeTab = ref('all')

onLoad((options) => {
  // 支持从个人中心带状态参数跳转
  const status = options?.status
  const validStatus = ['all', 'pending', 'shipped', 'completed', 'cancelled']
  if (typeof status === 'string' && validStatus.includes(status)) {
    activeTab.value = status
  }
})

// 每次进入页面重新拉取，确保后台发货后前台可见最新状态
onShow(loadOrders)

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return orders.value
  }
  return orders.value.filter(o => o.status === activeTab.value)
})

const orderCounts = computed(() => ({
  all: orders.value.length,
  pending: orders.value.filter(o => o.status === 'pending').length,
  shipped: orders.value.filter(o => o.status === 'shipped').length,
  completed: orders.value.filter(o => o.status === 'completed').length,
  cancelled: orders.value.filter(o => o.status === 'cancelled').length
}))

const viewOrderDetail = (order: Order) => {
  const timeText = order.status === 'cancelled' && order.cancelTime
    ? `\n取消时间: ${order.cancelTime}`
    : order.status === 'shipped' && order.shipTime
      ? `\n发货时间: ${order.shipTime}`
      : order.status === 'completed' && order.completeTime
        ? `\n完成时间: ${order.completeTime}`
        : ''
  uni.showModal({
    title: `订单 ${order.id}`,
    content: `商品: ${order.productName}\n消耗积分: ${order.points}\n状态: ${order.statusLabel}\n兑换时间: ${order.exchangeTime}${timeText}`,
    showCancel: false,
    confirmText: '知道了'
  })
}

const cancelOrder = (order: Order) => {
  // 幂等守卫：仅待处理订单可取消（服务端亦会二次校验）
  if (order.status !== 'pending') {
    uni.showToast({
      title: '当前订单状态不可取消',
      icon: 'none'
    })
    return
  }
  uni.showModal({
    title: '确认取消',
    content: `取消后将返还 ${order.points} 积分，确定取消该订单吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await dataService.cancelOrder(order.id, '用户主动取消')
        appActions.setUserPoints(result.userPoints)
        uni.showToast({
          title: `已取消，返还${order.points}积分`,
          icon: 'success'
        })
        await loadOrders()
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '取消失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4fa 0%, #f5f7fa 100%);
  padding-bottom: 120rpx;
  padding-left: 0;
  padding-right: 0;
  margin: 0;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 80rpx 30rpx 30rpx;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  z-index: 100;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
}

.nav-back {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.nav-back:active {
  background: #e8f0fe;
  transform: scale(0.95);
}

.back-icon {
  font-size: 44rpx;
  color: #333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.nav-placeholder {
  width: 72rpx;
}

.tabs-section {
  background: #fff;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.tabs {
  display: flex;
  padding: 0 30rpx;
}

.tab {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  color: #666;
  position: relative;
  padding-bottom: 24rpx;
  font-weight: 500;
}

.tab.active {
  color: #4A7CFF;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #4A7CFF, #6B8FFF);
  border-radius: 3rpx;
  box-shadow: 0 2rpx 8rpx rgba(74, 124, 255, 0.3);
}

.tab-badge {
  position: absolute;
  top: -10rpx;
  right: 20rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 24rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

.orders-scroll {
  height: calc(100vh - 280rpx);
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.order-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.order-card:active {
  transform: scale(0.99);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-id {
  font-size: 26rpx;
  color: #999;
}

.order-status {
  font-size: 28rpx;
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.order-status.pending {
  color: #FF9500;
  background: #fff8f0;
}

.order-status.shipped {
  color: #4A7CFF;
  background: #f0f6ff;
}

.order-status.completed {
  color: #34C759;
  background: #f0fff4;
}

.order-status.cancelled {
  color: #999;
  background: #f5f5f5;
}

.order-content {
  display: flex;
  gap: 28rpx;
  margin-bottom: 24rpx;
}

.order-image-wrap {
  position: relative;
  flex-shrink: 0;
}

.order-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 20rpx;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-product-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.order-time {
  font-size: 26rpx;
  color: #999;
}

.order-points {
  font-size: 32rpx;
  color: #FF6B6B;
  font-weight: 700;
}

.order-points::before {
  content: '💎';
  margin-right: 8rpx;
  font-size: 28rpx;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-user {
  font-size: 26rpx;
  color: #999;
}

.action-btn {
  color: #4A7CFF;
  font-size: 30rpx;
  font-weight: 600;
  padding: 12rpx 32rpx;
  background: #f0f6ff;
  border-radius: 32rpx;
  transition: all 0.3s ease;
}

.action-btn:active {
  background: #dbe8fd;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 180rpx 0;
}

.empty-icon {
  font-size: 140rpx;
  margin-bottom: 32rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
}

.empty-hint {
  font-size: 26rpx;
  color: #bbb;
  margin-top: 12rpx;
}
</style>
