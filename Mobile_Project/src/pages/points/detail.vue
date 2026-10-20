<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">积分明细</text>
      <view class="nav-placeholder"></view>
    </view>

    <view class="points-summary">
      <view class="summary-card">
        <text class="summary-label">当前积分</text>
        <view class="summary-value-wrap">
          <text class="summary-icon">💎</text>
          <text class="summary-value">{{ userInfo.points }}</text>
          <text class="summary-unit">积分</text>
        </view>
        <view class="summary-row">
          <view class="summary-item">
            <text class="item-label">累计获得</text>
            <text class="item-value earn">+{{ totalEarn }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">累计消耗</text>
            <text class="item-value spend">-{{ totalSpend }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="filter-tabs">
      <view 
        class="filter-tab" 
        :class="{ active: activeFilter === 'all' }"
        @click="activeFilter = 'all'"
      >
        全部
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: activeFilter === 'earn' }"
        @click="activeFilter = 'earn'"
      >
        获得
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: activeFilter === 'spend' }"
        @click="activeFilter = 'spend'"
      >
        消耗
      </view>
    </view>

    <scroll-view scroll-y class="history-scroll">
      <view v-if="filteredHistory.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无积分记录</text>
      </view>
      <view 
        v-for="item in filteredHistory" 
        :key="item.id"
        class="history-item"
      >
        <view class="history-icon" :class="item.type">
          <text>{{ item.type === 'earn' ? '+' : '-' }}</text>
        </view>
        <view class="history-info">
          <text class="history-desc">{{ item.description }}</text>
          <text class="history-time">{{ item.time }}</text>
        </view>
        <text class="history-points" :class="item.type">
          {{ item.type === 'earn' ? '+' : '' }}{{ item.points }}
        </text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { appActions } from '@/stores/appStore'
import { dataService } from '@/data/dataService'
import { dateKeyOf, todayKey } from '@/utils/date'
import { getToken } from '@/utils/auth'
import type { PointsRecord, UserInfo } from '@shared/types'

/**
 * 积分明细经 dataService 获取（默认走后端 API）。
 * 今日变动次数与累计统计由前端按需派生（后端 /api/stats 亦提供同口径数据）。
 */
const pointsHistory = ref<PointsRecord[]>([])
const userInfo = ref<UserInfo>({ id: 1, nickname: '', avatar: '', points: 0 })
const loading = ref(false)

const loadData = async () => {
  // 路由守卫：未登录回登录页（服务端仍会二次校验）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    const [h, u] = await Promise.all([
      dataService.fetchPointsHistory(),
      dataService.fetchUser()
    ])
    pointsHistory.value = h
    userInfo.value = u
    appActions.setTodayPointsChanges(todayChanges.value)
    appActions.setTotalEarned(totalEarn.value)
    appActions.setTotalSpent(totalSpend.value)
    appActions.setUserPoints(u.points)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 每次进入页面重新拉取，确保兑换/取消后流水及时更新
onShow(loadData)

const activeFilter = ref('all')

const filteredHistory = computed(() => {
  if (activeFilter.value === 'all') {
    return pointsHistory.value
  }
  return pointsHistory.value.filter(h => h.type === activeFilter.value)
})

const totalEarn = computed(() => {
  return pointsHistory.value.filter(h => h.type === 'earn').reduce((sum, h) => sum + h.points, 0)
})

const totalSpend = computed(() => {
  // points 为负数，取绝对值作为消费总额
  return pointsHistory.value.filter(h => h.type === 'spend').reduce((sum, h) => sum + Math.abs(h.points), 0)
})

// 计算今日积分变动次数（字符串日期键比较，跨端安全）
const todayChanges = computed(() => {
  const today = todayKey()
  return pointsHistory.value.filter(p => dateKeyOf(p.time) === today).length
})

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
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4fa 0%, #f5f7fa 100%);
  padding: 0;
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

.points-summary {
  padding: 100rpx 30rpx 20rpx;
}

.summary-card {
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 50%, #7C9FFF 100%);
  border-radius: 32rpx;
  padding: 36rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12rpx 40rpx rgba(74, 124, 255, 0.3);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.summary-card::after {
  content: '';
  position: absolute;
  bottom: -20%;
  left: -10%;
  width: 150rpx;
  height: 150rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.summary-label {
  font-size: 30rpx;
  opacity: 0.9;
  display: block;
  margin-bottom: 16rpx;
  position: relative;
  z-index: 1;
}

.summary-value-wrap {
  display: flex;
  align-items: baseline;
  position: relative;
  z-index: 1;
  margin-bottom: 40rpx;
}

.summary-icon {
  font-size: 48rpx;
  margin-right: 12rpx;
}

.summary-value {
  font-size: 72rpx;
  font-weight: 700;
}

.summary-unit {
  font-size: 28rpx;
  opacity: 0.8;
  margin-left: 8rpx;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  position: relative;
  z-index: 1;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.summary-item {
  text-align: center;
}

.item-label {
  font-size: 28rpx;
  opacity: 0.8;
  display: block;
  margin-bottom: 12rpx;
}

.item-value {
  font-size: 36rpx;
  font-weight: 600;
}

.item-value.earn {
  color: #A8E6CF;
}

.item-value.spend {
  color: #FFD3B6;
}

.filter-tabs {
  display: flex;
  padding: 0 30rpx;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  font-size: 30rpx;
  color: #5a5a5a;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.filter-tab.active {
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  box-shadow: 0 6rpx 20rpx rgba(74, 124, 255, 0.3);
}

.history-scroll {
  height: calc(100vh - 400rpx);
  padding: 0 30rpx;
  box-sizing: border-box;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-radius: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.history-item:active {
  transform: scale(0.99);
}

.history-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  margin-right: 28rpx;
}

.history-icon.earn {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  color: #34C759;
}

.history-icon.spend {
  background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
  color: #FF6B6B;
}

.history-info {
  flex: 1;
}

.history-desc {
  font-size: 32rpx;
  color: #1a1a1a;
  font-weight: 500;
  display: block;
  margin-bottom: 10rpx;
}

.history-time {
  font-size: 26rpx;
  color: #999;
}

.history-points {
  font-size: 36rpx;
  font-weight: 700;
}

.history-points.earn {
  color: #34C759;
}

.history-points.spend {
  color: #FF6B6B;
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
</style>
