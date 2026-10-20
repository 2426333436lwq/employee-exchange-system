<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="title">积分兑换系统</text>
        <text class="subtitle">企业员工专属福利平台</text>
      </view>
    </view>
    <view class="content">
      <view class="user-card">
        <image :src="userInfo.avatar" class="avatar" mode="aspectFill" />
        <view class="user-info">
          <text class="nickname">{{ userInfo.nickname }}</text>
          <text class="points">{{ appState.userPoints }}</text>
        </view>
        <view class="user-arrow" @click="goToProfile">
          <text class="arrow-icon">›</text>
        </view>
      </view>
      <view class="quick-stats">
        <view class="stat-item">
          <text class="stat-value">{{ appState.totalExchanged }}</text>
          <text class="stat-label">累计兑换</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ appState.totalEarned }}</text>
          <text class="stat-label">累计获得</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ appState.totalSpent }}</text>
          <text class="stat-label">累计消费</text>
        </view>
      </view>
      <view class="menu-grid">
        <view class="menu-item" @click="goToMall">
          <view class="menu-icon-wrap">
            <text class="menu-icon">🛒</text>
          </view>
          <text class="menu-text">福利商城</text>
          <text class="menu-badge" v-if="appState.onlineProducts > 0">{{ appState.onlineProducts }}</text>
        </view>
        <view class="menu-item" @click="goToOrders">
          <view class="menu-icon-wrap">
            <text class="menu-icon">📋</text>
          </view>
          <text class="menu-text">我的兑换</text>
          <text class="menu-badge" v-if="appState.pendingOrders > 0">{{ appState.pendingOrders }}</text>
        </view>
        <view class="menu-item" @click="goToPoints">
          <view class="menu-icon-wrap">
            <text class="menu-icon">📊</text>
          </view>
          <text class="menu-text">积分明细</text>
          <text class="menu-badge" v-if="appState.todayPointsChanges > 0">{{ appState.todayPointsChanges }}</text>
        </view>
        <view class="menu-item" @click="goToRule">
          <view class="menu-icon-wrap">
            <text class="menu-icon">📖</text>
          </view>
          <text class="menu-text">积分规则</text>
          <text class="menu-badge" v-if="appState.ruleVersion > 0">{{ appState.ruleVersion }}</text>
        </view>
      </view>
      <view class="animated-banner-section">
        <AnimatedBanner />
      </view>
      <view class="product-list">
        <view class="section-header">
          <text class="section-title">热门商品</text>
          <view class="section-more" @click="goToMall">
            <text class="more-text">查看更多</text>
            <text class="more-arrow">›</text>
          </view>
        </view>
        <view class="products-grid">
          <view class="product-card" v-for="(product, index) in hotProducts" :key="product.id" @click="goToProduct(product.id)">
            <view class="product-image-wrap">
              <image :src="product.image" class="product-image" mode="aspectFill" />
              <view v-if="product.isTop" class="product-badge">置顶</view>
            </view>
            <view class="product-info">
              <view class="product-name">{{ product.name }}</view>
              <view class="product-desc">{{ product.brand }}</view>
              <view class="product-bottom">
                <view class="product-points">{{ product.points }}</view>
                <view class="product-sales">月销{{ product.monthlySales }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="category-section">
        <view class="section-header">
          <text class="section-title">分类导航</text>
        </view>
        <view class="category-grid">
          <view class="category-item" v-for="cat in categories" :key="cat.id" @click="goToMallWithCategory(cat.id)">
            <view class="category-icon">{{ cat.icon }}</view>
            <text class="category-name">{{ cat.name }}</text>
          </view>
        </view>
      </view>
      <view class="tips-card">
        <view class="tips-icon">💡</view>
        <view class="tips-content">
          <text class="tips-title">温馨提示</text>
          <text class="tips-text">积分有效期为12个月，请及时兑换心仪商品哦~</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AnimatedBanner from '@/components/AnimatedBanner.vue'
import { appState, appActions } from '@/stores/appStore'
import { dataService } from '@/data/dataService'
import { getToken } from '@/utils/auth'
import type { Product, Category, UserInfo } from '@shared/types'

/**
 * 数据经 dataService 获取（默认走后端 API）。
 * 页面不再直接依赖 mockData，数据源可无缝切换。
 */
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const userInfo = ref<UserInfo>({ id: 1, nickname: '', avatar: '', points: 0 })
const loading = ref(false)
const loadError = ref('')

const loadData = async () => {
  // 路由守卫：未登录直接回登录页
  // （服务端仍会二次校验，此处仅为体验优化）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const [p, c, u, s] = await Promise.all([
      dataService.fetchOnlineProducts(),
      dataService.fetchCategories(),
      dataService.fetchUser(),
      dataService.fetchStats()
    ])
    products.value = p
    categories.value = c
    userInfo.value = u
    // 统计数据直接采用服务端口径，避免前端重复计算产生偏差
    appActions.setOnlineProducts(s.onlineProducts)
    appActions.setPendingOrders(s.pendingOrders)
    appActions.setTodayPointsChanges(s.todayPointsChanges)
    appActions.setUserPoints(u.points)
    appActions.setTotalExchanged(s.totalExchanged)
    appActions.setTotalEarned(s.totalEarned)
    appActions.setTotalSpent(s.totalSpent)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
    uni.showToast({ title: loadError.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 计算实时数据
// 取 4 个填满两列网格的两行；后台置顶数不足时自适应展示，
// auto-fill 网格保证无论几个都不会出现空格或挤压
const hotProducts = computed(() => {
  return products.value
    .filter(p => p.isTop && p.status === 'online')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 4)
})

const goToMall = () => {
  uni.navigateTo({ url: '/pages/mall/mall' })
}

const goToOrders = () => {
  uni.navigateTo({ url: '/pages/orders/orders' })
}

const goToPoints = () => {
  uni.navigateTo({ url: '/pages/points/detail' })
}

const goToRule = () => {
  uni.navigateTo({ url: '/pages/rule/rule' })
}

const goToProduct = (id: number) => {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

const goToProfile = () => {
  uni.navigateTo({ url: '/pages/profile/profile' })
}

const goToMallWithCategory = (categoryId: number) => {
  uni.navigateTo({ url: `/pages/mall/mall?category=${categoryId}` })
}

// 首次进入加载数据
onMounted(loadData)

// 每次页面显示时重新拉取，确保「后台改动 -> 前台可见」
onShow(loadData)
</script>

<style lang="scss" scoped>
/* min-height:100vh 表示「至少占满一屏」，内容更高时自然撑开并滚动；
   切勿用 height:100% / height:100vh，否则超出部分被裁切且无法滚动 */
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4fa 0%, #f5f7fa 100%);
  width: 100%;
  box-sizing: border-box;
  padding: 0;
}

.header {
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 50%, #7C9FFF 100%);
  padding: 80rpx 30rpx 90rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: 15px;
  width: 300rpx;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.header-content {
  position: relative;
  z-index: 1;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  letter-spacing: 6rpx;
  display: block;
  margin-bottom: 16rpx;
}

.title::before {
  content: '🎁';
  margin-right: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2rpx;
}

.content {
  padding: 0 30rpx 30rpx;
  margin-top: -48rpx;
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
}

.user-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 32rpx;
  border-radius: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(74, 124, 255, 0.12);
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 15px;
  width: 180rpx;
  height: 180rpx;
  background: linear-gradient(135deg, rgba(74, 124, 255, 0.05) 0%, rgba(74, 124, 255, 0.1) 100%);
  border-radius: 0 0 0 100%;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
}

.user-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 10rpx;
}

