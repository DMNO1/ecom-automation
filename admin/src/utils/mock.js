/**
 * 电商管理后台 - 模拟数据层
 * 提供真实业务场景的模拟数据，用于前端开发和演示
 */
import dayjs from 'dayjs';

// ============ 平台列表 ============
export const PLATFORMS = [
  { key: 'douyin', name: '抖音', color: '#FE2C55', icon: '🎵' },
  { key: 'pdd', name: '拼多多', color: '#E02E24', icon: '🔴' },
  { key: 'xianyu', name: '闲鱼', color: '#FF6A00', icon: '🐟' },
  { key: 'kuaishou', name: '快手', color: '#FF4906', icon: '⚡' },
];

// ============ 订单状态 ============
export const ORDER_STATUS = {
  pending: { label: '待付款', color: '#F5A623' },
  paid: { label: '已付款', color: '#165DFF' },
  shipped: { label: '已发货', color: '#7B61FF' },
  delivered: { label: '已送达', color: '#00B42A' },
  completed: { label: '已完成', color: '#86909C' },
  refunding: { label: '退款中', color: '#FF7D00' },
  refunded: { label: '已退款', color: '#F53F3F' },
  cancelled: { label: '已取消', color: '#C9CDD4' },
};

// ============ 随机工具 ============
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const randDate = (daysAgo = 30) =>
  dayjs().subtract(rand(0, daysAgo), 'day').format('YYYY-MM-DD HH:mm:ss');

// ============ 商品数据 ============
const PRODUCT_NAMES = [
  '智能降噪蓝牙耳机 Pro Max',
  '便携式迷你投影仪 4K高清',
  '磁吸无线充电宝 20000mAh',
  '超轻碳纤维行李箱 20寸',
  '人体工学护腰办公椅',
  '智能恒温保温杯 500ml',
  '空气净化器 HEPA滤网',
  '电动牙刷 声波震动款',
  '智能手表 运动健康监测',
  '降噪头戴式耳机 Hi-Res',
  '机械键盘 青轴RGB背光',
  'USB-C扩展坞 12合1',
  '桌面加湿器 超声波静音',
  '智能门锁 指纹密码锁',
  '无线鼠标 人体工学设计',
  '颈椎按摩仪 热敷理疗',
  'LED护眼台灯 无极调光',
  '筋膜枪 深层肌肉放松',
  '扫地机器人 激光导航',
  '智能音箱 语音助手',
];

const CATEGORIES = [
  '数码配件', '智能家居', '生活用品', '个护健康', '办公用品',
];

let productId = 1000;
export const generateProducts = (count = 20) =>
  Array.from({ length: count }, () => {
    const cost = rand(30, 300);
    const price = Math.round(cost * rand(2, 4) * 10) / 10;
    const stock = rand(0, 500);
    productId++;
    return {
      id: `SKU-${productId}`,
      name: PRODUCT_NAMES[productId % PRODUCT_NAMES.length],
      category: pick(CATEGORIES),
      platform: pick(PLATFORMS).key,
      price,
      cost,
      stock,
      sales: rand(10, 5000),
      revenue: Math.round(price * rand(10, 5000) * 100) / 100,
      status: stock === 0 ? 'out_of_stock' : stock < 20 ? 'low_stock' : 'active',
      rating: +(3.5 + Math.random() * 1.5).toFixed(1),
      reviews: rand(50, 5000),
      image: `https://picsum.photos/seed/${productId}/200/200`,
      createdAt: randDate(90),
      updatedAt: randDate(7),
    };
  });

// ============ 订单数据 ============
const ADDRESSES = [
  '北京市朝阳区建国路88号', '上海市浦东新区陆家嘴环路100号',
  '广州市天河区天河路385号', '深圳市南山区科技园南区',
  '杭州市西湖区文三路477号', '成都市锦江区春熙路1号',
  '南京市鼓楼区中山路321号', '武汉市洪山区光谷大道77号',
  '重庆市渝中区解放碑步行街', '苏州市工业园区星湖街328号',
];

