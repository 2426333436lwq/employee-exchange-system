import { ref, reactive } from 'vue'
import type {
  Product,
  Category,
  Order,
  UserInfo,
  PointsRecord
} from '@shared/types'

// 领域类型统一来自共享契约（shared/types.ts），此处不再重复定义，
// 避免前后台各自维护一份导致字段漂移。
export type { Product, Category, Order, UserInfo, PointsRecord }

export const categories: Category[] = [
  { id: 1, name: '热门福利', icon: '🔥', sortOrder: 1, status: 'active' },
  { id: 2, name: '实物福利', icon: '📦', sortOrder: 2, status: 'active' },
  { id: 3, name: '虚拟福利', icon: '🎁', sortOrder: 3, status: 'active' },
  { id: 4, name: '生活服务', icon: '💆', sortOrder: 4, status: 'active' }
]

// ==================== 本地存储（轻量持久化） ====================
const STORAGE_KEYS = {
  userInfo: 'mobile_userInfo',
  orders: 'mobile_orders',
  pointsHistory: 'mobile_pointsHistory'
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof uni !== 'undefined') {
      const data = uni.getStorageSync(key)
      if (data) return data as T
    }
  } catch (e) {
    // 忽略读取失败，使用默认值
  }
  return fallback
}

function saveToStorage(key: string, data: unknown) {
  try {
    if (typeof uni !== 'undefined') {
      uni.setStorageSync(key, data)
    }
  } catch (e) {
    // 忽略写入失败
  }
}

// ==================== 时间工具 ====================
// 实现已抽至 @/utils/date，此处再导出以保持既有引用可用
export { formatDateTime, dateKeyOf, todayKey } from '@/utils/date'
import { formatDateTime } from '@/utils/date'

/** 生成 n 天前的某个时刻（mock 数据动态时间） */
function daysAgo(n: number, hour = 9, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return formatDateTime(d)
}

// ==================== 用户信息（响应式 + 持久化） ====================
const defaultUserInfo: UserInfo = {
  id: 1,
  nickname: '张三',
  avatar: 'https://img2.baidu.com/it/u=1065286049,2311423713&fm=253&fmt=auto&app=138&f=PNG?w=285&h=285',
  points: 2680,
  position: '高级工程师',
  department: '技术研发部',
  employeeId: 'EMP2023001',
  hireDate: '2023-06-15',
  email: 'zhangsan@company.com',
  phone: '138****8888'
}

export const userInfo = reactive<UserInfo>({
  ...defaultUserInfo,
  ...loadFromStorage<UserInfo>(STORAGE_KEYS.userInfo, defaultUserInfo)
})

// ==================== 积分明细（响应式 + 持久化） ====================
const defaultPointsHistory: PointsRecord[] = [
  { id: 1, type: 'earn', points: 500, description: '签到奖励', time: daysAgo(0, 9, 0) },
  { id: 2, type: 'spend', points: -450, description: '兑换50元话费', time: daysAgo(4, 14, 30) },
  { id: 3, type: 'earn', points: 100, description: '完成任务奖励', time: daysAgo(4, 10, 0) },
  { id: 4, type: 'spend', points: -580, description: '兑换五常大米礼盒', time: daysAgo(14, 10, 20) },
  { id: 5, type: 'earn', points: 200, description: '月度奖励', time: daysAgo(32, 0, 0) }
]

export const pointsHistory = ref<PointsRecord[]>(loadFromStorage<PointsRecord[]>(STORAGE_KEYS.pointsHistory, defaultPointsHistory))

let nextRecordId = pointsHistory.value.reduce((max, r) => Math.max(max, r.id), 0) + 1

/** 扣减积分并追加消耗记录；积分不足时不扣减、不记流水，返回当前积分 */
export function spendPoints(amount: number, description: string): number {
  if (amount <= 0 || userInfo.points < amount) {
    return userInfo.points
  }
  userInfo.points -= amount
  pointsHistory.value.push({ id: nextRecordId++, type: 'spend', points: -amount, description, time: formatDateTime(new Date()) })
  saveToStorage(STORAGE_KEYS.userInfo, userInfo)
  saveToStorage(STORAGE_KEYS.pointsHistory, pointsHistory.value)
  return userInfo.points
}

/** 增加积分并追加获得记录 */
export function earnPoints(amount: number, description: string): number {
  userInfo.points += amount
  pointsHistory.value.push({ id: nextRecordId++, type: 'earn', points: amount, description, time: formatDateTime(new Date()) })
  saveToStorage(STORAGE_KEYS.userInfo, userInfo)
  saveToStorage(STORAGE_KEYS.pointsHistory, pointsHistory.value)
  return userInfo.points
}

// ==================== 商品（响应式） ====================
// 说明：商品/库存保持内存态、不做持久化（刷新即恢复默认库存），
// 便于演示与测试；若需真实库存可在接入后端后替换。
export const products = ref<Product[]>([
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
    isTop: true,
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
    name: '腾讯视频月卡',
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
])

// ==================== 订单（响应式 + 持久化） ====================
const defaultOrders: Order[] = [
  {
    id: 'ORD20260425001',
    productId: 2,
    productName: '50元话费充值',
    productImage: 'https://aigc-image.bj.bcebos.com/miaobi/5mao/b%275YWF6K%2Bd6LS5XzE3MjQ1MjEyNDcuNDE0MDQ4Nw%3D%3D%27/0.png',
    points: 450,
    status: 'completed',
    exchangeTime: daysAgo(4, 14, 30),
    userName: '张三',
    statusLabel: '已完成'
  },
  {
    id: 'ORD20260415002',
    productId: 1,
    productName: '五常大米礼盒',
    productImage: 'https://img0.baidu.com/it/u=330932607,885973046&fm=253&fmt=auto&app=138&f=JPEG?w=1000&h=800',
    points: 580,
    status: 'shipped',
    exchangeTime: daysAgo(14, 10, 20),
    userName: '张三',
    statusLabel: '已发货'
  },
  {
    id: 'ORD20260405003',
    productId: 6,
    productName: '腾讯视频会员月卡',
    productImage: 'https://img0.baidu.com/it/u=128562457,694750094&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
    points: 280,
    status: 'completed',
    exchangeTime: daysAgo(24, 16, 45),
    userName: '张三',
    statusLabel: '已完成'
  },
  {
    id: 'ORD20260428004',
    productId: 8,
    productName: '洗车服务',
    productImage: 'https://img.shetu66.com/2024/05/23/171645710790303819.png?x-oss-process=image/resize,h_900/format,webp',
    points: 150,
    status: 'pending',
    exchangeTime: daysAgo(0, 9, 15),
    userName: '张三',
    statusLabel: '待处理'
  }
]

export const orders = ref<Order[]>(loadFromStorage<Order[]>(STORAGE_KEYS.orders, defaultOrders))

export function saveOrders() {
  saveToStorage(STORAGE_KEYS.orders, orders.value)
}

export function saveUserInfoData() {
  saveToStorage(STORAGE_KEYS.userInfo, userInfo)
}
