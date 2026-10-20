<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">商品详情</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view v-if="product" class="product-detail">
        <image :src="product.image" class="product-main-image" mode="aspectFill" />
        
        <view class="product-header">
          <text class="product-name">{{ product.name }}</text>
          <view class="product-tags">
            <view v-if="product.isTop" class="tag tag-top">置顶</view>
            <view class="tag tag-category">{{ product.categoryName }}</view>
          </view>
        </view>

        <view class="product-price">
          <text class="price-label">兑换积分</text>
          <view class="price-value-wrap">
            <text class="price-symbol">💎</text>
            <text class="price-value">{{ product.points }}</text>
            <text class="price-unit">积分</text>
          </view>
          <text class="stock">库存: {{ product.stock }}</text>
        </view>

        <view class="product-info-card">
          <view class="info-row">
            <text class="info-label">品牌</text>
            <text class="info-value">{{ product.brand }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">月销量</text>
            <text class="info-value">{{ product.monthlySales }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">评分</text>
            <text class="info-value">{{ product.rating }}分 ({{ product.reviewCount }}条评价)</text>
          </view>
        </view>

        <view class="product-desc-card">
          <view class="card-title">
            <text class="title-icon">📝</text>
            <text class="title-text">商品介绍</text>
          </view>
          <text class="desc-content">{{ product.description }}</text>
        </view>

        <view class="product-specs-card">
          <view class="card-title">
            <text class="title-icon">📦</text>
            <text class="title-text">规格参数</text>
          </view>
          <view class="specs-list">
            <view v-for="(value, key) in product.specs" :key="key" class="spec-item">
              <text class="spec-key">{{ formatSpecKey(key) }}</text>
              <text class="spec-value">{{ value }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <view class="bottom-left">
        <text class="user-points">我的积分</text>
        <text class="user-points-value">💎 {{ userInfo.points }}</text>
      </view>
      <view 
        class="exchange-btn" 
        :class="{ disabled: userInfo.points < (product?.points || 0) }"
        @click="handleExchange"
      >
        {{ userInfo.points < (product?.points || 0) ? '积分不足' : '立即兑换' }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { specLabel } from '@shared/types'
import type { Product, UserInfo } from '@shared/types'
import { dataService } from '@/data/dataService'
import { appActions } from '@/stores/appStore'
import { getToken } from '@/utils/auth'

/**
 * 商品与用户信息经 dataService 获取（默认走后端 API）。
 * 兑换由服务端完成「校验 -> 扣库存 -> 扣积分 -> 记流水 -> 建单」事务，
 * 前端不再自行扣减，避免与后端不一致。
 */
const product = ref<Product | null>(null)
const userInfo = ref<UserInfo>({ id: 1, nickname: '', avatar: '', points: 0 })

onLoad(async (options) => {
  // 路由守卫：未登录回登录页（服务端仍会二次校验）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  const id = parseInt(options?.id || '1')
  try {
    const [p, u] = await Promise.all([
      dataService.fetchProduct(id),
      dataService.fetchUser()
    ])
    product.value = p
    userInfo.value = u
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
  }
})

// 规格键中文标签统一由共享契约提供，避免两端各维护一份 keyMap
const formatSpecKey = specLabel

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

const handleExchange = () => {
  if (!product.value) return
  const target = product.value

  if (target.stock <= 0) {
    uni.showToast({ title: '商品已售罄', icon: 'none' })
    return
  }

  if (userInfo.value.points < target.points) {
    uni.showToast({ title: '积分不足', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认兑换',
    content: `确定使用 ${target.points} 积分兑换 "${target.name}" 吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await dataService.createOrder({
          productId: target.id,
          userName: userInfo.value.nickname
        })
        appActions.setUserPoints(result.userPoints)
        // 同步本地展示的库存
        target.stock -= 1

        uni.showToast({ title: '兑换成功', icon: 'success' })

        setTimeout(() => {
          uni.navigateTo({ url: '/pages/orders/orders' })
        }, 1500)
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '兑换失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
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

.content-scroll {
  height: calc(100vh - 180rpx);
  padding-top: 150rpx;
}

.product-detail {
  padding: 0 30rpx 180rpx;
}

.product-main-image {
  width: 100%;
  height: 640rpx;
  border-radius: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.product-header {
  margin-bottom: 28rpx;
}

.product-name {
  font-size: 42rpx;
  font-weight: 700;
  color: #1a1a1a;
  display: block;
  margin-bottom: 20rpx;
  line-height: 1.4;
}

.product-tags {
  display: flex;
  gap: 20rpx;
}

.tag {
  padding: 10rpx 24rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 500;
}

.tag-top {
  background: linear-gradient(135deg, #fff8f0 0%, #ffe8d4 100%);
  color: #FF9500;
}

.tag-category {
  background: linear-gradient(135deg, #f0f6ff 0%, #e8f0fe 100%);
  color: #4A7CFF;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
  padding: 36rpx;
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  border-radius: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.price-label {
  font-size: 30rpx;
  color: #666;
  font-weight: 500;
}

.price-value-wrap {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 32rpx;
  color: #FF6B6B;
  font-weight: 600;
}

.price-value {
  font-size: 64rpx;
  font-weight: 700;
  color: #FF6B6B;
}

.price-unit {
  font-size: 28rpx;
  color: #FF6B6B;
  margin-left: 8rpx;
}

.stock {
  font-size: 28rpx;
  color: #888;
  margin-left: auto;
  padding: 10rpx 20rpx;
  background: #f5f7fa;
  border-radius: 20rpx;
}

.product-info-card, .product-desc-card, .product-specs-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-title {
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.title-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 30rpx;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.desc-content {
  font-size: 30rpx;
  color: #5a5a5a;
  line-height: 2;
}

.specs-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #fafafa;
  border-radius: 16rpx;
}

.spec-key {
  font-size: 30rpx;
  color: #666;
  font-weight: 500;
}

.spec-value {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.bottom-left {
  flex: 1;
}

.user-points {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.user-points-value {
  font-size: 36rpx;
  color: #FF6B6B;
  font-weight: 700;
}

.exchange-btn {
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  padding: 28rpx 72rpx;
  border-radius: 48rpx;
  font-size: 34rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 28rpx rgba(74, 124, 255, 0.35);
  transition: all 0.3s ease;
}

.exchange-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.exchange-btn.disabled {
  background: linear-gradient(135deg, #d0d0d0 0%, #e0e0e0 100%);
  box-shadow: none;
}
</style>
