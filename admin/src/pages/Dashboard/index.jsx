/**
 * 工作台 Dashboard v3 - 商业级
 * 实时业务监控 + 待办工作流 + 异常预警 + 利润分析 + 平台对比
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateOrders, generateProducts, PLATFORMS } from '../../utils/mock';

function MiniChart({ data, color = '#1890FF', height = 60 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = document.createElement('canvas');
    canvas.width = ref.current.clientWidth;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = height + 'px';
    ref.current.innerHTML = '';
    ref.current.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = canvas.width / (data.length - 1);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = canvas.height - ((v - min) / range) * (canvas.height - 10) - 5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // 填充
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, color + '30');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data, color, height]);
  return <div ref={ref} />;
}

export default function Dashboard() {
  const [orders] = useState(() => generateOrders(200));
  const [products] = useState(() => generateProducts(50));
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // 按平台分组统计
  const platformStats = useMemo(() => {
    const stats = {};
    PLATFORMS.forEach(p => {
      const pOrders = orders.filter(o => o.platform === p.key);
      const pProducts = products.filter(pr => pr.platform === p.key);
      stats[p.key] = {
        ...p,
        orderCount: pOrders.length,
        revenue: pOrders.reduce((s, o) => s + o.amount, 0),
        profit: pOrders.reduce((s, o) => s + o.profit, 0),
        productCount: pProducts.length,
        avgMargin: pProducts.length ? (pProducts.reduce((s, pr) => s + (pr.price - pr.cost) / pr.price, 0) / pProducts.length * 100).toFixed(1) : 0,
      };
    });
    return stats;
  }, [orders, products]);

  // 核心KPI
  const kpis = useMemo(() => {
    const filtered = selectedPlatform === 'all' ? orders : orders.filter(o => o.platform === selectedPlatform);
    const totalRevenue = filtered.reduce((s, o) => s + o.amount, 0);
    const totalProfit = filtered.reduce((s, o) => s + o.profit, 0);
    const pendingShip = filtered.filter(o => o.status === 'paid').length;
    const pendingRefund = filtered.filter(o => o.status === 'refunding').length;
    const completedToday = filtered.filter(o => o.status === 'completed' && o.createdAt?.startsWith(new Date().toISOString().slice(0, 10))).length;
    return {
      revenue: totalRevenue,
      profit: totalProfit,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0,
      orderCount: filtered.length,
      avgOrder: filtered.length ? (totalRevenue / filtered.length).toFixed(2) : 0,
      pendingShip,
      pendingRefund,
      completedToday,
    };
  }, [orders, selectedPlatform]);

  // 利润趋势（模拟7天）
  const profitTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayOrders = orders.filter((_, j) => j % 7 === i);
      return dayOrders.reduce((s, o) => s + o.profit, 0);
    });
  }, [orders]);

  // 库存预警商品
  const stockAlerts = useMemo(() => {
    return products
      .filter(p => p.stock < 20)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8);
  }, [products]);

  // 待办工作流
  const todoItems = [
    { id: 1, type: 'ship', label: '待发货订单', count: kpis.pendingShip, color: '#165DFF', icon: '📦', action: '去发货', link: '/orders' },
    { id: 2, type: 'refund', label: '待处理退款', count: kpis.pendingRefund, color: '#F53F3F', icon: '💰', action: '去处理', link: '/orders' },
    { id: 3, type: 'stock', label: '库存预警', count: stockAlerts.length, color: '#FF7D00', icon: '⚠️', action: '去补货', link: '/products' },
    { id: 4, type: 'cs', label: '未回复消息', count: 12, color: '#722ED1', icon: '💬', action: '去回复', link: '/customer-service' },
  ];

  // 利润率分布
  const marginBuckets = useMemo(() => {
    const buckets = { '<20%': 0, '20-40%': 0, '40-60%': 0, '>60%': 0 };
    products.forEach(p => {
      const m = (p.price - p.cost) / p.price * 100;
      if (m < 20) buckets['<20%']++;
      else if (m < 40) buckets['20-40%']++;
      else if (m < 60) buckets['40-60%']++;
      else buckets['>60%']++;
    });
    return buckets;
  }, [products]);

  return (
    <div className="fade-in">
      {/* 顶部：平台切换 + 日期筛选 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn btn-sm ${selectedPlatform === 'all' ? 'btn-primary' : 'btn-default'}`}
            onClick={() => setSelectedPlatform('all')}
          >全部平台</button>
          {PLATFORMS.map(p => (
            <button
              key={p.key}
              className={`btn btn-sm ${selectedPlatform === p.key ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setSelectedPlatform(p.key)}
              style={selectedPlatform !== p.key ? { borderColor: p.color, color: p.color } : {}}
            >{p.icon} {p.name}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['今日', '7天', '30天', '本月'].map(d => (
            <button
              key={d}
              className={`btn btn-sm ${dateRange === d ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setDateRange(d)}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* 核心KPI卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">总营收</span>
            <div className="stat-card-icon" style={{ background: '#E6F7FF' }}>💰</div>
          </div>
          <div className="stat-card-value">¥{kpis.revenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
          <MiniChart data={profitTrend} color="#1890FF" />
          <div className="stat-card-footer">
            <span>利润率 <b style={{ color: parseFloat(kpis.margin) > 30 ? 'var(--success)' : 'var(--danger)' }}>{kpis.margin}%</b></span>
            <span>客单价 ¥{kpis.avgOrder}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">净利润</span>
            <div className="stat-card-icon" style={{ background: '#F6FFED' }}>📈</div>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>¥{kpis.profit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</div>
          <MiniChart data={profitTrend} color="#52C41A" />
          <div className="stat-card-footer">
            <span>订单量 <b>{kpis.orderCount}</b></span>
            <span>已完成 <b>{kpis.completedToday}</b></span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">待处理</span>
            <div className="stat-card-icon" style={{ background: '#FFF7E6' }}>⚡</div>
          </div>
          <div className="stat-card-value" style={{ color: kpis.pendingShip > 0 ? '#FF7D00' : 'var(--success)' }}>
            {kpis.pendingShip + kpis.pendingRefund}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-3)' }}>待发货</span>
              <span style={{ color: '#165DFF', fontWeight: 600 }}>{kpis.pendingShip}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>待退款</span>
              <span style={{ color: '#F53F3F', fontWeight: 600 }}>{kpis.pendingRefund}</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">在售商品</span>
            <div className="stat-card-icon" style={{ background: '#F9F0FF' }}>🏷️</div>
          </div>
          <div className="stat-card-value">{products.filter(p => p.status === 'active').length}</div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(marginBuckets).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 50, fontSize: 12, color: 'var(--text-3)' }}>{k}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-bar-fill" style={{ width: `${(v / products.length) * 100}%`, background: k === '>60%' ? '#52C41A' : k === '40-60%' ? '#1890FF' : '#FF7D00' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)', width: 20 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中间：待办工作流 + 平台对比 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* 待办工作流 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 待办工作台</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>需要立即处理的事项</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todoItems.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px',
                borderBottom: i < todoItems.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: item.count > 0 ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {item.count > 0 ? `有 ${item.count} 条需要处理` : '暂无待处理'}
                  </div>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: item.color, marginRight: 16 }}>{item.count}</span>
                {item.count > 0 && (
                  <a href={item.link} style={{
                    padding: '4px 12px', borderRadius: 4, fontSize: 12,
                    background: item.color + '10', color: item.color, textDecoration: 'none',
                    fontWeight: 500,
                  }}>{item.action}</a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 平台对比 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 平台经营对比</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>平台</th><th>订单</th><th>营收</th><th>利润</th><th>商品</th><th>利润率</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(platformStats).map(ps => (
                  <tr key={ps.key}>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{ps.icon} {ps.name}</span></td>
                    <td style={{ fontWeight: 600 }}>{ps.orderCount}</td>
                    <td>¥{ps.revenue.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>¥{ps.profit.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                    <td>{ps.productCount}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        background: parseFloat(ps.avgMargin) > 40 ? '#F6FFED' : '#FFF7E6',
                        color: parseFloat(ps.avgMargin) > 40 ? '#52C41A' : '#FA8C16',
                      }}>{ps.avgMargin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 底部：库存预警 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">⚠️ 库存预警 ({stockAlerts.length}件)</span>
          <a href="/products" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>查看全部 →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>商品</th><th>平台</th><th>库存</th><th>日均销量</th><th>预计可售天数</th><th>建议操作</th></tr>
            </thead>
            <tbody>
              {stockAlerts.map(p => {
                const dailySales = Math.ceil(p.sales / 30);
                const daysLeft = dailySales > 0 ? Math.floor(p.stock / dailySales) : 999;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>{PLATFORMS.find(x => x.key === p.platform)?.icon}</td>
                    <td style={{ color: p.stock < 5 ? 'var(--danger)' : '#FF7D00', fontWeight: 600 }}>{p.stock}</td>
                    <td>{dailySales}</td>
                    <td>
                      <span style={{ color: daysLeft < 3 ? 'var(--danger)' : daysLeft < 7 ? '#FF7D00' : 'var(--success)', fontWeight: 600 }}>
                        {daysLeft}天
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-text btn-sm" style={{ color: 'var(--primary)' }}>
                        {daysLeft < 3 ? '🚨 立即补货' : daysLeft < 7 ? '📦 建议补货' : '✅ 关注'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {stockAlerts.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--success)' }}>✅ 所有商品库存充足</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