.points {
  font-size: 34rpx;
  color: #FF6B6B;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.points::before {
  content: '💎';
  margin-right: 10rpx;
  font-size: 30rpx;
}

.user-arrow {
  width: 64rpx;
  height: 64rpx;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.arrow-icon {
  font-size: 40rpx;
  color: #999;
}

.quick-stats {
  display: flex;
  background: #fff;
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  width: 100%;
  box-sizing: border-box;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
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

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  padding: 32rpx 16rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 0;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.menu-item:active {
  transform: scale(0.95);
  background: rgba(74, 124, 255, 0.05);
}

.menu-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  box-shadow: 0 4rpx 12rpx rgba(74, 124, 255, 0.1);
}

.menu-icon {
  font-size: 52rpx;
}

.menu-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.menu-badge {
  font-size: 22rpx;
  color: #fff;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  font-weight: 500;
}

.animated-banner-section {
  margin-bottom: 24rpx;
  width: 100%;
}

.product-list {
  background: #fff;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  width: 100%;
  box-sizing: border-box;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  width: 6rpx;
  height: 32rpx;
  background: linear-gradient(180deg, #4A7CFF 0%, #6B8FFF 100%);
  border-radius: 3rpx;
  margin-right: 14rpx;
}

.section-more {
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

/*
 * 热门商品网格：自适应列数
 *
 * 用 auto-fill + minmax 让列数随容器宽度自动变化：
 *   - 375px 屏约 2 列，更宽屏自动 3 列
 * 好处是「置顶商品数量由后台可配」，无论 1 个还是 4 个，
 * 网格都不会出现「空格」或「被挤压」的失衡布局。
 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260rpx, 1fr));
  gap: 20rpx;
  background: #f5f7fa;
  border-radius: 20rpx;
  padding: 16rpx;
}

.product-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.product-card:active {
  transform: scale(0.97);
}

.product-image-wrap {
  position: relative;
}

.product-image {
  width: 100%;
  height: 240rpx;
  border-radius: 0;
  display: block;
}

.product-badge {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  background: linear-gradient(135deg, #FF9500 0%, #FF6B35 100%);
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  font-weight: 600;
}

.product-info {
  padding: 16rpx 18rpx 18rpx;
}

.product-name {
  font-size: 26rpx;
  color: #1a1a1a;
  font-weight: 600;
  margin-bottom: 10rpx;
  /* 两列宽度足够，单行截断比折两行更利落 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.product-desc {
  font-size: 21rpx;
  color: #999;
  margin-bottom: 12rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-points {
  font-size: 30rpx;
  color: #FF6B6B;
  font-weight: 700;
  line-height: 1;
}

.product-points::before {
  content: '💎';
  font-size: 20rpx;
  margin-right: 3rpx;
}

.product-sales {
  font-size: 19rpx;
  color: #999;
}

.category-section {
  background: #fff;
  padding: 28rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  width: 100%;
  box-sizing: border-box;
}

.category-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0;
}

.category-item:active {
  background: #f0f6ff;
}

.category-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.category-name {
  font-size: 26rpx;
  color: #333;
  text-align: center;
  white-space: nowrap;
}

.tips-card {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CD 100%);
  padding: 28rpx;
  border-radius: 20rpx;
  border: 2rpx solid #FFE4B5;
  margin-bottom: 30rpx;
  width: 100%;
  box-sizing: border-box;
}

.tips-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.tips-content {
  flex: 1;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #8B4513;
  display: block;
  margin-bottom: 8rpx;
}

.tips-text {
  font-size: 26rpx;
  color: #A0522D;
  line-height: 1.5;
}
</style>