const CUSTOMER_NAMES = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '杨九', '黄十', '周十一', '吴十二'];

let orderId = 20000;
export const generateOrders = (count = 50) =>
  Array.from({ length: count }, () => {
    const statusKeys = Object.keys(ORDER_STATUS);
    const status = pick(statusKeys);
    const items = rand(1, 5);
    const amount = +(rand(50, 2000) + Math.random()).toFixed(2);
    orderId++;
    return {
      id: `ORD-${orderId}`,
      orderNo: `${dayjs().format('YYYYMMDD')}${rand(100000, 999999)}`,
      platform: pick(PLATFORMS).key,
      customer: pick(CUSTOMER_NAMES),
      phone: `1${rand(30, 99)}${rand(10000000, 99999999)}`,
      address: pick(ADDRESSES),
      items,
      amount,
      profit: +(amount * rand(15, 45) / 100).toFixed(2),
      status,
      paymentMethod: pick(['微信支付', '支付宝', '银行卡', '花呗']),
      createdAt: randDate(30),
      paidAt: status !== 'pending' ? randDate(29) : null,
      shippedAt: ['shipped', 'delivered', 'completed'].includes(status) ? randDate(20) : null,
      completedAt: status === 'completed' ? randDate(10) : null,
      remark: Math.random() > 0.7 ? pick(['请尽快发货', '包装要仔细', '送礼物用', '加急', '']) : '',
      logisticsNo: status !== 'pending' && status !== 'paid' ? `SF${rand(1000000000, 9999999999)}` : null,
    };
  });

// ============ 客服消息 ============
const CS_TOPICS = [
  { question: '这个耳机支持降噪吗？', answer: '亲，这款耳机支持主动降噪功能，降噪深度可达35dB，非常适合通勤和办公使用哦~' },
  { question: '发货大概多久到？', answer: '亲，我们默认发顺丰快递，一般1-3天就能到达您手中。偏远地区可能需要3-5天。' },
  { question: '有没有优惠券？', answer: '亲，目前店铺有满200减30的优惠活动哦！新客还可以领取10元无门槛券~' },
  { question: '质量问题可以退换吗？', answer: '亲，质量问题我们包退换的！7天无理由退换，15天质量问题换新，您放心购买~' },
  { question: '这款颜色有其他选择吗？', answer: '亲，这款目前有星空黑、云雾白、玫瑰金三种颜色可选，都很好看哦！' },
  { question: '能开发票吗？', answer: '亲，可以开发票的，下单时在备注里注明发票抬头和税号即可，我们会随包裹一起寄出。' },
  { question: '这个充电宝能带上飞机吗？', answer: '亲，20000mAh的充电宝是可以带上飞机的，符合民航规定。但不能托运，需要随身携带哦~' },
  { question: '键盘是什么轴体？', answer: '亲，这款机械键盘是青轴的，段落感强，打字手感特别好。也有红轴和茶轴可选哦~' },
];

