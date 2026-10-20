<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">个人中心</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="user-section">
        <view class="user-card">
          <image :src="userInfo.avatar" class="avatar" mode="aspectFill" />
          <view class="user-info">
            <text class="nickname">{{ editableUser.nickname }}</text>
            <text class="position">{{ editableUser.position }} | {{ editableUser.department }}</text>
          </view>
          <view class="edit-btn" @click="showEditModal = true">
            <text class="edit-icon">✏️</text>
          </view>
        </view>
      </view>

      <view class="stats-section">
        <view class="stats-card">
          <view class="stat-item">
            <text class="stat-value">{{ userInfo.points }}</text>
            <text class="stat-label">当前积分</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ monthEarn }}</text>
            <text class="stat-label">本月获得</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ monthSpend }}</text>
            <text class="stat-label">本月消费</text>
          </view>
        </view>
      </view>

      <view class="info-section">
        <view class="section-title">
          <text class="title-icon">📋</text>
          <text class="title-text">基本信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">工号</text>
            <text class="info-value">{{ editableUser.employeeId }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">入职日期</text>
            <text class="info-value">{{ editableUser.hireDate }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">邮箱</text>
            <text class="info-value">{{ editableUser.email }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">手机号</text>
            <text class="info-value">{{ editableUser.phone }}</text>
          </view>
        </view>
      </view>

      <view class="order-section">
        <view class="section-title">
          <text class="title-icon">📦</text>
          <text class="title-text">订单统计</text>
          <view class="section-more" @click="goToOrders">
            <text class="more-text">查看全部</text>
            <text class="more-arrow">›</text>
          </view>
        </view>
        <view class="order-stats">
          <view class="order-stat-item" @click="goToOrdersWithStatus('all')">
            <text class="order-stat-value">{{ orderCounts.all }}</text>
            <text class="order-stat-label">全部订单</text>
          </view>
          <view class="order-stat-item" @click="goToOrdersWithStatus('pending')">
            <text class="order-stat-value pending">{{ orderCounts.pending }}</text>
            <text class="order-stat-label">待处理</text>
          </view>
          <view class="order-stat-item" @click="goToOrdersWithStatus('shipped')">
            <text class="order-stat-value shipped">{{ orderCounts.shipped }}</text>
            <text class="order-stat-label">已发货</text>
          </view>
          <view class="order-stat-item" @click="goToOrdersWithStatus('completed')">
            <text class="order-stat-value completed">{{ orderCounts.completed }}</text>
            <text class="order-stat-label">已完成</text>
          </view>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-list">
          <view class="menu-item" @click="goToFavorites">
            <view class="menu-icon-wrap">
              <text class="menu-icon">❤️</text>
            </view>
            <text class="menu-text">我的收藏</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goToCoupons">
            <view class="menu-icon-wrap">
              <text class="menu-icon">🎫</text>
            </view>
            <text class="menu-text">优惠券</text>
            <view class="menu-badge">3</view>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goToAddresses">
            <view class="menu-icon-wrap">
              <text class="menu-icon">📍</text>
            </view>
            <text class="menu-text">收货地址</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goToSecurity">
            <view class="menu-icon-wrap">
              <text class="menu-icon">🔒</text>
            </view>
            <text class="menu-text">账户安全</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goToSettings">
            <view class="menu-icon-wrap">
              <text class="menu-icon">⚙️</text>
            </view>
            <text class="menu-text">系统设置</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="goToHelp">
            <view class="menu-icon-wrap">
              <text class="menu-icon">❓</text>
            </view>
            <text class="menu-text">帮助中心</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="logout-section">
        <view class="logout-btn" @click="handleLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </scroll-view>

    <view class="edit-modal" v-if="showEditModal" @click="showEditModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">编辑信息</text>
          <view class="modal-close" @click="showEditModal = false">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="editableUser.nickname" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">职位</text>
            <input class="form-input" v-model="editableUser.position" placeholder="请输入职位" />
          </view>
          <view class="form-item">
            <text class="form-label">部门</text>
            <input class="form-input" v-model="editableUser.department" placeholder="请输入部门" />
          </view>
          <view class="form-item">
            <text class="form-label">邮箱</text>
            <input class="form-input" v-model="editableUser.email" placeholder="请输入邮箱" />
          </view>
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="editableUser.phone" placeholder="请输入手机号" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn btn-cancel" @click="showEditModal = false">取消</view>
          <view class="btn btn-confirm" @click="saveUserInfo">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { dataService } from '@/data/dataService'
import { getToken, clearAuth } from '@/utils/auth'
import type { Order, PointsRecord, UserInfo } from '@shared/types'

/**
 * 个人中心数据经 dataService 获取（默认走后端 API）。
 * 资料编辑经 PUT /api/users/:id 落库，积分不可通过资料编辑修改。
 */
const userInfo = ref<UserInfo>({ id: 1, nickname: '', avatar: '', points: 0 })
const orders = ref<Order[]>([])
const pointsHistory = ref<PointsRecord[]>([])
const loading = ref(false)

const showEditModal = ref(false)

const editableUser = reactive({
  nickname: '',
  position: '',
  department: '',
  employeeId: '',
  hireDate: '',
  email: '',
  phone: ''
})

/** 用服务端数据填充可编辑表单 */
const fillEditable = (u: UserInfo) => {
  editableUser.nickname = u.nickname || ''
  editableUser.position = u.position || ''
  editableUser.department = u.department || ''
  editableUser.employeeId = u.employeeId || ''
  editableUser.hireDate = u.hireDate || ''
  editableUser.email = u.email || ''
  editableUser.phone = u.phone || ''
}

const loadData = async () => {
  // 路由守卫：未登录回登录页（服务端仍会二次校验）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    const [u, o, h] = await Promise.all([
      dataService.fetchUser(),
      dataService.fetchOrders(),
      dataService.fetchPointsHistory()
    ])
    userInfo.value = u
    orders.value = o
    pointsHistory.value = h
    fillEditable(u)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 每次进入页面重新拉取，确保资料与订单统计最新
onShow(loadData)

const monthEarn = computed(() => {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return pointsHistory.value
    .filter(p => p.type === 'earn' && p.time.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.points, 0)
})

const monthSpend = computed(() => {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return pointsHistory.value
    .filter(p => p.type === 'spend' && p.time.startsWith(currentMonth))
    .reduce((sum, p) => sum + Math.abs(p.points), 0)
})

const orderCounts = computed(() => ({
  all: orders.value.length,
  pending: orders.value.filter(o => o.status === 'pending').length,
  shipped: orders.value.filter(o => o.status === 'shipped').length,
  completed: orders.value.filter(o => o.status === 'completed').length
}))

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

const saveUserInfo = async () => {
  try {
    // 资料经后端保存；积分不由本接口修改
    const updated = await dataService.updateUser(userInfo.value.id, {
      nickname: editableUser.nickname,
      position: editableUser.position,
      department: editableUser.department,
      employeeId: editableUser.employeeId,
      hireDate: editableUser.hireDate,
      email: editableUser.email,
      phone: editableUser.phone
    })
    userInfo.value = updated
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
    showEditModal.value = false
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  }
}

const goToOrders = () => {
  uni.navigateTo({ url: '/pages/orders/orders' })
}

const goToOrdersWithStatus = (status: string) => {
  uni.navigateTo({ url: `/pages/orders/orders?status=${status}` })
}

const goToFavorites = () => {
  uni.showToast({
    title: '我的收藏',
    icon: 'none'
  })
}

const goToCoupons = () => {
  uni.showToast({
    title: '优惠券',
    icon: 'none'
  })
}

const goToAddresses = () => {
  uni.showToast({
    title: '收货地址',
    icon: 'none'
  })
}

const goToSecurity = () => {
  uni.showToast({
    title: '账户安全',
    icon: 'none'
  })
}

const goToSettings = () => {
  uni.showToast({
    title: '系统设置',
    icon: 'none'
  })
}

const goToHelp = () => {
  uni.showToast({
    title: '帮助中心',
    icon: 'none'
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地登录态后回到登录页
        clearAuth()
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' })
        }, 600)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4fa 0%, #f5f7fa 100%);
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

.content-scroll {
  height: 100vh;
  padding-top: 140rpx;
}

.user-section {
  padding: 30rpx;
}

.user-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  padding: 40rpx;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(74, 124, 255, 0.3);
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.5);
  margin-right: 28rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 12rpx;
}

.position {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.edit-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon {
  font-size: 32rpx;
}

.stats-section {
  padding: 0 30rpx 30rpx;
}

.stats-card {
  display: flex;
  background: #fff;
  padding: 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 700;
  color: #4A7CFF;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #888;
}

.stat-divider {
  width: 1rpx;
  background: #f0f0f0;
}

.info-section {
  padding: 0 30rpx 30rpx;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.title-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.section-more {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.more-text {
  font-size: 26rpx;
  color: #999;
}

.more-arrow {
  font-size: 28rpx;
  color: #999;
  margin-left: 8rpx;
}

.info-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 8rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 28rpx;
  color: #888;
}

.info-value {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.order-section {
  padding: 0 30rpx 30rpx;
}

.order-stats {
  display: flex;
  background: #fff;
  padding: 28rpx 0;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.order-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
}

.order-stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #4A7CFF;
  margin-bottom: 8rpx;

  &.pending {
    color: #FF6B6B;
  }

  &.shipped {
    color: #FFB800;
  }

  &.completed {
    color: #52C41A;
  }
}

.order-stat-label {
  font-size: 24rpx;
  color: #888;
}

.menu-section {
  padding: 0 30rpx 30rpx;
}

.menu-list {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f8fafc;
  }
}

.menu-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.menu-icon {
  font-size: 40rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #1a1a1a;
}

.menu-badge {
  font-size: 22rpx;
  color: #fff;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin-right: 16rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.logout-section {
  padding: 0 30rpx 60rpx;
}

.logout-btn {
  background: #fff;
  padding: 28rpx;
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:active {
    background: #f5f5f5;
  }
}

.logout-text {
  font-size: 30rpx;
  color: #FF6B6B;
  font-weight: 500;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 40rpx;
}

.modal-content {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 32rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 32rpx;
  color: #999;
}

.modal-body {
  padding: 32rpx;
}

.form-item {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f5f5f5;
}

.btn {
  flex: 1;
  padding: 32rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 500;
  transition: all 0.3s ease;

  &:active {
    opacity: 0.8;
  }
}

.btn-cancel {
  color: #666;
  border-right: 1rpx solid #f5f5f5;
}

.btn-confirm {
  color: #4A7CFF;
}
</style>