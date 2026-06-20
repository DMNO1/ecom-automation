/**
 * API服务层 - 统一数据接口
 * 
 * 双模式：
 * 1. 后端API可用 → 从真实抖音API获取数据
 * 2. 后端不可用 → 降级使用本地Mock数据
 */

import { 
  generateOrders, generateProducts, generateConversations, 
  generateCompetitors, generateDashboardStats,
  PLATFORMS, ORDER_STATUS 
} from '../utils/mock';

// 后端API地址（可通过环境变量配置）
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

// 当前后端是否可用
let apiAvailable = false;
let authToken = null;

// 检测后端可用性
async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { 
      signal: AbortSignal.timeout(3000) 
    });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

// 通用API请求
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

// ==================== 抖音授权 ====================

export async function getDouyinAuthUrl(redirectUri) {
  try {
    const data = await apiRequest(`/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
    return data.auth_url;
  } catch {
    return null;
  }
}

export async function handleDouyinCallback(code) {
  try {
    const data = await apiRequest(`/auth/callback?code=${code}`, { method: 'POST' });
    authToken = data.access_token;
    // 持久化token
    localStorage.setItem('douyin_token', JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('授权回调失败:', e);
    return null;
  }
}

// ==================== 订单 ====================

export async function fetchOrders(params = {}) {
  if (!apiAvailable) {
    return { items: generateOrders(80), total: 80, source: 'mock' };
  }
  try {
    const query = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/order/list?${query}`);
    return { ...data, source: 'api' };
  } catch {
    return { items: generateOrders(80), total: 80, source: 'mock' };
  }
}

// ==================== 商品 ====================

export async function fetchProducts(params = {}) {
  if (!apiAvailable) {
    return { items: generateProducts(30), total: 30, source: 'mock' };
  }
  try {
    const query = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/product/list?${query}`);
    return { ...data, source: 'api' };
  } catch {
    return { items: generateProducts(30), total: 30, source: 'mock' };
  }
}

// ==================== 客服消息 ====================

export async function fetchConversations() {
  if (!apiAvailable) {
    return { items: generateConversations(12), source: 'mock' };
  }
  try {
    const data = await apiRequest('/api/customer/conversations');
    return { ...data, source: 'api' };
  } catch {
    return { items: generateConversations(12), source: 'mock' };
  }
}

export async function sendMessage(conversationId, content) {
  if (!apiAvailable) {
    return { success: true, source: 'mock' };
  }
  try {
    return await apiRequest('/api/customer/send', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, content }),
    });
  } catch {
    return { success: true, source: 'mock' };
  }
}

// ==================== Dashboard ====================
// 注意: 使用相对路径通过 Vite 代理转发到 API 网关 (port 8000)
// 不走 apiRequest() 因为 API_BASE 指向 douyin-adapter (port 8001)

export async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Dashboard stats API error: ${res.status}`);
    const json = await res.json();
    const data = json.data || json;
    return { ...data, source: 'api' };
  } catch {
    return { ...generateDashboardStats(), source: 'mock' };
  }
}

export async function fetchDashboardTrend(days = 7) {
  try {
    const res = await fetch(`/api/dashboard/trend?days=${days}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Dashboard trend API error: ${res.status}`);
    const json = await res.json();
    const data = json.data || json;
    return { ...data, source: 'api' };
  } catch {
    return null;
  }
}

// ==================== 竞品 ====================

// ==================== 营销 ====================

// Mock 优惠券数据
const mockCoupons = [
  { id: 1, name: '新用户专享券', type: '满减券', discount: 20, condition: '满100可用', total: 10000, used: 3562, status: 'active', startTime: '2026-04-01', endTime: '2026-04-30', createdAt: '2026-03-28' },
  { id: 2, name: '会员日折扣券', type: '折扣券', discount: 85, condition: '满200可用', total: 5000, used: 1234, status: 'active', startTime: '2026-04-15', endTime: '2026-04-20', createdAt: '2026-04-10' },
  { id: 3, name: '春季大促券', type: '满减券', discount: 50, condition: '满300可用', total: 20000, used: 8765, status: 'active', startTime: '2026-04-01', endTime: '2026-05-01', createdAt: '2026-03-25' },
  { id: 4, name: '限时秒杀券', type: '无门槛券', discount: 10, condition: '无限制', total: 50000, used: 45231, status: 'expired', startTime: '2026-03-01', endTime: '2026-03-31', createdAt: '2026-02-25' },
  { id: 5, name: 'VIP专属券', type: '折扣券', discount: 70, condition: '满500可用', total: 1000, used: 234, status: 'active', startTime: '2026-04-01', endTime: '2026-06-30', createdAt: '2026-03-20' },
];

