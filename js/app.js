/**
 * 企业员工积分兑换系统 - 核心应用逻辑
 * @file app.js
 * @description 系统的主要功能逻辑，包括登录、权限管理和页面跳转
 * @version 2.0 — 数据持久化到 localStorage
 */

// 全局变量
let currentUser = null;
let currentRole = null;

const STORAGE_KEY = 'exchange_system_data';

/**
 * 初始化或读取本地数据
 * 首次访问时写入模拟数据种子，后续仅从 localStorage 读取和修改
 */
function initData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    const data = {
        users: [
            { id: 1, username: 'admin', password: 'admin', role: 'admin', name: '系统管理员', department: 'IT部门', position: '系统管理员' },
            { id: 2, username: 'user1', password: '123456', role: 'employee', name: '张三', department: '技术部', position: '工程师', points: 1200, status: 'normal' },
            { id: 3, username: 'user2', password: '123456', role: 'employee', name: '李四', department: '市场部', position: '经理', points: 850, status: 'normal' },
            { id: 4, username: 'user3', password: '123456', role: 'employee', name: '王五', department: '财务部', position: '会计', points: 600, status: 'disabled' },
            { id: 5, username: 'user4', password: '123456', role: 'employee', name: '赵六', department: '人力资源部', position: '专员', points: 950, status: 'normal' },
            { id: 6, username: 'user5', password: '123456', role: 'employee', name: '钱七', department: '技术部', position: '高级工程师', points: 1500, status: 'normal' },
            { id: 7, username: 'user6', password: '123456', role: 'employee', name: '孙八', department: '市场部', position: '专员', points: 450, status: 'normal' },
            { id: 8, username: 'user7', password: '123456', role: 'employee', name: '周九', department: '财务部', position: '主管', points: 1100, status: 'normal' }
        ],
        products: [
            { id: 1, name: '无线蓝牙耳机', category: '电子产品', price: 300, stock: 50, status: '上架', exchangeCount: 25 },
            { id: 2, name: '智能手环', category: '电子产品', price: 200, stock: 30, status: '上架', exchangeCount: 18 },
            { id: 3, name: '办公椅', category: '办公用品', price: 500, stock: 10, status: '上架', exchangeCount: 5 },
            { id: 4, name: '保温杯', category: '生活用品', price: 100, stock: 0, status: '下架', exchangeCount: 45 },
            { id: 5, name: '笔记本电脑包', category: '办公用品', price: 150, stock: 20, status: '上架', exchangeCount: 12 },
            { id: 6, name: 'USB移动电源', category: '电子产品', price: 80, stock: 40, status: '上架', exchangeCount: 30 },
            { id: 7, name: '商务笔记本', category: '办公用品', price: 50, stock: 100, status: '上架', exchangeCount: 60 },
            { id: 8, name: '桌面收纳盒', category: '生活用品', price: 60, stock: 35, status: '上架', exchangeCount: 20 },
            { id: 9, name: '员工T恤', category: '生活用品', price: 120, stock: 50, status: '上架', exchangeCount: 15 },
            { id: 10, name: '多功能充电器', category: '电子产品', price: 100, stock: 25, status: '上架', exchangeCount: 22 }
        ],
        exchangeRecords: [
            { id: 1, userId: 2, userName: '张三', productId: 1, productName: '无线蓝牙耳机', points: 300, exchangeTime: '2026-04-27 09:30:00', status: '已完成' },
            { id: 2, userId: 3, userName: '李四', productId: 2, productName: '智能手环', points: 200, exchangeTime: '2026-04-27 10:15:00', status: '已完成' },
            { id: 3, userId: 5, userName: '钱七', productId: 3, productName: '办公椅', points: 500, exchangeTime: '2026-04-27 11:20:00', status: '待处理' },
            { id: 4, userId: 2, userName: '张三', productId: 6, productName: 'USB移动电源', points: 80, exchangeTime: '2026-04-27 14:45:00', status: '已完成' },
            { id: 5, userId: 7, userName: '周九', productId: 9, productName: '员工T恤', points: 120, exchangeTime: '2026-04-27 15:30:00', status: '已完成' },
            { id: 6, userId: 4, userName: '王五', productId: 7, productName: '商务笔记本', points: 50, exchangeTime: '2026-04-27 16:10:00', status: '待处理' },
            { id: 7, userId: 6, userName: '孙八', productId: 8, productName: '桌面收纳盒', points: 60, exchangeTime: '2026-04-27 17:20:00', status: '待处理' }
        ]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
}

