<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索订单号、商品名称或用户名" 
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
      </el-input>
      <el-select v-model="selectedStatus" placeholder="订单状态" class="status-select">
        <el-option label="全部" value="all"></el-option>
        <el-option label="待处理" value="pending"></el-option>
        <el-option label="已发货" value="shipped"></el-option>
        <el-option label="已完成" value="completed"></el-option>
        <el-option label="已取消" value="cancelled"></el-option>
      </el-select>
      <el-select v-model="selectedType" placeholder="商品类型" class="type-select">
        <el-option label="全部" value="all"></el-option>
        <el-option label="实物福利" value="physical"></el-option>
        <el-option label="虚拟福利" value="virtual"></el-option>
        <el-option label="生活服务" value="service"></el-option>
      </el-select>
      <el-button 
        type="success" 
        icon="el-icon-download" 
        @click="exportExcel"
        :disabled="selectedIds.length === 0 && filteredOrders.length === 0"
      >
        导出Excel
        <span v-if="selectedIds.length > 0">({{ selectedIds.length }})</span>
      </el-button>
    </div>

    <!-- 订单列表 -->
    <el-table 
      :data="filteredOrders" 
      border 
      :default-sort="{prop: 'exchangeTime', order: 'descending'}"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="id" label="订单号" min-width="150"></el-table-column>
      <el-table-column prop="productName" label="商品名称" min-width="150">
        <template slot-scope="scope">
          <span class="product-link" @click="viewProductDetail(scope.row)">
            {{ scope.row.productName }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="商品图片" width="100">
        <template slot-scope="scope">
          <img :src="scope.row.productImage" class="product-image" @click="viewProductDetail(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column prop="points" label="兑换积分" width="100">
        <template slot-scope="scope">
          <span class="points-value">{{ scope.row.points }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="兑换人" width="100"></el-table-column>
      <el-table-column prop="exchangeTime" label="兑换时间" width="180"></el-table-column>
      <el-table-column label="订单状态" width="100">
        <template slot-scope="scope">
          <el-tag :style="{ backgroundColor: getStatusColor(scope.row.status) + '20', color: getStatusColor(scope.row.status) }">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template slot-scope="scope">
          <el-button 
            v-if="scope.row.status === 'pending'"
            size="small" 
            type="primary" 
            @click="handleOrder(scope.row)"
          >
            处理订单
          </el-button>
          <el-button 
            v-if="scope.row.status === 'shipped'"
            size="small" 
            type="success" 
            @click="completeOrder(scope.row)"
          >
            确认完成
          </el-button>
          <span v-if="scope.row.status !== 'pending' && scope.row.status !== 'shipped'">-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pageSize"
        :total="filteredOrders.length"
        layout="total, sizes, prev, pager, next, jumper"
      ></el-pagination>
    </div>

    <!-- 商品详情弹窗 -->
    <el-dialog title="商品详情" :visible.sync="showProductModal" width="600px">
      <div v-if="selectedProduct" class="product-detail">
        <div class="detail-header">
          <img :src="selectedProduct.image" class="detail-image" />
          <div class="detail-info">
            <h3>{{ selectedProduct.name }}</h3>
            <p class="detail-brand">{{ selectedProduct.brand }}</p>
            <p class="detail-points">兑换积分：<span>{{ selectedProduct.points }}</span></p>
            <p class="detail-stock">库存：{{ selectedProduct.stock }}</p>
            <p class="detail-sales">月销量：{{ selectedProduct.monthlySales }}</p>
            <p class="detail-rating">评分：{{ selectedProduct.rating }}分（{{ selectedProduct.reviewCount }}条评价）</p>
          </div>
        </div>
        <div class="detail-body">
          <h4>商品描述</h4>
          <p>{{ selectedProduct.description }}</p>
        </div>
        <div class="detail-body">
          <h4>规格参数</h4>
          <el-table :data="specsList" border size="small">
            <el-table-column prop="key" label="参数名称"></el-table-column>
            <el-table-column prop="value" label="参数值"></el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showProductModal = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { adminService } from '../services/dataService';
import { specLabel, orderStatusLabel, orderStatusColor } from '@shared/format';

export default {
  name: 'OrderManagement',
  data() {
    return {
      orders: [],
      products: [],
      loading: false,
      searchKeyword: '',
      selectedStatus: 'all',
      selectedType: 'all',
      currentPage: 1,
      pageSize: 10,
      showProductModal: false,
      selectedProduct: null,
      selectedIds: []
    };
  },
  created() {
    this.loadData();
  },
  computed: {
    filteredOrders() {
      let result = this.orders;
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        result = result.filter(o => 
          o.id.toLowerCase().includes(keyword) || 
          o.productName.toLowerCase().includes(keyword) ||
          o.userName.toLowerCase().includes(keyword)
        );
      }
      
      // 状态筛选
      if (this.selectedStatus !== 'all') {
        result = result.filter(o => o.status === this.selectedStatus);
      }
      
      // 商品类型筛选
      if (this.selectedType !== 'all') {
        result = result.filter(o => {
          const product = this.products.find(p => p.id === o.productId);
          return product && product.type === this.selectedType;
        });
      }
      
      return result;
    },
    specsList() {
      if (!this.selectedProduct?.specs) return [];
      return Object.keys(this.selectedProduct.specs).map(key => ({
        key: this.formatSpecKey(key),
        value: this.selectedProduct.specs[key]
      }));
    }
  },
  methods: {
    /** 从后端加载订单与商品 */
    async loadData() {
      this.loading = true;
      try {
        const [orders, products] = await Promise.all([
          adminService.listOrders(),
          adminService.listProducts()
        ]);
        this.orders = orders;
        this.products = products;
      } catch (e) {
        this.$message.error(e.message);
      } finally {
        this.loading = false;
      }
    },
    getStatusLabel(status) {
      // 状态中文标签由共享契约提供
      return orderStatusLabel(status);
    },
    getStatusColor(status) {
      return orderStatusColor(status);
    },
    formatSpecKey(key) {
      // 规格键中文标签统一由共享契约提供，避免两端各维护一份 keyMap
      return specLabel(key);
    },
    handleSearch() {
      this.currentPage = 1;
    },
    handleSizeChange(val) {
      this.pageSize = val;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    viewProductDetail(order) {
      this.selectedProduct = this.products.find(p => p.id === order.productId);
      this.showProductModal = true;
    },
    handleSelectionChange(val) {
      this.selectedIds = val.map(item => item.id);
    },
    async handleOrder(order) {
      try {
        await this.$confirm('确认处理该订单吗？', '提示');
      } catch {
        return;
      }
      try {
        await adminService.updateOrderStatus(order.id, 'shipped');
        this.$message.success('订单已处理，状态更新为已发货');
        await this.loadData();
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    async completeOrder(order) {
      try {
        await this.$confirm('确认订单已完成吗？', '提示');
      } catch {
        return;
      }
      try {
        await adminService.updateOrderStatus(order.id, 'completed');
        this.$message.success('订单已完成');
        await this.loadData();
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    exportExcel() {
      let exportData;
      if (this.selectedIds.length > 0) {
        exportData = this.orders.filter(o => this.selectedIds.includes(o.id));
      } else {
        exportData = [...this.filteredOrders];
      }
      
      if (exportData.length === 0) {
        this.$message.warning('没有可导出的数据');
        return;
      }
      
      const headers = ['订单号', '商品名称', '兑换积分', '兑换人', '兑换时间', '订单状态'];
      
      const rows = exportData.map(o => [
        this.escapeCsvField(o.id),
        this.escapeCsvField(o.productName),
        this.escapeCsvField(o.points.toString()),
        this.escapeCsvField(o.userName),
        this.escapeCsvField(o.exchangeTime),
        this.escapeCsvField(this.getStatusLabel(o.status))
      ]);
      
      const BOM = '\uFEFF';
      const csvContent = BOM + headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
      
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=UTF-8' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
        const filename = `订单数据_${dateStr}.csv`;
        
        link.href = url;
        link.download = filename;
        link.style.position = 'fixed';
        link.style.left = '-9999px';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.$message.success(`成功导出 ${exportData.length} 条订单数据`);
      } catch (error) {
        console.error('导出失败:', error);
        this.$message.error('导出失败，请重试');
      }
      
      this.selectedIds = [];
    },
    escapeCsvField(field) {
      if (field === null || field === undefined) {
        return '""';
      }
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }
  }
};
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.status-select {
  width: 120px;
}

.type-select {
  width: 120px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.product-link {
  color: #4A7CFF;
  cursor: pointer;
  text-decoration: underline;
}

.points-value {
  color: #FF6B6B;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.product-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.detail-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-info {
  flex: 1;
}

.detail-info h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.detail-brand {
  color: #666;
  margin-bottom: 8px;
}

.detail-points span {
  color: #FF6B6B;
  font-weight: 600;
}

.detail-stock, .detail-sales, .detail-rating {
  color: #666;
  margin-bottom: 5px;
}

.detail-body {
  margin-bottom: 20px;
}

.detail-body h4 {
  margin-bottom: 10px;
  font-size: 14px;
}

.detail-body p {
  color: #666;
  line-height: 1.6;
}
</style>