// Mock 促销活动数据
const mockCampaigns = [
  { id: 1, name: '春季焕新大促', type: '满减活动', startTime: '2026-04-01', endTime: '2026-04-30', products: 156, sales: 23456, revenue: 1256800, status: 'ongoing', participants: 12580 },
  { id: 2, name: '会员专享日', type: '折扣活动', startTime: '2026-04-15', endTime: '2026-04-20', products: 89, sales: 8765, revenue: 456200, status: 'ongoing', participants: 5620 },
  { id: 3, name: '限时秒杀专场', type: '秒杀活动', startTime: '2026-04-10', endTime: '2026-04-12', products: 24, sales: 15620, revenue: 892300, status: 'ended', participants: 23150 },
  { id: 4, name: '新品首发特惠', type: '新品活动', startTime: '2026-04-20', endTime: '2026-04-25', products: 12, sales: 0, revenue: 0, status: 'pending', participants: 0 },
  { id: 5, name: '五一劳动节大促', type: '满减活动', startTime: '2026-05-01', endTime: '2026-05-07', products: 200, sales: 0, revenue: 0, status: 'pending', participants: 0 },
];

// Mock 分销员数据
const mockDistributors = [
  { id: 1, name: '张小明', avatar: '', level: '金牌分销员', sales: 156200, orders: 324, commission: 12580, status: 'active', joinDate: '2025-06-15', phone: '138****8888' },
  { id: 2, name: '李美丽', avatar: '', level: '银牌分销员', sales: 89500, orders: 186, commission: 7160, status: 'active', joinDate: '2025-08-20', phone: '139****9999' },
  { id: 3, name: '王大伟', avatar: '', level: '金牌分销员', sales: 134800, orders: 278, commission: 10784, status: 'active', joinDate: '2025-05-10', phone: '137****7777' },
  { id: 4, name: '赵晓燕', avatar: '', level: '铜牌分销员', sales: 45200, orders: 92, commission: 2712, status: 'inactive', joinDate: '2025-10-05', phone: '136****6666' },
  { id: 5, name: '刘强东', avatar: '', level: '金牌分销员', sales: 198500, orders: 412, commission: 15880, status: 'active', joinDate: '2025-04-01', phone: '135****5555' },
];

export async function fetchMarketingStats() {
  try {
    const data = await apiRequest('/api/marketing/stats');
    return { ...data, source: 'api' };
  } catch {
    return {
      activeCampaigns: 8,
      totalCoupons: 156892,
      marketingRevenue: 2685400,
      roi: 4.8,
      source: 'mock',
    };
  }
}

export async function fetchCoupons(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/marketing/coupons?${query}`);
    return { items: data.items || data, total: data.total || data.length, source: 'api' };
  } catch {
    return { items: mockCoupons, total: mockCoupons.length, source: 'mock' };
  }
}

export async function createCoupon(data) {
  try {
    return await apiRequest('/api/marketing/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return { success: true, data: { id: Date.now(), ...data, used: 0, status: 'active', createdAt: new Date().toISOString().slice(0, 10) }, source: 'mock' };
  }
}

export async function updateCoupon(id, data) {
  try {
    return await apiRequest(`/api/marketing/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return { success: true, source: 'mock' };
  }
}

export async function deleteCoupon(id) {
  try {
    return await apiRequest(`/api/marketing/coupons/${id}`, { method: 'DELETE' });
  } catch {
    return { success: true, source: 'mock' };
  }
}

