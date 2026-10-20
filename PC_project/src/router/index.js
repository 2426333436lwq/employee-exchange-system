import Vue from 'vue';
import Router from 'vue-router';
import Login from '../views/Login.vue';
import ProductManagement from '../views/ProductManagement.vue';
import CategoryManagement from '../views/CategoryManagement.vue';
import OrderManagement from '../views/OrderManagement.vue';
import { isLoggedIn } from '../utils/auth';

Vue.use(Router);

const router = new Router({
  routes: [
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/', redirect: '/product-management' },
    { path: '/product-management', component: ProductManagement },
    { path: '/category-management', component: CategoryManagement },
    { path: '/order-management', component: OrderManagement },
    // 兜底：未匹配路径回首页
    { path: '*', redirect: '/product-management' }
  ]
});

/**
 * 全局路由守卫
 *
 * 说明：前端守卫仅为体验优化，**真正的权限校验在服务端**。
 * 即使绕过此守卫直接调用 API，服务端也会返回 401/403。
 */
router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.public) {
    return next();
  }
  if (isLoggedIn()) {
    return next();
  }
  // 未登录：跳转登录页并记住来源
  next({ path: '/login', query: { redirect: to.fullPath } });
});

export default router;
