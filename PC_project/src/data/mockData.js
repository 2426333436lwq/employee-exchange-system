/**
 * 领域模型类型来源：前后台共享契约 @shared/types
 *
 * PC 端为 Vue2 + 纯 JS，无法直接 import 类型；此处通过 JSDoc 引用共享契约，
 * 使编辑器可对 mock 数据结构做类型提示与校验，保持与前台一致。
 * （@shared 别名在 webpack.config.js 中配置）
 *
 * @typedef {import('@shared/types').Product}  Product
 * @typedef {import('@shared/types').Category} Category
 * @typedef {import('@shared/types').Order}    Order
 */

// 商品分类数据
/** @type {import('@shared/types').Category[]} */
export const categories = [
  { id: 1, name: '热门福利', icon: '🔥', sortOrder: 1, status: 'active' },
  { id: 2, name: '实物福利', icon: '📦', sortOrder: 2, status: 'active' },
  { id: 3, name: '虚拟福利', icon: '🎁', sortOrder: 3, status: 'active' },
  { id: 4, name: '生活服务', icon: '💆', sortOrder: 4, status: 'active' }
];

// 商品数据
/** @type {import('@shared/types').Product[]} */
export const products = [
  {
    id: 1,
    name: '五常大米礼盒',
    categoryId: 1,
    categoryName: '热门福利',
    points: 580,
    stock: 50,
    monthlySales: 128,
    brand: '五常大米',
    rating: 4.8,
    reviewCount: 256,
    image: 'https://img0.baidu.com/it/u=330932607,885973046&fm=253&fmt=auto&app=138&f=JPEG?w=1000&h=800',
    type: 'physical',
    status: 'online',
    isTop: true,
    sortOrder: 1,
    description: '精选优质大米，粒粒饱满，口感细腻，家庭必备好米。',
    specs: {
      origin: '国产',
      shelfLife: '12个月',
      weight: '5kg',
      place: '黑龙江'
    }
  },
  {
    id: 2,
    name: '50元话费充值',
    categoryId: 1,
    categoryName: '热门福利',
    points: 450,
    stock: 100,
    monthlySales: 326,
    brand: '中国移动',
    rating: 4.9,
    reviewCount: 512,
    image: 'https://aigc-image.bj.bcebos.com/miaobi/5mao/b%275YWF6K%2Bd6LS5XzE3MjQ1MjEyNDcuNDE0MDQ4Nw%3D%3D%27/0.png',
    type: 'virtual',
    status: 'online',
    isTop: false,
    sortOrder: 2,
    description: '全国通用话费充值，支持移动、联通、电信三网通用。',
    specs: {
      denomination: '50元',
      applicableDevices: '所有手机',
      usageLimit: '不可叠加',
      activationPeriod: '购买后30天内激活',
      arrivalMethod: '自动充值到账'
    }
  },
  {
    id: 3,
    name: '家政保洁服务',
    categoryId: 1,
    categoryName: '热门福利',
    points: 880,
    stock: 30,
    monthlySales: 68,
    brand: '天鹅到家',
    rating: 4.7,
    reviewCount: 128,
    image: 'https://img1.baidu.com/it/u=613285016,1242524118&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=800',
    type: 'service',
    status: 'online',
    isTop: false,
    sortOrder: 3,
    description: '专业保洁团队，标准化服务流程，让您的家焕然一新。',
    specs: {
      serviceDuration: '3小时',
      serviceScope: '室内清洁',
      reservationRules: '提前2天预约',
      cancellationRules: '提前1天可取消',
      applicablePeople: '所有家庭'
    }
  },
  {
    id: 4,
    name: '鲁花食用油',
    categoryId: 2,
    categoryName: '实物福利',
    points: 420,
    stock: 80,
    monthlySales: 95,
    brand: '鲁花',
    rating: 4.8,
    reviewCount: 189,
    image: 'https://t14.baidu.com/it/u=1299056294,364236295&fm=224&app=112&f=JPEG?w=500&h=500',
    type: 'physical',
    status: 'online',
    isTop: false,
    sortOrder: 4,
    description: '非转基因压榨花生油，香浓纯正，健康烹饪首选。',
    specs: {
      origin: '国产',
      shelfLife: '18个月',
      weight: '1.8L',
      place: '山东'
    }
  },
  {
    id: 5,
    name: '维达卫生纸',
    categoryId: 2,
    categoryName: '实物福利',
    points: 180,
    stock: 200,
    monthlySales: 456,
    brand: '维达',
    rating: 4.6,
    reviewCount: 723,
    image: 'https://q8.itc.cn/q_70/images03/20260121/854a6f81dc91416483ec5f0099dadc7b.png',
    type: 'physical',
    status: 'offline',
    isTop: false,
    sortOrder: 5,
    description: '四层加厚，柔软亲肤，家庭日常必备。',
    specs: {
      origin: '国产',
      shelfLife: '3年',
      weight: '10卷/提',
      place: '广东'
    }
  },
  {
    id: 6,
    name: '腾讯视频会员月卡',
    categoryId: 3,
    categoryName: '虚拟福利',
    points: 280,
    stock: 150,
    monthlySales: 234,
    brand: '腾讯视频',
    rating: 4.9,
    reviewCount: 445,
    image: 'https://img0.baidu.com/it/u=128562457,694750094&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
    type: 'virtual',
    status: 'online',
    isTop: true,
    sortOrder: 6,
    description: '海量影视内容，无广告观看，高清画质体验。',
    specs: {
      duration: '1个月',
      applicableDevices: '手机、电脑、电视',
      usageLimit: '可叠加',
      activationPeriod: '购买后7天内激活',
      arrivalMethod: '兑换码发送至手机'
    }
  },
  {
    id: 7,
    name: '京东礼品卡',
    categoryId: 3,
    categoryName: '虚拟福利',
    points: 950,
    stock: 60,
    monthlySales: 89,
    brand: '京东',
    rating: 4.8,
    reviewCount: 167,
    image: 'https://img2.baidu.com/it/u=2399193137,596696533&fm=253&app=138&f=JPEG?w=800&h=1067',
    type: 'virtual',
    status: 'online',
    isTop: false,
    sortOrder: 7,
    description: '京东商城通用礼品卡，万千商品随心选。',
    specs: {
      denomination: '100元',
      applicableDevices: '京东APP/网站',
      usageLimit: '可叠加使用',
      activationPeriod: '购买后1年内激活',
      arrivalMethod: '电子卡密发送至手机'
    }
  },
  {
    id: 8,
    name: '洗车服务',
    categoryId: 4,
    categoryName: '生活服务',
    points: 150,
    stock: 100,
    monthlySales: 178,
    brand: '车享家',
    rating: 4.7,
    reviewCount: 289,
    image: 'https://img.shetu66.com/2024/05/23/171645710790303819.png?x-oss-process=image/resize,h_900/format,webp',
    type: 'service',
    status: 'online',
    isTop: false,
    sortOrder: 8,
    description: '专业洗车服务，内外清洁，让爱车焕然一新。',
    specs: {
      serviceDuration: '约30分钟',
      serviceScope: '车身清洗',
      reservationRules: '提前1天预约',
      cancellationRules: '提前6小时可取消',
      applicablePeople: '所有车主'
    }
  },
  {
    id: 9,
    name: '体检套餐',
    categoryId: 4,
    categoryName: '生活服务',
    points: 1580,
    stock: 25,
    monthlySales: 45,
    brand: '爱康国宾',
    rating: 4.9,
    reviewCount: 98,
    image: 'https://t13.baidu.com/it/u=562281217,11683301&fm=224&app=112&f=JPEG?w=500&h=500',
    type: 'service',
    status: 'online',
    isTop: false,
    sortOrder: 9,
    description: '全面体检套餐，关爱健康从定期检查开始。',
    specs: {
      serviceDuration: '约2小时',
      serviceScope: '全面体检',
      reservationRules: '提前3天预约',
      cancellationRules: '提前1天可取消',
      applicablePeople: '18-65岁'
    }
  },
  {
    id: 10,
    name: '肯德基代金券',
    categoryId: 4,
    categoryName: '生活服务',
    points: 280,
    stock: 80,
    monthlySales: 156,
    brand: '肯德基',
    rating: 4.8,
    reviewCount: 312,
    image: 'https://img2.baidu.com/it/u=2097229277,1172225579&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=674',
    type: 'service',
    status: 'offline',
    isTop: false,
    sortOrder: 10,
    description: '肯德基代金券，美味随心享。',
    specs: {
      denomination: '30元',
      serviceScope: '全场通用',
      reservationRules: '无需预约',
      cancellationRules: '不支持退款',
      applicablePeople: '所有顾客'
    }
  }
];