export async function fetchCampaigns(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/marketing/campaigns?${query}`);
    return { items: data.items || data, total: data.total || data.length, source: 'api' };
  } catch {
    return { items: mockCampaigns, total: mockCampaigns.length, source: 'mock' };
  }
}

export async function createCampaign(data) {
  try {
    return await apiRequest('/api/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return { success: true, data: { id: Date.now(), ...data, products: 0, sales: 0, revenue: 0, status: 'pending', participants: 0 }, source: 'mock' };
  }
}

export async function deleteCampaign(id) {
  try {
    return await apiRequest(`/api/marketing/campaigns/${id}`, { method: 'DELETE' });
  } catch {
    return { success: true, source: 'mock' };
  }
}

export async function fetchDistributors(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const data = await apiRequest(`/api/marketing/distributors?${query}`);
    return { items: data.items || data, total: data.total || data.length, source: 'api' };
  } catch {
    return { items: mockDistributors, total: mockDistributors.length, source: 'mock' };
  }
}

export async function fetchCommissionSettings() {
  try {
    const data = await apiRequest('/api/marketing/commission/settings');
    return { ...data, source: 'api' };
  } catch {
    return {
      goldRate: 8, silverRate: 6, bronzeRate: 4,
      settlementCycle: 'monthly', freezeDays: 7, minWithdraw: 100,
      allowSelfPurchase: false, allowSecondLevel: true,
      source: 'mock',
    };
  }
}

export async function saveCommissionSettings(data) {
  try {
    return await apiRequest('/api/marketing/commission/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return { success: true, source: 'mock' };
  }
}

// ==================== 客户 ====================

const CUSTOMER_API_BASE = import.meta.env.VITE_CUSTOMER_API_BASE || 'http://localhost:8006';

async function customerApiRequest(endpoint, options = {}) {
  const url = `${CUSTOMER_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`Customer API Error: ${res.status}`);
  return await res.json();
}

export async function fetchCustomerStats() {
  try {
    const json = await customerApiRequest('/api/customers/stats');
    return { ...json.data, source: 'api' };
  } catch {
    return { total: 0, newCustomers: 0, activeCustomers: 0, vipCustomers: 0, source: 'mock' };
  }
}

export async function fetchCustomers(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const json = await customerApiRequest(`/api/customers?${query}`);
    return { items: json.data, total: json.meta?.total || json.data.length, meta: json.meta, source: 'api' };
  } catch {
    return { items: [], total: 0, source: 'mock' };
  }
}

export async function fetchCustomerDetail(dbId) {
  try {
    const json = await customerApiRequest(`/api/customers/${dbId}`);
    return { ...json.data, source: 'api' };
  } catch {
    return null;
  }
}

export async function createCustomer(data) {
  try {
    const json = await customerApiRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json;
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function updateCustomer(dbId, data) {
  try {
    const json = await customerApiRequest(`/api/customers/${dbId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return json;
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function deleteCustomer(dbId) {
  try {
    const json = await customerApiRequest(`/api/customers/${dbId}`, {
      method: 'DELETE',
    });
    return json;
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function fetchCompetitors() {
  if (!apiAvailable) {
    return { items: generateCompetitors(20), source: 'mock' };
  }
  try {
    const data = await apiRequest('/api/competitors/list');
    return { ...data, source: 'api' };
  } catch {
    return { items: generateCompetitors(20), source: 'mock' };
  }
}

// ==================== 系统设置 ====================
// 注意: 使用相对路径 /api/settings，通过 Vite 代理转发到 API 网关 (port 8000)
// 不走 apiRequest() 因为 API_BASE 指向 douyin-adapter (port 8001)

export async function fetchSettings() {
  try {
    const res = await fetch('/api/settings', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Settings API error: ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      // 同步备份到 localStorage
      localStorage.setItem('ecom_settings', JSON.stringify(json.data));
      return { data: json.data, source: 'api' };
    }
    throw new Error('Invalid settings response');
  } catch {
    // 后端不可用时从 localStorage 读取
    const saved = localStorage.getItem('ecom_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { data: parsed, source: 'local' };
      } catch {}
    }
    return null; // 返回 null 表示使用默认值
  }
}

export async function saveSettings(settings) {
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Settings API error: ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      // 同步保存到 localStorage 作为备份
      localStorage.setItem('ecom_settings', JSON.stringify(json.data));
      return { data: json.data, source: 'api' };
    }
    throw new Error('Invalid settings response');
  } catch {
    // 后端不可用时保存到 localStorage
    localStorage.setItem('ecom_settings', JSON.stringify(settings));
    return { data: settings, source: 'local' };
  }
}

// ==================== 初始化 ====================

export async function initApi() {
  // 尝试恢复token
  const saved = localStorage.getItem('douyin_token');
  if (saved) {
    try {
      const tokenData = JSON.parse(saved);
      authToken = tokenData.access_token;
    } catch {}
  }
  
  // 检测后端
  await checkApiHealth();
  
  return {
    apiAvailable,
    hasToken: !!authToken,
    source: apiAvailable ? 'api' : 'mock',
  };
}

export { apiAvailable, PLATFORMS, ORDER_STATUS };
