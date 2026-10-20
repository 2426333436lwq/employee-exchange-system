<template>
  <view class="login-page">
    <view class="login-card">
      <!-- 品牌 -->
      <view class="brand">
        <view class="brand-logo"><i class="el-icon-goods">🎁</i></view>
        <text class="brand-name">积分兑换系统</text>
        <text class="brand-sub">企业员工专属福利平台</text>
      </view>

      <!-- 表单 -->
      <view class="field">
        <input
          class="input"
          v-model="username"
          placeholder="请输入账号"
          :disabled="loading"
          focus
          @confirm="handleLogin"
        />
      </view>

      <view class="field">
        <input
          class="input"
          v-model="password"
          password
          placeholder="请输入密码"
          :disabled="loading"
          @confirm="handleLogin"
        />
      </view>

      <view
        class="submit-btn"
        :class="{ disabled: loading || !canSubmit }"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登 录' }}
      </view>

      <view class="hint">
        <text class="hint-title">演示账号（点击填充）</text>
        <view class="hint-row" @click="fill('admin', 'admin123')">
          <text class="hint-role">管理员</text>
          <text class="hint-cred">admin / admin123</text>
        </view>
        <view class="hint-row" @click="fill('zhangsan', '123456')">
          <text class="hint-role">员　工</text>
          <text class="hint-cred">zhangsan / 123456</text>
        </view>
      </view>
    </view>

    <text class="copyright">企业员工积分兑换系统 © 2026</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { dataService } from '@/data/dataService'
import { isLoggedIn } from '@/utils/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)

const canSubmit = computed(() => username.value.trim().length > 0 && password.value.length > 0)

// 已登录则直接进首页，避免重复登录
if (isLoggedIn()) {
  uni.reLaunch({ url: '/pages/index/index' })
}

/** 点击演示账号快速填充 */
const fill = (u: string, p: string) => {
  username.value = u
  password.value = p
}

const handleLogin = async () => {
  if (loading.value || !canSubmit.value) return
  loading.value = true
  try {
    await dataService.login(username.value.trim(), password.value)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/index/index' })
    }, 600)
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '登录失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 与 PC 端后台登录页同源风格：浅色背景 + 居中白卡片。
   min-height:100vh = 至少占满一屏，内容更高时自然撑开；
   不要改用 height:100% 或 height:100vh（会裁切内容并锁死滚动） */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  background-image:
    radial-gradient(ellipse at top left, rgba(74, 124, 255, 0.10), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(107, 143, 255, 0.10), transparent 55%);
  padding: 48rpx;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 56rpx 48rpx 40rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
}

/* ---- 品牌 ---- */
.brand {
  text-align: center;
  margin-bottom: 44rpx;
}

.brand-logo {
  width: 108rpx;
  height: 108rpx;
  line-height: 108rpx;
  margin: 0 auto 24rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  font-size: 54rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 124, 255, 0.30);
}

.brand-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2rpx;
  margin-bottom: 10rpx;
}

.brand-sub {
  font-size: 24rpx;
  color: #909399;
}

/* ---- 表单 ---- */
.field {
  margin-bottom: 32rpx;
}

.input {
  width: 100%;
  height: 92rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  color: #1a1a1a;
  box-sizing: border-box;
}

.submit-btn {
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
  box-shadow: 0 8rpx 24rpx rgba(74, 124, 255, 0.35);
  margin-top: 12rpx;
}

.submit-btn.disabled {
  background: linear-gradient(135deg, #d0d0d0 0%, #e0e0e0 100%);
  box-shadow: none;
}

/* ---- 演示账号 ---- */
.hint {
  margin-top: 40rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid #ebeef5;
}

.hint-title {
  display: block;
  font-size: 22rpx;
  color: #909399;
  margin-bottom: 16rpx;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  margin: 0 -20rpx;
  border-radius: 12rpx;
}

.hint-row:active {
  background: #f5f8ff;
}

.hint-role {
  font-size: 22rpx;
  color: #4A7CFF;
  background: #eef3ff;
  border-radius: 6rpx;
  padding: 4rpx 14rpx;
  flex-shrink: 0;
}

.hint-cred {
  font-size: 24rpx;
  color: #606266;
}

.copyright {
  margin-top: 40rpx;
  font-size: 22rpx;
  color: #c0c4cc;
}
</style>
