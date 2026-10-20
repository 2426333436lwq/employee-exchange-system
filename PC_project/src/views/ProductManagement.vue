<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索商品名称或品牌" 
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
      </el-input>
      <el-select v-model="selectedCategory" placeholder="选择分类" class="category-select">
        <el-option label="全部" value="0"></el-option>
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id"></el-option>
      </el-select>
      <el-select v-model="selectedType" placeholder="选择类型" class="type-select">
        <el-option label="全部" value="all"></el-option>
        <el-option label="实物福利" value="physical"></el-option>
        <el-option label="虚拟福利" value="virtual"></el-option>
        <el-option label="生活服务" value="service"></el-option>
      </el-select>
      <el-button type="primary" icon="el-icon-plus" @click="openAddModal">新增商品</el-button>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button 
        type="warning" 
        icon="el-icon-upload" 
        :disabled="selectedIds.length === 0"
        @click="batchOnline"
      >
        批量上架
      </el-button>
      <el-button 
        type="danger" 
        icon="el-icon-download" 
        :disabled="selectedIds.length === 0"
        @click="batchOffline"
      >
        批量下架
      </el-button>
      <span class="selected-info" v-if="selectedIds.length > 0">
        已选择 {{ selectedIds.length }} 项
      </span>
    </div>

    <!-- 商品列表 -->
    <div class="table-container">
      <el-table 
        :data="paginatedProducts" 
        border 
        :default-sort="{prop: 'sortOrder', order: 'ascending'}"
        @selection-change="handleSelectionChange"
      >
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column label="商品图片" width="100">
        <template slot-scope="scope">
          <img :src="scope.row.image" class="product-image" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150"></el-table-column>
      <el-table-column prop="categoryName" label="分类" width="100"></el-table-column>
      <el-table-column label="商品类型" width="100">
        <template slot-scope="scope">
          <el-tag :type="getTypeTagType(scope.row.type)">
            {{ getTypeName(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="points" label="积分" width="80">
        <template slot-scope="scope">
          <span class="points-value">{{ scope.row.points }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80"></el-table-column>
      <el-table-column prop="monthlySales" label="月销量" width="80"></el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 'online' ? 'success' : 'danger'">
            {{ scope.row.status === 'online' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="80">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.isTop" type="warning">置顶</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center">
        <template slot-scope="scope">
          <div class="action-buttons">
            <el-button 
              size="mini" 
              :type="scope.row.isTop ? 'default' : 'warning'"
              @click="toggleTop(scope.row)"
              class="action-btn"
            >
              {{ scope.row.isTop ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button 
              size="mini" 
              type="primary" 
              @click="editProduct(scope.row)"
              class="action-btn"
            >编辑</el-button>
            <el-button 
              size="mini" 
              type="danger" 
              @click="deleteProduct(scope.row)"
              class="action-btn"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30, 50]"
        :page-size="pageSize"
        :total="filteredProducts.length"
        layout="total, sizes, prev, pager, next, jumper"
      ></el-pagination>
    </div>

    <!-- 新增/编辑商品弹窗 -->
    <el-dialog title="商品信息" :visible.sync="showModal" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="formData.name" required></el-input>
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="formData.categoryId" required>
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="兑换积分">
          <el-input v-model.number="formData.points" type="number" required></el-input>
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input v-model.number="formData.stock" type="number" required></el-input>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="formData.brand"></el-input>
        </el-form-item>
        <el-form-item label="商品图片">
          <el-input v-model="formData.image" placeholder="输入图片URL"></el-input>
        </el-form-item>
        <el-form-item label="商品类型">
          <el-select v-model="formData.type">
            <el-option label="实物福利" value="physical"></el-option>
            <el-option label="虚拟福利" value="virtual"></el-option>
            <el-option label="生活服务" value="service"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="formData.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="排序序号">
          <el-input v-model.number="formData.sortOrder" type="number"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { adminService } from '../services/dataService';

export default {
  name: 'ProductManagement',
  data() {
    return {
      products: [],
      categories: [],
      loading: false,
      searchKeyword: '',
      selectedCategory: '0',
      selectedType: 'all',
      selectedIds: [],
      currentPage: 1,
      pageSize: 10,
      showModal: false,
      formData: {
        id: null,
        name: '',
        categoryId: '',
        points: 0,
        stock: 0,
        brand: '',
        image: '',
        type: 'physical',
        description: '',
        sortOrder: 0,
        status: 'online',
        isTop: false
      }
    };
  },
  created() {
    this.loadData();
  },
  computed: {
    filteredProducts() {
      let result = this.products;
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(keyword) || 
          p.brand.toLowerCase().includes(keyword)
        );
      }
      
      // 分类筛选
      if (this.selectedCategory !== '0') {
        result = result.filter(p => p.categoryId === parseInt(this.selectedCategory));
      }
      
      // 类型筛选
      if (this.selectedType !== 'all') {
        result = result.filter(p => p.type === this.selectedType);
      }
      
      // 排序：置顶优先，然后按排序号
      result.sort((a, b) => {
        if (a.isTop !== b.isTop) {
          return a.isTop ? -1 : 1;
        }
        return a.sortOrder - b.sortOrder;
      });
      
      return result;
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredProducts.slice(start, end);
    }
  },
  methods: {
    /** 从后端加载商品与分类 */
    async loadData() {
      this.loading = true;
      try {
        const [products, categories] = await Promise.all([
          adminService.listProducts(),
          adminService.listCategories()
        ]);
        this.products = products;
        this.categories = categories;
      } catch (e) {
        this.$message.error(e.message);
      } finally {
        this.loading = false;
      }
    },
    getTypeName(type) {
      const typeMap = {
        physical: '实物福利',
        virtual: '虚拟福利',
        service: '生活服务'
      };
      return typeMap[type] || type;
    },
    getTypeTagType(type) {
      const typeMap = {
        physical: 'info',
        virtual: 'success',
        service: 'warning'
      };
      return typeMap[type] || 'default';
    },
    handleSearch() {
      this.currentPage = 1;
    },
    handleSelectionChange(val) {
      this.selectedIds = val.map(item => item.id);
    },
    handleSizeChange(val) {
      this.pageSize = val;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    openAddModal() {
      this.formData = {
        id: null,
        name: '',
        categoryId: '',
        points: 0,
        stock: 0,
        brand: '',
        image: '',
        type: 'physical',
        description: '',
        sortOrder: this.products.length + 1,
        status: 'online',
        isTop: false
      };
      this.showModal = true;
    },
    editProduct(row) {
      this.formData = {
        ...row,
        categoryName: undefined
      };
      this.showModal = true;
    },
    async saveProduct() {
      if (!this.formData.name || !this.formData.categoryId) {
        this.$message.error('请填写必填字段');
        return;
      }

      try {
        if (this.formData.id) {
          await adminService.updateProduct(this.formData.id, this.formData);
          this.$message.success('更新成功');
        } else {
          await adminService.createProduct(this.formData);
          this.$message.success('新增成功');
        }
        this.showModal = false;
        // 重新拉取，确保与后端一致（含后端生成的 id / categoryName）
        await this.loadData();
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    deleteProduct(row) {
      this.$confirm('确定删除该商品吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await adminService.deleteProduct(row.id);
          this.$message.success('删除成功');
          await this.loadData();
        } catch (e) {
          this.$message.error(e.message);
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    async toggleTop(row) {
      try {
        const updated = await adminService.toggleTop(row.id, !row.isTop);
        row.isTop = updated.isTop;
        this.$message.success(updated.isTop ? '已置顶' : '已取消置顶');
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    async batchOnline() {
      try {
        const res = await adminService.batchSetStatus(this.selectedIds, 'online');
        this.$message.success(`批量上架成功（${res.count} 项）`);
        this.selectedIds = [];
        await this.loadData();
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    batchOffline() {
      this.$confirm('确定批量下架选中的商品吗？', '提示').then(async () => {
        try {
          const res = await adminService.batchSetStatus(this.selectedIds, 'offline');
          this.$message.success(`批量下架成功（${res.count} 项）`);
          this.selectedIds = [];
          await this.loadData();
        } catch (e) {
          this.$message.error(e.message);
        }
      });
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

.action-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.category-select {
  width: 150px;
}

.type-select {
  width: 120px;
}

.selected-info {
  color: #666;
  font-size: 14px;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.points-value {
  color: #FF6B6B;
  font-weight: 600;
}

.action-buttons {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  padding: 4px 0;
}

.action-btn {
  flex-shrink: 0;
  min-width: 56px;
  height: 24px;
  line-height: 22px;
  padding: 0 8px;
  font-size: 12px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>