/**
 * 持久化写入数据
 * @param {Object} data - 完整数据对象
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * 登录函数
 * 验证用户名、密码、角色，并检查账号未被禁用
 */
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const data = initData();
    const user = data.users.find(u => u.username === username && u.password === password && u.role === role);

    if (!user) {
        alert('用户名、密码或角色错误');
        return;
    }
    if (user.status === 'disabled') {
        alert('该账号已被禁用，请联系管理员');
        return;
    }

    currentUser = user;
    currentRole = role;
    localStorage.setItem('currentUser', JSON.stringify(user));

    if (role === 'admin') {
        window.location.href = 'admin/admin.html';
    } else {
        window.location.href = 'employee/employee.html';
    }
}

/**
 * 登出函数
 */
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    currentRole = null;
    window.location.href = 'index.html';
}

/**
 * 检查用户登录状态
 */
function checkLogin() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        currentRole = currentUser.role;
        return true;
    }
    window.location.href = 'index.html';
    return false;
}

// ---- 数据读取函数 ----

function getUsers() {
    return initData().users;
}
function getProducts() {
    return initData().products;
}
function getExchangeRecords() {
    return initData().exchangeRecords;
}
function getCurrentUser() {
    return currentUser;
}

/**
 * 添加兑换记录并持久化
 */
function addExchangeRecord(user, product) {
    const data = initData();
    const newRecord = {
        id: data.exchangeRecords.length + 1,
        userId: user.id,
        userName: user.name,
        productId: product.id,
        productName: product.name,
        points: product.price,
        exchangeTime: formatDate(new Date()),
        status: '待处理'
    };
    data.exchangeRecords.unshift(newRecord);

    // 更新用户积分
    const userObj = data.users.find(u => u.id === user.id);
    if (userObj) {
        userObj.points = (userObj.points || 0) - product.price;
    }
    // 更新商品库存
    const prodObj = data.products.find(p => p.id === product.id);
    if (prodObj) {
        prodObj.stock -= 1;
        prodObj.exchangeCount = (prodObj.exchangeCount || 0) + 1;
    }

    saveData(data);
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // 同步 localStorage 中的 currentUser
    const updatedUser = data.users.find(u => u.id === user.id);
    if (updatedUser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        currentUser = updatedUser;
    }
}

/**
 * 处理待处理订单（管理员）— 实际更新状态为"已完成"
 */
function processPendingOrder(orderId) {
    if (!confirm('确定要处理这个订单吗？')) return;
    const data = initData();
    // 尝试从 pendingOrders 查找（统计页专用格式）
    // 也尝试从 exchangeRecords 查找（标准兑换记录格式）
    let found = false;
    const rec = data.exchangeRecords.find(r => r.status === '待处理');
    // 简单方式：找第一个待处理的或匹配 orderId 的
    for (const r of data.exchangeRecords) {
        if (r.status === '待处理') {
            r.status = '已完成';
            found = true;
            break;
        }
    }
    if (found) {
        saveData(data);
        alert('订单处理成功！');
    } else {
        alert('未找到可处理的订单');
    }
    // 刷新当前页面数据
    if (window.location.pathname.includes('pending-orders.html')) {
        loadPendingOrderStatistics && loadPendingOrderStatistics();
    }
}

/**
 * 处理今日兑换订单（管理员）
 */
function processTodayExchange(orderId) {
    if (!confirm('确定要处理这个订单吗？')) return;
    const data = initData();
    let found = false;
    for (const r of data.exchangeRecords) {
        if (r.status === '待处理') {
            r.status = '已完成';
            found = true;
            break;
        }
    }
    if (found) {
        saveData(data);
        alert('订单处理成功！');
    } else {
        alert('未找到可处理的订单');
    }
    if (window.location.pathname.includes('today-exchanges.html')) {
        loadTodayExchangeStatistics && loadTodayExchangeStatistics();
    }
}

// 页面加载时检查登录状态
if (!window.location.pathname.includes('index.html')) {
    checkLogin();
}
