<template>
  <div id="app">
    <!-- 登录页不显示后台框架 -->
    <router-view v-if="isLoginPage"></router-view>

    <div v-else class="container">
      <aside class="sidebar" :class="{collapsed: sidebarCollapsed}">
        <div class="sidebar-header">
          <span class="sidebar-title"><i class="el-icon-setting"></i> 积分管理系统</span>
          <div class="sidebar-toggle" @click="toggleSidebar">
            <i class="el-icon-s-fold"></i>
          </div>
        </div>
        <nav class="menu">
          <div 
            class="menu-item" 
            :class="{active: $route.path === '/product-management'}"
            @click="$router.push('/product-management')"
          >
            <i class="el-icon-goods"></i> <span>商品管理</span>
          </div>
          <div 
            class="menu-item" 
            :class="{active: $route.path === '/category-management'}"
            @click="$router.push('/category-management')"
          >
            <i class="el-icon-folder-opened"></i> <span>分类管理</span>
          </div>
          <div 
            class="menu-item" 
            :class="{active: $route.path === '/order-management'}"
            @click="$router.push('/order-management')"
          >
            <i class="el-icon-document"></i> <span>订单管理</span>
          </div>
        </nav>
      </aside>
      
      <main class="main-content">
        <header class="header">
          <div class="header-right">
            <span class="admin-text">{{ displayName }}</span>
            <el-dropdown style="margin-left: 10px;" @command="handleCommand">
              <i class="el-icon-user"></i>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </header>
        
        <div class="content">
          <router-view></router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, clearAuth } from './utils/auth';

export default {
  name: 'App',
  data() {
    return {
      sidebarCollapsed: false,
      currentUser: getCurrentUser()
    };
  },
  computed: {
    isLoginPage() {
      return this.$route.path === '/login';
    },
    displayName() {
      return (this.currentUser && this.currentUser.nickname) || '管理员';
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    handleCommand(command) {
      if (command !== 'logout') return;
      this.$confirm('确定要退出登录吗？', '提示', { type: 'warning' })
        .then(() => {
          clearAuth();
          this.currentUser = null;
          this.$message.success('已退出登录');
          this.$router.replace('/login');
        })
        .catch(() => {});
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
  display: flex;
  overflow-x: hidden;
}

.container {
  display: flex;
  flex: 1;
  min-width: 0;
}

.sidebar {
  width: 200px;
  background: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  flex-shrink: 0;
  overflow: hidden;
  position: sticky;
  left: 0;
  z-index: 100;
  transition: width 0.3s ease, min-width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #4A7CFF 0%, #6B8FFF 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar.collapsed .sidebar-header {
  padding: 15px 10px;
  justify-content: center;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.sidebar.collapsed .sidebar-title {
  display: none;
}

.sidebar-toggle {
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.3s;
  color: #fff;
}

.sidebar-toggle:hover {
  background-color: rgba(255,255,255,0.1);
}

.menu {
  padding: 10px 0;
  flex: 1;
}

.menu-item {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  color: #bdc3c7;
  font-size: 14px;
  border-left: 3px solid transparent;
}

.menu-item i {
  margin-right: 12px;
  font-size: 16px;
}

.menu-item span {
  white-space: nowrap;
}

.menu-item:hover {
  background: #34495e;
  color: #fff;
}

.menu-item.active {
  background: #4A7CFF;
  color: #fff;
  border-left-color: #fff;
}

.sidebar.collapsed .menu-item {
  padding: 0 10px;
  justify-content: center;
}

.sidebar.collapsed .menu-item span {
  display: none;
}

.sidebar.collapsed .menu-item i {
  margin-right: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: auto;
  background: #f5f7fa;
}

.header {
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-right {
  display: flex;
  align-items: center;
}

.admin-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.table-container {
  overflow-x: auto;
  overflow-y: visible;
  margin: 0;
  padding: 0;
  border-radius: 0;
  position: relative;
  width: 100%;
  display: block;
}

.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.table-container .el-table {
  min-width: 100%;
  width: 100%;
  table-layout: auto;
  margin: 0;
}

.table-container .el-table th,
.table-container .el-table td {
  white-space: nowrap;
}

.table-container .el-table__header-wrapper,
.table-container .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: visible !important;
  margin: 0;
  padding: 0;
}

.table-container .el-table__body {
  width: 100% !important;
}

.table-container .el-table__row {
  position: relative;
}

.table-container .el-table td:last-child {
  padding-right: 12px !important;
}

.table-container .el-table td .action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  position: relative;
  z-index: 10;
}
</style>
