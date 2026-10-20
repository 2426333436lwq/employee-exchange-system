import ProductManagement from './components/ProductManagement.js';
import CategoryManagement from './components/CategoryManagement.js';
import OrderManagement from './components/OrderManagement.js';

const routes = [
  { path: '/', redirect: '/products' },
  { path: '/products', component: ProductManagement },
  { path: '/categories', component: CategoryManagement },
  { path: '/orders', component: OrderManagement }
];

const router = new VueRouter({
  routes
});

new Vue({
  el: '#app',
  router: router,
  data() {
    return {
      sidebarCollapsed: false
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    closeSidebar() {
      this.sidebarCollapsed = true;
    },
    openSidebar() {
      this.sidebarCollapsed = false;
    }
  }
});