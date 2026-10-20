<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 品牌头部 -->
      <div class="brand">
        <div class="brand-logo"><i class="el-icon-goods"></i></div>
        <h1 class="brand-name">积分管理系统</h1>
        <p class="brand-sub">企业员工积分兑换系统 · 后台管理端</p>
      </div>

      <!-- 表单 -->
      <el-form :model="form" @submit.native.prevent>
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="账号"
            prefix-icon="el-icon-user"
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="el-icon-lock"
            show-password
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登 录 中 ...' : '登 录' }}
        </el-button>
      </el-form>

      <!-- 演示账号 -->
      <div class="hint">
        <div class="hint-row" @click="fillAccount('admin', 'admin123')">
          <el-tag size="mini" type="primary">管理员</el-tag>
          <span class="hint-cred">admin / admin123</span>
          <i class="el-icon-right"></i>
        </div>
        <div class="hint-row" @click="fillAccount('zhangsan', '123456')">
          <el-tag size="mini" type="info">员　工</el-tag>
          <span class="hint-cred">zhangsan / 123456（无后台权限）</span>
          <i class="el-icon-right"></i>
        </div>
      </div>
    </div>

    <p class="copyright">企业员工积分兑换系统 © 2026</p>
  </div>
</template>

<script>
import { adminService } from '../services/dataService';
import { setAuth } from '../utils/auth';

export default {
  name: 'LoginView',
  data() {
    return {
      form: { username: '', password: '' },
      loading: false
    };
  },
  methods: {
    /** 点击演示账号快速填充 */
    fillAccount(username, password) {
      this.form.username = username;
      this.form.password = password;
    },
    async handleLogin() {
      if (!this.form.username.trim() || !this.form.password) {
        this.$message.warning('请输入账号和密码');
        return;
      }
      this.loading = true;
      try {
        const res = await adminService.login(this.form.username.trim(), this.form.password);
        setAuth(res.token, res.user);

        // 后台仅允许管理员进入
        if (res.user.role !== 'admin') {
          this.$message.error('该账号没有后台管理权限');
          return;
        }

        this.$message.success('登录成功');
        const redirect = this.$route.query.redirect || '/product-management';
        this.$router.replace(redirect);
      } catch (e) {
        this.$message.error(e.message || '登录失败');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<!--
  布局说明：
  App.vue 的全局样式将 #app 设为 display:flex（行向），
  登录页作为其唯一子项，需 width:100% 才能占满视口，
  否则会被压缩到内容宽度导致「贴左 + 渐变只剩半屏」。
-->
<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* vue-element-admin 风格：浅色静谧背景 */
  background: #f0f2f5;
  background-image:
    radial-gradient(ellipse at top left, rgba(74, 124, 255, 0.10), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(107, 143, 255, 0.10), transparent 55%);
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 10px;
  padding: 40px 36px 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

/* ---- 品牌头部 ---- */
.brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  line-height: 56px;
  margin: 0 auto 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  color: #fff;
  font-size: 26px;
  box-shadow: 0 6px 16px rgba(74, 124, 255, 0.30);
}

.brand-name {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 1px;
}

.brand-sub {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

/* ---- 表单 ---- */
.login-btn {
  width: 100%;
  height: 42px;
  margin-top: 4px;
  font-size: 15px;
  letter-spacing: 8px;
  border-radius: 6px;
}

/* ---- 演示账号 ---- */
.hint {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  margin: 0 -10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.hint-row + .hint-row {
  margin-top: 2px;
}

.hint-row:hover {
  background: #f5f8ff;
}

.hint-cred {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #606266;
  letter-spacing: 0.3px;
}

.hint-row i {
  margin-left: auto;
  color: #c0c4cc;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.hint-row:hover i {
  opacity: 1;
  color: #4A7CFF;
}

.copyright {
  margin: 24px 0 0;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
