<template>
  <view class="animated-banner">
    <view class="banner-wrapper">
      <view 
        class="banner-content" 
        v-for="(banner, index) in banners" 
        :key="banner.id"
        :class="{ active: currentIndex === index, fadeIn: currentIndex === index, fadeOut: prevIndex === index }"
      >
        <view class="banner-bg" :style="{ background: banner.gradient }"></view>
        <view class="banner-inner">
          <view class="banner-main-text">
            <text class="main-text">{{ banner.mainText }}</text>
            <view class="text-decoration"></view>
          </view>
          <view class="banner-sub-text">
            <text class="sub-text">{{ banner.subText }}</text>
          </view>
        </view>
        <view class="banner-decoration">
          <view class="deco-circle deco-circle-1"></view>
          <view class="deco-circle deco-circle-2"></view>
          <view class="deco-star deco-star-1">★</view>
          <view class="deco-star deco-star-2">★</view>
          <view class="deco-star deco-star-3">★</view>
        </view>
      </view>
    </view>
    <view class="banner-indicators">
      <view 
        v-for="(banner, index) in banners" 
        :key="banner.id"
        class="indicator"
        :class="{ active: currentIndex === index }"
        @click="switchBanner(index)"
      ></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface BannerItem {
  id: number
  mainText: string
  subText: string
  gradient: string
}

const banners = ref<BannerItem[]>([
  {
    id: 1,
    mainText: '超级福利',
    subText: '年终福利大派送',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF9500 50%, #FFCC00 100%)'
  },
  {
    id: 2,
    mainText: '积分翻倍',
    subText: '限时积分翻倍活动',
    gradient: 'linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 50%, #7C9FFF 100%)'
  },
  {
    id: 3,
    mainText: '新用户专享',
    subText: '新人注册送豪礼',
    gradient: 'linear-gradient(135deg, #34C759 0%, #30D158 50%, #4CD964 100%)'
  },
  {
    id: 4,
    mainText: '限时特惠',
    subText: '精选商品限时折扣',
    gradient: 'linear-gradient(135deg, #AF52DE 0%, #BF5AF2 50%, #D946EF 100%)'
  }
])

const currentIndex = ref(0)
const prevIndex = ref(-1)
let timer: number | null = null

const switchBanner = (index: number) => {
  prevIndex.value = currentIndex.value
  currentIndex.value = index
}

const nextBanner = () => {
  prevIndex.value = currentIndex.value
  currentIndex.value = (currentIndex.value + 1) % banners.value.length
}

onMounted(() => {
  timer = setInterval(nextBanner, 3000) as unknown as number
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.animated-banner {
  position: relative;
  width: 100%;
  height: 200rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.banner-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.banner-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: all 0.5s ease-in-out;
  z-index: 1;

  &:first-child:not(.fadeOut) {
    opacity: 1;
    visibility: visible;
    z-index: 3;
  }

  &.active {
    opacity: 1;
    visibility: visible;
    z-index: 3;
  }

  &.fadeIn {
    animation: fadeInScale 0.5s ease-out forwards;
  }

  &.fadeOut {
    animation: fadeOutScale 0.5s ease-out forwards;
    z-index: 2;
    opacity: 0;
    visibility: hidden;
  }
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10rpx);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeOutScale {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.02) translateY(-10rpx);
  }
}

.banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.banner-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  box-sizing: border-box;
}

.banner-main-text {
  position: relative;
  margin-bottom: 12rpx;
}

.main-text {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  text-shadow: 
    2rpx 2rpx 0 #000,
    -2rpx -2rpx 0 #000,
    2rpx -2rpx 0 #000,
    -2rpx 2rpx 0 #000,
    4rpx 4rpx 10rpx rgba(0, 0, 0, 0.5);
  letter-spacing: 8rpx;
  display: block;
  animation: textGlow 2s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% {
    text-shadow: 
      2rpx 2rpx 0 #000,
      -2rpx -2rpx 0 #000,
      2rpx -2rpx 0 #000,
      -2rpx 2rpx 0 #000,
      4rpx 4rpx 10rpx rgba(0, 0, 0, 0.5);
  }
  50% {
    text-shadow: 
      2rpx 2rpx 0 #000,
      -2rpx -2rpx 0 #000,
      2rpx -2rpx 0 #000,
      -2rpx 2rpx 0 #000,
      4rpx 4rpx 10rpx rgba(0, 0, 0, 0.5),
      0 0 30rpx rgba(255, 255, 255, 0.3);
  }
}

.text-decoration {
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 8rpx;
  background: linear-gradient(90deg, transparent, #fff, transparent);
  border-radius: 4rpx;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(-50%) scaleX(0.8);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}

.banner-sub-text {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 10rpx 30rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

.sub-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
  letter-spacing: 4rpx;
}

.banner-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);

  &.deco-circle-1 {
    width: 120rpx;
    height: 120rpx;
    top: -40rpx;
    right: -40rpx;
    animation: floatCircle1 4s ease-in-out infinite;
  }

  &.deco-circle-2 {
    width: 80rpx;
    height: 80rpx;
    bottom: -20rpx;
    left: -20rpx;
    animation: floatCircle2 5s ease-in-out infinite;
  }
}

@keyframes floatCircle1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-20rpx, 20rpx) scale(1.1);
  }
}

@keyframes floatCircle2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20rpx, -20rpx) scale(1.2);
  }
}

.deco-star {
  position: absolute;
  color: rgba(255, 255, 255, 0.4);
  font-size: 24rpx;

  &.deco-star-1 {
    top: 30rpx;
    left: 40rpx;
    animation: twinkle 2s ease-in-out infinite;
    animation-delay: 0s;
  }

  &.deco-star-2 {
    top: 50rpx;
    right: 60rpx;
    animation: twinkle 2s ease-in-out infinite;
    animation-delay: 0.5s;
  }

  &.deco-star-3 {
    bottom: 40rpx;
    right: 40rpx;
    animation: twinkle 2s ease-in-out infinite;
    animation-delay: 1s;
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.banner-indicators {
  position: absolute;
  bottom: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16rpx;
  z-index: 10;
}

.indicator {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2rpx solid rgba(255, 255, 255, 0.6);

  &.active {
    width: 32rpx;
    border-radius: 6rpx;
    background: #fff;
    box-shadow: 0 0 10rpx rgba(255, 255, 255, 0.5);
  }
}
</style>