<template>
  <div class="page-container">
    <!-- 搜索和新增 -->
    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索分类名称" 
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
      </el-input>
      <el-button type="primary" icon="el-icon-plus" @click="openAddModal">新增分类</el-button>
    </div>

    <!-- 分类列表 -->
    <el-table 
      :data="filteredCategories" 
      border 
      :default-sort="{prop: 'sortOrder', order: 'ascending'}"
    >
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="icon" label="图标" width="80">
        <template slot-scope="scope">
          <span class="icon-text">{{ scope.row.icon }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="分类名称" min-width="150"></el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80"></el-table-column>
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-switch 
            :value="scope.row.status === 'active'"
            @change="toggleStatus(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column prop="productCount" label="商品数量" width="100">
        <template slot-scope="scope">
          <span class="count-badge">{{ scope.row.productCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template slot-scope="scope">
          <el-button size="small" type="primary" @click="editCategory(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            :disabled="scope.row.productCount > 0"
            @click="deleteCategory(scope.row)"
          >删除</el-button>
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
        :total="filteredCategories.length"
        layout="total, sizes, prev, pager, next, jumper"
      ></el-pagination>
    </div>

    <!-- 新增/编辑分类弹窗 -->
    <el-dialog title="分类信息" :visible.sync="showModal" width="400px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="formData.name" required></el-input>
        </el-form-item>
        <el-form-item label="分类图标">
          <el-input v-model="formData.icon" placeholder="输入表情图标如 🔥"></el-input>
        </el-form-item>
        <el-form-item label="排序序号">
          <el-input v-model.number="formData.sortOrder" type="number"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showModal = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { adminService } from '../services/dataService';

export default {
  name: 'CategoryManagement',
  data() {
    return {
      categories: [],
      // 用于计算各分类下的商品数量（后端未单独提供该字段）
      allProducts: [],
      loading: false,
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      showModal: false,
      formData: {
        id: null,
        name: '',
        icon: '',
        sortOrder: 0
      }
    };
  },
  created() {
    this.loadData();
  },
  computed: {
    filteredCategories() {
      let result = this.categories;
      
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(keyword));
      }
      
      result.sort((a, b) => a.sortOrder - b.sortOrder);
      
      return result;
    }
  },
  methods: {
    /** 从后端加载分类与商品（商品用于统计各分类下的数量） */
    async loadData() {
      this.loading = true;
      try {
        const [categories, products] = await Promise.all([
          adminService.listCategories(),
          adminService.listProducts()
        ]);
        this.allProducts = products;
        this.categories = categories.map(cat => ({
          ...cat,
          productCount: products.filter(p => p.categoryId === cat.id).length
        }));
      } catch (e) {
        this.$message.error(e.message);
      } finally {
        this.loading = false;
      }
    },
    getProductCount(categoryId) {
      return this.allProducts.filter(p => p.categoryId === categoryId).length;
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
    openAddModal() {
      this.formData = {
        id: null,
        name: '',
        icon: '',
        sortOrder: this.categories.length + 1
      };
      this.showModal = true;
    },
    editCategory(row) {
      this.formData = {
        id: row.id,
        name: row.name,
        icon: row.icon,
        sortOrder: row.sortOrder
      };
      this.showModal = true;
    },
    async saveCategory() {
      if (!this.formData.name) {
        this.$message.error('请填写分类名称');
        return;
      }

      try {
        if (this.formData.id) {
          await adminService.updateCategory(this.formData.id, {
            name: this.formData.name,
            icon: this.formData.icon,
            sortOrder: this.formData.sortOrder
          });
          this.$message.success('更新成功');
        } else {
          await adminService.createCategory({
            name: this.formData.name,
            icon: this.formData.icon,
            sortOrder: this.formData.sortOrder
          });
          this.$message.success('新增成功');
        }
        this.showModal = false;
        await this.loadData();
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    deleteCategory(row) {
      this.$confirm('确定删除该分类吗？', '提示').then(async () => {
        try {
          await adminService.deleteCategory(row.id);
          this.$message.success('删除成功');
          await this.loadData();
        } catch (e) {
          // 后端会拒绝删除仍有商品的分类（HTTP 409）
          this.$message.error(e.message);
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    async toggleStatus(row) {
      try {
        const next = row.status === 'active' ? 'inactive' : 'active';
        await adminService.updateCategory(row.id, { status: next });
        row.status = next;
        this.$message.success(next === 'active' ? '已启用' : '已禁用');
      } catch (e) {
        this.$message.error(e.message);
      }
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

.icon-text {
  font-size: 20px;
}

.count-badge {
  background: #E8F0FE;
  color: #4A7CFF;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>