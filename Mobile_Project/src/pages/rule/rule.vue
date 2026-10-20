<template>
  <view class="page-container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">积分规则</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="rule-card">
        <view class="card-header">
          <text class="header-icon">📈</text>
          <text class="header-title">积分获取规则</text>
        </view>
        <view class="rule-list">
          <view class="rule-item">
            <text class="rule-num">1</text>
            <view class="rule-content">
              <text class="rule-title">每日签到</text>
              <text class="rule-desc">每日登录签到可获得10积分</text>
            </view>
            <text class="rule-points">+10</text>
          </view>
          <view class="rule-item">
            <text class="rule-num">2</text>
            <view class="rule-content">
              <text class="rule-title">完成任务</text>
              <text class="rule-desc">完成系统指定任务可获得相应积分奖励</text>
            </view>
            <text class="rule-points">+50~200</text>
          </view>
          <view class="rule-item">
            <text class="rule-num">3</text>
            <view class="rule-content">
              <text class="rule-title">月度奖励</text>
              <text class="rule-desc">每月累计签到满20天可获得额外200积分</text>
            </view>
            <text class="rule-points">+200</text>
          </view>
          <view class="rule-item">
            <text class="rule-num">4</text>
            <view class="rule-content">
              <text class="rule-title">推荐奖励</text>
              <text class="rule-desc">邀请好友注册成功可获得100积分</text>
            </view>
            <text class="rule-points">+100</text>
          </view>
        </view>
      </view>

      <view class="rule-card">
        <view class="card-header">
          <text class="header-icon">🛒</text>
          <text class="header-title">积分使用规则</text>
        </view>
        <view class="rule-list">
          <view class="rule-item">
            <text class="rule-num">1</text>
            <view class="rule-content">
              <text class="rule-title">兑换商品</text>
              <text class="rule-desc">使用积分兑换福利商城中的商品</text>
            </view>
            <text class="rule-points">-</text>
          </view>
          <view class="rule-item">
            <text class="rule-num">2</text>
            <view class="rule-content">
              <text class="rule-title">服务兑换</text>
              <text class="rule-desc">使用积分兑换生活服务（如洗车、保洁等）</text>
            </view>
            <text class="rule-points">-</text>
          </view>
          <view class="rule-item">
            <text class="rule-num">3</text>
            <view class="rule-content">
              <text class="rule-title">虚拟商品</text>
              <text class="rule-desc">使用积分兑换视频会员、话费充值等虚拟商品</text>
            </view>
            <text class="rule-points">-</text>
          </view>
        </view>
      </view>

      <view class="rule-card">
        <view class="card-header">
          <text class="header-icon">⚠️</text>
          <text class="header-title">积分有效期</text>
        </view>
        <view class="rule-desc-text">
          <text>积分自获取之日起，有效期为<span class="highlight">12个月</span>。</text>
        </view>
        <view class="rule-desc-text">
          <text>每年<span class="highlight">12月31日</span>将清零当年1月1日之前获取的积分。</text>
        </view>
      </view>

      <view class="rule-card">
        <view class="card-header">
          <text class="header-icon">❓</text>
          <text class="header-title">常见问题</text>
        </view>
        <view class="faq-list">
          <view class="faq-item" @click="toggleFaq(0)">
            <view class="faq-header">
              <text class="faq-question">积分可以转让给他人吗？</text>
              <text class="faq-arrow" :class="{ open: faqOpen[0] }">▼</text>
            </view>
            <view v-if="faqOpen[0]" class="faq-answer">
              <text>积分仅限本人使用，不可转让、兑换现金或赠予他人。</text>
            </view>
          </view>
          <view class="faq-item" @click="toggleFaq(1)">
            <view class="faq-header">
              <text class="faq-question">兑换商品后积分会退回吗？</text>
              <text class="faq-arrow" :class="{ open: faqOpen[1] }">▼</text>
            </view>
            <view v-if="faqOpen[1]" class="faq-answer">
              <text>订单一旦提交，积分将立即扣除。如订单取消或商品退货，积分将在7个工作日内退回。</text>
            </view>
          </view>
          <view class="faq-item" @click="toggleFaq(2)">
            <view class="faq-header">
              <text class="faq-question">如何查询积分明细？</text>
              <text class="faq-arrow" :class="{ open: faqOpen[2] }">▼</text>
            </view>
            <view v-if="faqOpen[2]" class="faq-answer">
              <text>在首页点击"积分明细"按钮，即可查看所有积分获取和消耗记录。</text>
            </view>
          </view>
        </view>
      </view>

      <view class="contact-section">
        <view class="icon-box">
          <text>💬</text>
        </view>
        <text class="contact-title">联系客服</text>
        <text class="contact-info">如有疑问，请联系客服：</text>
        <text class="contact-phone">📞 400-888-8888</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const faqOpen = ref([false, false, false])

const toggleFaq = (index: number) => {
  faqOpen.value[index] = !faqOpen.value[index]
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

.content-scroll {
  height: calc(100vh - 190rpx);
  padding: 150rpx 30rpx 30rpx;
  box-sizing: border-box;
}

.rule-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.header-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.rule-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fafafa;
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.rule-item:active {
  background: #f0f6ff;
}

.rule-num {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  margin-right: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(74, 124, 255, 0.3);
}

.rule-content {
  flex: 1;
}

.rule-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.rule-desc {
  font-size: 26rpx;
  color: #888;
}

.rule-points {
  font-size: 32rpx;
  font-weight: 700;
  color: #34C759;
}

.rule-desc-text {
  font-size: 30rpx;
  color: #5a5a5a;
  line-height: 2;
  margin-bottom: 20rpx;
}

.highlight {
  color: #FF6B6B;
  font-weight: 700;
  font-size: 32rpx;
}

.faq-list {
  display: flex;
  flex-direction: column;
}

.faq-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  transition: all 0.3s ease;
}

.faq-item:active {
  background: #fafafa;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-question {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 500;
}

.faq-arrow {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s ease;
}

.faq-arrow.open {
  transform: rotate(180deg);
}

.faq-answer {
  padding-top: 20rpx;
  padding-left: 24rpx;
}

.faq-answer text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.contact-section {
  background: linear-gradient(135deg, #fff 0%, #fafbfc 100%);
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.contact-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 20rpx;
}

.contact-info {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.contact-phone {
  font-size: 36rpx;
  color: #4A7CFF;
  font-weight: 600;
}

.icon-box {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 124, 255, 0.3);
}

.icon-box text {
  font-size: 40rpx;
}
</style>
