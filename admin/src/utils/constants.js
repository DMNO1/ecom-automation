export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.PENDING]: '待处理',
  [ORDER_STATUS.PROCESSING]: '处理中',
  [ORDER_STATUS.SHIPPED]: '已发货',
  [ORDER_STATUS.DELIVERED]: '已送达',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.REFUNDED]: '已退款',
};

export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.PENDING]: 'orange',
  [ORDER_STATUS.PROCESSING]: 'blue',
  [ORDER_STATUS.SHIPPED]: 'cyan',
  [ORDER_STATUS.DELIVERED]: 'green',
  [ORDER_STATUS.CANCELLED]: 'red',
  [ORDER_STATUS.REFUNDED]: 'purple',
};

export const PLATFORMS = {
  TAOBAO: 'taobao',
  PDD: 'pdd',
  DOUYIN: 'douyin',
  JD: 'jd',
};

export const PLATFORM_TEXT = {
  [PLATFORMS.TAOBAO]: '淘宝',
  [PLATFORMS.PDD]: '拼多多',
  [PLATFORMS.DOUYIN]: '抖音',
  [PLATFORMS.JD]: '京东',
};

export const PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