// 订单数据
/** @type {import('@shared/types').Order[]} */
export const orders = [
  {
    id: 'ORD20260425001',
    productId: 2,
    productName: '50元话费充值',
    productImage: 'https://aigc-image.bj.bcebos.com/miaobi/5mao/b%275YWF6K%2Bd6LS5XzE3MjQ1MjEyNDcuNDE0MDQ4Nw%3D%3D%27/0.png',
    points: 450,
    status: 'completed',
    exchangeTime: '2026-04-25 14:30:00',
    userName: '张三',
    phone: '138****8888',
    statusLabel: '已完成'
  },
  {
    id: 'ORD20260415002',
    productId: 1,
    productName: '五常大米礼盒',
    productImage: 'https://img0.baidu.com/it/u=330932607,885973046&fm=253&fmt=auto&app=138&f=JPEG?w=1000&h=800',
    points: 580,
    status: 'shipped',
    exchangeTime: '2026-04-15 10:20:00',
    userName: '李四',
    shippingAddress: '北京市朝阳区xxx街道xxx小区',
    statusLabel: '已发货'
  },
  {
    id: 'ORD20260405003',
    productId: 6,
    productName: '腾讯视频会员月卡',
    productImage: 'https://img0.baidu.com/it/u=128562457,694750094&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
    points: 280,
    status: 'completed',
    exchangeTime: '2026-04-05 16:45:00',
    userName: '王五',
    redemptionCode: 'VIP202604058888',
    statusLabel: '已完成'
  },
  {
    id: 'ORD20260428004',
    productId: 8,
    productName: '洗车服务',
    productImage: 'https://img.shetu66.com/2024/05/23/171645710790303819.png?x-oss-process=image/resize,h_900/format,webp',
    points: 150,
    status: 'pending',
    exchangeTime: '2026-04-28 09:15:00',
    userName: '赵六',
    reservationDate: '2026-05-01',
    statusLabel: '待处理'
  },
  {
    id: 'ORD20260427005',
    productId: 4,
    productName: '鲁花食用油',
    productImage: 'https://t14.baidu.com/it/u=1299056294,364236295&fm=224&app=112&f=JPEG?w=500&h=500',
    points: 420,
    status: 'pending',
    exchangeTime: '2026-04-27 15:40:00',
    userName: '孙七',
    shippingAddress: '上海市浦东新区xxx路xxx号',
    statusLabel: '待处理'
  },
  {
    id: 'ORD20260426006',
    productId: 7,
    productName: '京东礼品卡',
    productImage: 'https://img2.baidu.com/it/u=2399193137,596696533&fm=253&app=138&f=JPEG?w=800&h=1067',
    points: 950,
    status: 'completed',
    exchangeTime: '2026-04-26 11:20:00',
    userName: '周八',
    redemptionCode: 'JD202604266666',
    statusLabel: '已完成'
  }
];

// 订单状态映射
export const orderStatusMap = {
  pending: { label: '待处理', color: '#FF9500' },
  shipped: { label: '已发货', color: '#007AFF' },
  completed: { label: '已完成', color: '#34C759' },
  cancelled: { label: '已取消', color: '#8E8E93' }
};