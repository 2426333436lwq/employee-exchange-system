<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">福利商城</text>
      <view class="nav-placeholder"></view>
    </view>
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索商品名称"
          @confirm="handleSearch"
        />
      </view>
    </view>

    <view class="filter-section">
      <scroll-view scroll-x :show-scrollbar="false" scroll-with-animation class="filter-scroll">
        <view class="filter-tabs">
          <view 
            class="filter-tab" 
            :class="{ active: selectedCategory === '0' }"
            @click="selectedCategory = '0'"
          >
            全部
          </view>
          <view 
            v-for="cat in categories" 
            :key="cat.id"
            class="filter-tab"
            :class="{ active: selectedCategory === String(cat.id) }"
            @click="selectedCategory = String(cat.id)"
          >
            {{ cat.icon }} {{ cat.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="price-filter">
      <text class="filter-label">积分区间</text>
      <view class="price-options">
        <view 
          class="price-option" 
          :class="{ active: selectedPriceRange === 'all' }"
          @click="selectedPriceRange = 'all'"
        >
          全部
        </view>
        <view 
          class="price-option" 
          :class="{ active: selectedPriceRange === '0-200' }"
          @click="selectedPriceRange = '0-200'"
        >
          0-200
        </view>
        <view 
          class="price-option" 
          :class="{ active: selectedPriceRange === '200-500' }"
          @click="selectedPriceRange = '200-500'"
        >
          200-500
        </view>
        <view 
          class="price-option" 
          :class="{ active: selectedPriceRange === '500+' }"
          @click="selectedPriceRange = '500+'"
        >
          500+
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="products-scroll">
      <view class="products-grid">
        <view 
          class="product-card" 
          v-for="product in filteredProducts" 
          :key="product.id"
          @click="goToProduct(product.id)"
        >
          <view class="product-image-wrap">
            <image :src="product.image" class="product-image" mode="aspectFill" />
            <view v-if="product.isTop" class="top-tag">置顶</view>
          </view>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <view class="product-meta">
              <text class="product-brand">{{ product.brand }}</text>
              <text class="product-sales">月销 {{ product.monthlySales }}</text>
            </view>
            <view class="product-footer">
              <text class="product-points">{{ product.points }} 积分</text>
              <text class="product-stock">库存: {{ product.stock }}</text>
            </view>
            <view class="btn-container">
              <view class="exchange-btn" @click.stop="goToProduct(product.id)">立即兑换</view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="filteredProducts.length === 0" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无商品</text>
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
import type { Product, Category } from '@shared/types'

/**
 * 商城数据经 dataService 获取（默认走后端 API）。
 * 服务端 /products/online 已只返回上架商品，前端不再重复过滤。
 */
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)

const loadData = async () => {
  // 路由守卫：未登录回登录页（服务端仍会二次校验）
  if (!getToken()) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loading.value = true
  try {
    const [p, c] = await Promise.all([
      dataService.fetchOnlineProducts(),
      dataService.fetchCategories()
    ])
    products.value = p
    categories.value = c
    appActions.setOnlineProducts(p.length)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const searchKeyword = ref('')
const selectedCategory = ref('0')
const selectedPriceRange = ref('all')

onLoad((options?: Record<string, any>) => {
  if (options?.category) {
    selectedCategory.value = String(options.category)
  }
})

// 每次进入页面重新拉取，确保后台上下架及时反映
onShow(loadData)

const filteredProducts = computed(() => {
  let result = products.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.brand.toLowerCase().includes(keyword)
    )
  }

  if (selectedCategory.value !== '0') {
    result = result.filter(p => p.categoryId === parseInt(selectedCategory.value))
  }

  if (selectedPriceRange.value !== 'all') {
    const [min, max] = selectedPriceRange.value.split('-').map(v => {
      if (v === '500+') return Infinity
      return parseInt(v) || 0
    })
    if (selectedPriceRange.value === '500+') {
      result = result.filter(p => p.points >= 500)
    } else {
      result = result.filter(p => p.points >= min && p.points <= max)
    }
  }

  result.sort((a, b) => {
    if (a.isTop !== b.isTop) return a.isTop ? -1 : 1
    return a.sortOrder - b.sortOrder
  })

  return result
})

// 搜索由 filteredProducts 计算属性实时驱动，此处仅响应回车确认事件
const handleSearch = () => {}

const goToProduct = (id: number) => {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
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
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4fa 0%, #f5f7fa 100%);
  padding-bottom: 10px;
  padding-top: 10px;
  width: 100%;
  box-sizing: border-box;
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

.search-bar {
  padding: 160rpx 30rpx 20rpx;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f7fa 100%);
  border-radius: 48rpx;
  padding: 24rpx 32rpx;
  box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 34rpx;
  margin-right: 20rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  background: transparent;
  color: #333;
}

.filter-section {
  background: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

.filter-scroll {
  white-space: nowrap;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-tabs {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 20rpx;
}

.filter-tab {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4fa 100%);
  border-radius: 44rpx;
  font-size: 28rpx;
  color: #5a5a5a;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-tab.active {
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(74, 124, 255, 0.3);
}

.price-filter {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.filter-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.price-options {
  display: flex;
  gap: 16rpx;
}

.price-option {
  padding: 12rpx 24rpx;
  background: #f5f7fa;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #5a5a5a;
  font-weight: 500;
  transition: all 0.3s ease;
}

.price-option.active {
  background: linear-gradient(135deg, #E8F0FE 0%, #dbe8fd 100%);
  color: #4A7CFF;
  border: 2rpx solid #4A7CFF;
}

.products-scroll {
  height: calc(100vh - 400rpx);
  padding: 20rpx;
  box-sizing: border-box;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.product-card {
  width: 100%;
  background: #fff;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.product-card:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.product-image-wrap {
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 260rpx;
  transition: transform 0.4s ease;
}

.product-card:active .product-image {
  transform: scale(1.05);
}

.top-tag {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: linear-gradient(135deg, #FF9500 0%, #FF6B35 100%);
  color: #fff;
  padding: 10rpx 20rpx;
  border-radius: 14rpx;
  font-size: 22rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 149, 0, 0.3);
}

.product-info {
  padding: 24rpx;
}

.product-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.product-brand {
  font-size: 24rpx;
  color: #888;
  background: #f5f7fa;
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
}

.product-sales {
  font-size: 24rpx;
  color: #888;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.product-points {
  color: #FF6B6B;
  font-weight: 700;
  font-size: 34rpx;
}

.product-points::before {
  content: '';
  display: inline-block;
  width: 4rpx;
  height: 28rpx;
  background: #FF6B6B;
  border-radius: 2rpx;
  margin-right: 10rpx;
  vertical-align: middle;
}

.product-stock {
  font-size: 24rpx;
  color: #888;
}

.btn-container {
  padding: 0 24rpx 24rpx;
  display: flex;
  justify-content: center;
}

.exchange-btn {
  width: 80%;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  padding: 20rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 8rpx 24rpx rgba(74, 124, 255, 0.3);
  transition: all 0.3s ease;
}

.exchange-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}
</style>