let msgId = 0;
export const generateConversations = (count = 10) =>
  Array.from({ length: count }, (_, i) => {
    const topic = pick(CS_TOPICS);
    const platform = pick(PLATFORMS);
    const customerName = pick(CUSTOMER_NAMES);
    msgId++;
    return {
      id: `CS-${msgId}`,
      customer: customerName,
      platform: platform.key,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customerName}`,
      lastMessage: topic.answer.slice(0, 30) + '...',
      unread: rand(0, 5),
      status: pick(['waiting', 'processing', 'resolved', 'ai_handling']),
      updatedAt: randDate(3),
      messages: [
        { role: 'customer', content: topic.question, time: randDate(3) },
        { role: 'agent', content: topic.answer, time: randDate(2) },
        ...(Math.random() > 0.5
          ? [{ role: 'customer', content: '好的，谢谢！', time: randDate(1) }]
          : []),
      ],
    };
  });

// ============ 竞品数据 ============
export const generateCompetitors = (count = 15) =>
  Array.from({ length: count }, (_, i) => {
    const price = rand(50, 500);
    return {
      id: `CMP-${i + 1}`,
      name: pick(PRODUCT_NAMES),
      competitor: pick(['品牌A旗舰店', '品牌B专营店', '大牌优选店', '品质生活馆']),
      platform: pick(PLATFORMS).key,
      theirPrice: price,
      ourPrice: +(price * rand(80, 120) / 100).toFixed(2),
      theirSales: rand(100, 10000),
      ourSales: rand(50, 5000),
      theirRating: +(3.5 + Math.random() * 1.5).toFixed(1),
      priceDiff: 0,
      updatedAt: randDate(1),
    };
  }).map(item => ({
    ...item,
    priceDiff: +(((item.ourPrice - item.theirPrice) / item.theirPrice) * 100).toFixed(1),
  }));

// ============ Dashboard 统计 ============
export const generateDashboardStats = () => {
  const todayOrders = rand(80, 200);
  const todayRevenue = +(rand(5000, 20000) + Math.random() * 100).toFixed(2);
  const todayCustomers = rand(30, 100);
  const conversionRate = +(rand(2, 8) + Math.random()).toFixed(2);

  return {
    todayOrders,
    todayRevenue,
    todayCustomers,
    conversionRate,
    ordersTrend: rand(-15, 25),
    revenueTrend: rand(-10, 30),
    customersTrend: rand(-5, 20),
    conversionTrend: rand(-2, 3),
    // 近7天趋势
    weeklyTrend: Array.from({ length: 7 }, (_, i) => ({
      date: dayjs().subtract(6 - i, 'day').format('MM-DD'),
      orders: rand(60, 200),
      revenue: rand(4000, 18000),
      customers: rand(20, 80),
    })),
    // 平台分布
    platformDistribution: PLATFORMS.map(p => ({
      platform: p.name,
      value: rand(1000, 8000),
      color: p.color,
    })),
    // 品类销售
    categorySales: CATEGORIES.map(cat => ({
      category: cat,
      sales: rand(2000, 15000),
      orders: rand(50, 500),
    })),
    // 待处理事项
    pendingTasks: {
      pendingOrders: rand(5, 30),
      pendingRefunds: rand(0, 10),
      lowStockProducts: rand(2, 15),
      unreadMessages: rand(3, 20),
      competitorAlerts: rand(0, 5),
    },
    // 热销商品 Top 5
    topProducts: Array.from({ length: 5 }, (_, i) => ({
      rank: i + 1,
      name: PRODUCT_NAMES[i],
      sales: rand(200, 2000),
      revenue: rand(10000, 100000),
    })),
  };
};

// ============ 设置 ============
export const DEFAULT_SETTINGS = {
  general: {
    shopName: '我的电商店铺',
    logo: '',
    contactPhone: '400-000-0000',
    contactEmail: 'support@example.com',
    autoReply: true,
    language: 'zh-CN',
  },
  platforms: {
    douyin: { enabled: true, appId: '1903132504', autoSync: true, syncInterval: 15 },
    pdd: { enabled: true, appId: '', autoSync: false, syncInterval: 30 },
    xianyu: { enabled: false, appId: '', autoSync: false, syncInterval: 60 },
    kuaishou: { enabled: false, appId: '', autoSync: false, syncInterval: 30 },
  },
  notifications: {
    orderAlert: true,
    refundAlert: true,
    stockAlert: true,
    competitorAlert: true,
    dailyReport: true,
    alertChannel: 'feishu',
  },
  ai: {
    autoCustomerService: true,
    autoProductDescription: false,
    autoPricing: false,
    confidenceThreshold: 0.8,
    model: 'gpt-4',
  },
};
