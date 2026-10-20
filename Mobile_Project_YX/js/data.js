const mockData = {
    user: {
        id: 1,
        nickname: '张三',
        avatar: 'https://img2.baidu.com/it/u=1065286049,2311423713&fm=253&fmt=auto&app=138&f=PNG?w=285&h=285',
        points: 2680,
        favorites: [1, 6] // 默认收藏的商品ID
    },
    banners: [
        {
            id: 1,
            image: 'https://img1.baidu.com/it/u=2658195194,2480814528&fm=253&fmt=auto&app=138&f=JPEG?w=610&h=489',
            title: '年终福利大派送',
            target: 'banner-year-end'
        },
        {
            id: 2,
            image: 'https://img.shetu66.com/2023/12/14/1702485126633474.png?x-oss-process=image/resize,h_900/format,webp',
            title: '积分翻倍活动进行中',
            target: 'banner-points-double'
        },
        {
            id: 3,
            image: 'https://img1.baidu.com/it/u=4000788238,2933201418&fm=253&fmt=auto&app=138&f=JPEG?w=570&h=380',
            title: '新用户专享福利',
            target: 'banner-new-user'
        }
    ],
    categories: [
        { id: 1, name: '热门福利', icon: '🔥' },
        { id: 2, name: '实物福利', icon: '📦' },
        { id: 3, name: '虚拟卡券', icon: '🎁' },
        { id: 4, name: '生活服务', icon: '💆' }
    ],
    products: [
        {
            id: 1,
            name: '五常大米礼盒',
            categoryId: 2,
            categoryName: '实物福利',
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
            description: '精选优质五常大米，粒粒饱满，口感细腻，产自黑龙江优质水稻产区，家庭必备好米。',
            specs: {
                '产地': '黑龙江五常市',
                '保质期': '12个月',
                '净含量': '5kg',
                '生产日期': '见包装',
                '储存方式': '阴凉干燥处'
            }
        },
        {
            id: 2,
            name: '50元话费充值',
            categoryId: 3,
            categoryName: '虚拟福利',
            points: 450,
            stock: 100,
            monthlySales: 326,
            brand: '中国移动',
            rating: 4.9,
            reviewCount: 512,
            image: 'https://aigc-image.bj.bcebos.com/miaobi/5mao/b%275YWF6K%2Bd6LS5XzE3MjQ1MjEyNDcuNDE0MDQ4Nw%3D%3D%27/0.png',
            type: 'virtual',
            status: 'online',
            isTop: true,
            validity: '长期有效',
            accountSpeed: '充值后即刻到账',
            description: '全国通用话费充值，支持中国移动、中国联通、中国电信三网充值，话费秒到，方便快捷。',
            specs: {
                '面额': '50元',
                '适用范围': '全国三网（移动/联通/电信）',
                '到账方式': '自动充值到绑定手机号',
                '到账时效': '即时到账',
                '有效期': '充值后永久生效',
                '叠加使用': '可多次充值，叠加计算',
                '转赠': '仅限本人手机号使用'
            }
        },
        {
            id: 3,
            name: '家政保洁服务',
            categoryId: 4,
            categoryName: '生活服务',
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
            serviceProvider: '天鹅到家',
            serviceArea: '全国主要城市',
            serviceValidity: '购买后90天内使用',
            description: '专业保洁团队，标准化服务流程，采用四色毛巾分区清洁，让您的家焕然一新。服务包含客厅、卧室、厨房、卫生间全方位深度清洁。',
            specs: {
                '服务时长': '3小时深度保洁',
                '服务类型': '全屋深度清洁',
                '服务范围': '客厅、卧室、厨房、卫生间',
                '预约规则': '提前2天预约',
                '预约方式': '电话/APP预约',
                '退改规则': '服务开始前24小时可免费取消',
                '适用人群': '所有家庭',
                '服务优势': '专业团队、四色毛巾、标准化流程'
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
            isTop: true,
            description: '非转基因压榨花生油，香浓纯正，富含不饱和脂肪酸，健康烹饪首选。',
            specs: {
                '品牌': '鲁花',
                '产地': '山东莱阳',
                '保质期': '18个月',
                '净含量': '1.8L',
                '工艺': '物理压榨',
                '储存方式': '阴凉干燥处'
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
            reviewCount: 892,
            image: 'https://img.pddpic.com/mms-material-img/2021-07-23/f73d5e19-9da8-425c-887c-650bfde93284.jpeg.a.jpeg',
            type: 'physical',
            status: 'online',
            isTop: false,
            description: '原生木浆制造，柔软舒适，不含荧光剂，湿水不易破，家庭日常用纸首选。',
            specs: {
                '品牌': '维达',
                '产地': '广东江门',
                '保质期': '3年',
                '规格': '130抽*24包',
                '材质': '原生木浆',
                '是否含荧光剂': '不含'
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
            validity: '激活后30天内有效',
            accountSpeed: '兑换后24小时内到账',
            description: '腾讯视频VIP会员月卡，海量影视内容无广告观看，享受高清画质和独家会员特权，支持手机、电脑、平板多设备使用。',
            specs: {
                '会员时长': '1个月',
                '会员类型': '腾讯视频VIP',
                '适用设备': '手机、电脑、平板、电视',
                '到账方式': '兑换码发送至手机',
                '到账时效': '即时生效',
                '有效期': '兑换后30天内激活使用',
                '叠加使用': '可多次充值叠加会员时长',
                '转赠': '支持转赠给他人'
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
            validity: '永久有效',
            accountSpeed: '兑换后24小时内到账',
            description: '京东商城通用礼品卡，万千商品随心选，支持京东自营商品全品类使用，送礼自用两相宜。',
            specs: {
                '面额': '100元',
                '使用范围': '京东全品类自营商品',
                '适用平台': '京东APP/网页版',
                '到账方式': '电子卡密发送至手机',
                '有效期': '永久有效',
                '叠加使用': '可多次充值叠加使用',
                '转赠': '支持转赠，可绑定他人手机号'
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
            serviceProvider: '车享家',
            serviceArea: '全国连锁门店',
            serviceValidity: '购买后60天内使用',
            description: '专业洗车服务，内外清洁，让爱车焕然一新。服务包含外观冲洗、车身擦拭、内饰清理、玻璃清洗等。',
            specs: {
                '服务时长': '约30分钟',
                '服务类型': '精致洗车',
                '服务范围': '车身外观清洗、内饰擦拭、玻璃清洗',
                '预约规则': '提前1天预约',
                '预约方式': 'APP/电话预约',
                '退改规则': '服务开始前4小时可免费取消',
                '适用门店': '全国车享家连锁门店',
                '注意事项': '建议提前确认门店位置'
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
            serviceProvider: '爱康国宾',
            serviceArea: '全国主要城市',
            serviceValidity: '购买后180天内使用',
            description: '全面体检套餐，关爱健康从定期检查开始。包含血常规、尿常规、肝肾功能、心电图、胸片、腹部B超等多项检查，专业医师解读报告。',
            specs: {
                '套餐类型': '全面体检套餐A',
                '服务时长': '约2-3小时',
                '体检项目': '血常规、尿常规、肝肾功能、心电图、胸片、腹部B超等',
                '预约规则': '提前3-5天预约',
                '预约方式': '电话/APP预约',
                '报告获取': '5-7个工作日内出报告',
                '报告解读': '专业医师一对一解读',
                '适用人群': '18岁以上成年人',
                '注意事项': '体检当天需空腹，携带身份证'
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
            status: 'online',
            isTop: false,
            serviceProvider: '肯德基',
            serviceArea: '全国肯德基门店',
            serviceValidity: '购买后30天内使用',
            description: '肯德基代金券，美味随心享。全国肯德基门店通用，可用于点餐消费抵扣。',
            specs: {
                '面额': '30元代金券',
                '使用范围': '全国肯德基门店',
                '使用方式': '出示券码给收银员扫描',
                '有效期': '激活后30天内使用',
                '叠加使用': '可叠加使用，不找零',
                '适用餐品': '全场餐品通用',
                '使用限制': '不可用于购买香烟、酒水',
                '转赠': '支持转赠'
            }
        }
    ],
    reviews: [
        {
            id: 1,
            productId: 1,
            userName: '张***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
            rating: 5,
            content: '五常大米真的很好，粒粒分明，口感香糯，家里人都说好吃！下次还会回购的。',
            time: '2026-04-25 14:30',
            images: []
        },
        {
            id: 2,
            productId: 1,
            userName: '李***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
            rating: 5,
            content: '包装很好，没有碎米现象，京东物流也很快，整体非常满意！',
            time: '2026-04-22 09:15',
            images: ['https://picsum.photos/200/200?random=11']
        },
        {
            id: 3,
            productId: 1,
            userName: '王***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
            rating: 4,
            content: '大米质量不错，但是价格要是能再优惠点就好了，总体好评！',
            time: '2026-04-20 16:45',
            images: []
        },
        {
            id: 4,
            productId: 2,
            userName: '赵***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
            rating: 5,
            content: '话费充值秒到账，非常方便！支持三网充值，再也不用跑去营业厅了。',
            time: '2026-04-28 10:20',
            images: []
        },
        {
            id: 5,
            productId: 2,
            userName: '钱***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
            rating: 5,
            content: '已经是第三次购买了，操作简单，到账快速，五星好评！',
            time: '2026-04-26 15:30',
            images: []
        },
        {
            id: 6,
            productId: 2,
            userName: '孙***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
            rating: 4,
            content: '到账速度很快，但是显示有点延迟，总体很满意。',
            time: '2026-04-24 11:00',
            images: []
        },
        {
            id: 7,
            productId: 3,
            userName: '周***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
            rating: 5,
            content: '保洁阿姨非常专业，清洁得很彻底，连角落都打扫干净了，服务超预期！',
            time: '2026-04-27 14:00',
            images: ['https://picsum.photos/200/200?random=21', 'https://picsum.photos/200/200?random=22']
        },
        {
            id: 8,
            productId: 3,
            userName: '吴***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
            rating: 4,
            content: '服务态度很好，工具齐全，就是预约等待时间有点长，建议提前预约。',
            time: '2026-04-23 10:30',
            images: []
        },
        {
            id: 9,
            productId: 4,
            userName: '郑***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9',
            rating: 5,
            content: '鲁花油一直是我的首选，油质清澈，炒菜很香，家中常备！',
            time: '2026-04-26 08:45',
            images: []
        },
        {
            id: 10,
            productId: 4,
            userName: '冯***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10',
            rating: 5,
            content: '非转基因，吃着放心。快递包装也很好，没有渗漏。',
            time: '2026-04-21 17:20',
            images: []
        },
        {
            id: 11,
            productId: 5,
            userName: '陈***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11',
            rating: 4,
            content: '纸巾质量很好，柔软亲肤，一提能用很久，性价比高。',
            time: '2026-04-25 12:00',
            images: []
        },
        {
            id: 12,
            productId: 5,
            userName: '褚***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12',
            rating: 5,
            content: '维达纸巾大品牌值得信赖，纸张厚实，湿水也不破，推荐购买！',
            time: '2026-04-19 09:30',
            images: []
        },
        {
            id: 13,
            productId: 6,
            userName: '卫***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13',
            rating: 5,
            content: '腾讯视频会员太好用了！追剧无广告，高清画质，还能看独家内容，值！',
            time: '2026-04-28 20:00',
            images: []
        },
        {
            id: 14,
            productId: 6,
            userName: '蒋***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=14',
            rating: 5,
            content: '兑换码发送很快，使用方便，立刻就能开通会员，五星好评！',
            time: '2026-04-27 18:30',
            images: []
        },
        {
            id: 15,
            productId: 7,
            userName: '沈***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=15',
            rating: 5,
            content: '京东礼品卡非常方便，买东西直接抵扣，质量有保障，支持！',
            time: '2026-04-26 11:15',
            images: []
        },
        {
            id: 16,
            productId: 7,
            userName: '韩***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=16',
            rating: 4,
            content: '卡密到账快，面额正确，可以在京东买各种东西，挺好的。',
            time: '2026-04-24 14:45',
            images: []
        },
        {
            id: 17,
            productId: 8,
            userName: '杨***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=17',
            rating: 5,
            content: '洗车服务很到位，车内外都洗干净了，工作人员态度也很好，推荐！',
            time: '2026-04-27 16:00',
            images: ['https://picsum.photos/200/200?random=31']
        },
        {
            id: 18,
            productId: 8,
            userName: '朱***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=18',
            rating: 4,
            content: '整体不错，洗得挺干净的，就是等位时间有点长，建议提前预约。',
            time: '2026-04-25 10:30',
            images: []
        },
        {
            id: 19,
            productId: 9,
            userName: '秦***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=19',
            rating: 5,
            content: '体检套餐很全面，医护人员专业，报告解读也很详细，非常满意！',
            time: '2026-04-26 08:00',
            images: []
        },
        {
            id: 20,
            productId: 9,
            userName: '许***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=20',
            rating: 5,
            content: '环境很好，检查项目很全，医生很有耐心，整体体验很棒！',
            time: '2026-04-22 09:00',
            images: []
        },
        {
            id: 21,
            productId: 10,
            userName: '何***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=21',
            rating: 5,
            content: '肯德基代金券太实用了，买套餐直接抵扣，味道好极了！',
            time: '2026-04-28 12:00',
            images: []
        },
        {
            id: 22,
            productId: 10,
            userName: '吕***',
            userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=22',
            rating: 4,
            content: '券很好用，到店出示就能用，买早餐省了不少钱，好评！',
            time: '2026-04-25 08:30',
            images: []
        }
    ],
    orders: [
        {
            id: 'ORD20260428004',
            productId: 8,
            productName: '洗车服务',
            productImage: 'https://img.shetu66.com/2024/05/23/171645710790303819.png?x-oss-process=image/resize,h_900/format,webp',
            points: 150,
            status: 'pending',
            exchangeTime: '2026-04-28 09:15:00',
            statusLabel: '待处理'
        },
        {
            id: 'ORD20260425001',
            productId: 2,
            productName: '50元话费充值',
            productImage: 'https://aigc-image.bj.bcebos.com/miaobi/5mao/b%275YWF6K%2Bd6LS5XzE3MjQ1MjEyNDcuNDE0MDQ4Nw%3D%3D%27/0.png',
            points: 450,
            status: 'completed',
            exchangeTime: '2026-04-25 14:30:00',
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
            statusLabel: '已发货'
        },
        {
            id: 'ORD20260405003',
            productId: 6,
            productName: '腾讯视频月卡',
            productImage: 'https://img0.baidu.com/it/u=128562457,694750094&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
            points: 280,
            status: 'completed',
            exchangeTime: '2026-04-05 16:45:00',
            statusLabel: '已完成'
        },
        {
            id: 'ORD20260420005',
            productId: 9,
            productName: '体检套餐',
            productImage: 'https://t13.baidu.com/it/u=562281217,11683301&fm=224&app=112&f=JPEG?w=500&h=500',
            points: 1580,
            status: 'cancelled',
            exchangeTime: '2026-04-20 11:30:00',
            statusLabel: '已取消',
            cancelTime: '2026-04-20 14:00:00',
            cancelReason: '行程变更，无法预约'
        }
    ],
    pointsHistory: [
        { id: 1, type: 'earn', points: 500, description: '签到奖励', time: '2026-04-28 09:00:00' },
        { id: 2, type: 'spend', points: -150, description: '兑换洗车服务', time: '2026-04-28 09:15:00' },
        { id: 3, type: 'earn', points: 100, description: '完成任务奖励', time: '2026-04-25 10:00:00' },
        { id: 4, type: 'spend', points: -450, description: '兑换50元话费', time: '2026-04-25 14:30:00' },
        { id: 5, type: 'spend', points: -580, description: '兑换五常大米礼盒', time: '2026-04-15 10:20:00' },
        { id: 6, type: 'spend', points: -280, description: '兑换腾讯视频月卡', time: '2026-04-05 16:45:00' },
        { id: 7, type: 'earn', points: 200, description: '月度奖励', time: '2026-04-01 00:00:00' }
    ]
};

function getProductById(productId) {
    return mockData.products.find(p => p.id === productId);
}

function getOrdersByStatus(status) {
    if (status === 'all') return [...mockData.orders];
    return mockData.orders.filter(o => o.status === status);
}

function getPointsHistoryByType(type) {
    if (type === 'all') return [...mockData.pointsHistory];
    return mockData.pointsHistory.filter(h => h.type === type);
}

function getUserPoints() {
    return mockData.user.points;
}

function updateUserPoints(points) {
    mockData.user.points += points;
}

function addOrder(order) {
    mockData.orders.unshift(order);
}

function addPointsRecord(record) {
    mockData.pointsHistory.unshift(record);
}

function getPendingOrderCount() {
    return mockData.orders.filter(o => o.status === 'pending').length;
}

function getOnlineProductCount() {
    return mockData.products.filter(p => p.status === 'online').length;
}

function getTodayPointsChanges() {
    const today = new Date().toISOString().split('T')[0];
    return mockData.pointsHistory.filter(h => h.time.startsWith(today)).length;
}

function getTotalEarned() {
    return mockData.pointsHistory
        .filter(h => h.type === 'earn')
        .reduce((sum, h) => sum + h.points, 0);
}

function getTotalSpent() {
    return Math.abs(mockData.pointsHistory
        .filter(h => h.type === 'spend')
        .reduce((sum, h) => sum + h.points, 0));
}

function isFavorite(productId) {
    return mockData.user.favorites.includes(productId);
}

function toggleFavorite(productId) {
    const index = mockData.user.favorites.indexOf(productId);
    if (index > -1) {
        mockData.user.favorites.splice(index, 1);
        return false;
    } else {
        mockData.user.favorites.push(productId);
        return true;
    }
}

function getFavorites() {
    return mockData.products.filter(p => mockData.user.favorites.includes(p.id));
}