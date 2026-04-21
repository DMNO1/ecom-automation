/**
 * 工作台 Dashboard - CRMEB风格
 * 四大数据卡 + 订单趋势 + 用户趋势 + 待办事项
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateDashboardStats } from '../../utils/mock';
import { Chart } from '@antv/g2';

function AreaChart({ data, xField, yField, color = '#1890FF', height = 260 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();
    const chart = new Chart({ container: ref.current, autoFit: true, height });
    chart.area().data(data).encode('x', xField).encode('y', yField).encode('shape', 'smooth')
      .style('fill', `l(90) 0:${color}30 1:${color}03`).style('fillOpacity', 1);
    chart.line().data(data).encode('x', xField).encode('y', yField).encode('shape', 'smooth')
      .style('stroke', color).style('lineWidth', 2);
    chart.interaction('tooltip', { crosshairs: true });
    chart.render();
    chartRef.current = chart;
    return () => { chart.destroy(); chartRef.current = null; };
  }, [data, xField, yField, color, height]);
  return <div ref={ref} />;
}

const fmt = (n) => Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setStats(generateDashboardStats()); setLoading(false); }, 400);
  }, []);

  useEffect(() => { refresh(); }, []);

  if (!stats) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-3)' }}>加载中...</div>;

  const cards = [
    {
      title: '销售额', icon: '💰', iconBg: '#E6F7FF', iconColor: '#1890FF',
      value: `¥${fmt(stats.todayRevenue)}`,
      today: `今日 ${fmt(stats.todayRevenue)}`,
      yesterday: `昨日 ${fmt(stats.todayRevenue * (100 - stats.ordersTrend) / 100)}`,
      trend: stats.revenueTrend,
      monthly: `本月销售额 ¥${fmt(stats.todayRevenue * 28)}元`,
    },
    {
      title: '用户访问量', icon: '👥', iconBg: '#FFF7E6', iconColor: '#FA8C16',
      value: stats.todayCustomers,
      today: `今日 ${stats.todayCustomers}`,
      yesterday: `昨日 ${Math.round(stats.todayCustomers * (100 - stats.customersTrend) / 100)}`,
      trend: stats.customersTrend,
      monthly: `本月访问量 ${Math.round(stats.todayCustomers * 28)}Pv`,
    },
    {
      title: '订单量', icon: '📦', iconBg: '#F6FFED', iconColor: '#52C41A',
      value: stats.todayOrders,
      today: `今日 ${stats.todayOrders}`,
      yesterday: `昨日 ${Math.round(stats.todayOrders * (100 - stats.ordersTrend) / 100)}`,
      trend: stats.ordersTrend,
      monthly: `本月订单量 ${stats.todayOrders * 28}单`,
    },
    {
      title: '新增用户', icon: '➕', iconBg: '#F9F0FF', iconColor: '#722ED1',
      value: Math.round(stats.todayCustomers * 0.3),
      today: `今日 ${Math.round(stats.todayCustomers * 0.3)}`,
      yesterday: `昨日 ${Math.round(stats.todayCustomers * 0.25)}`,
      trend: stats.customersTrend - 5,
      monthly: `本月新增用户 ${Math.round(stats.todayCustomers * 0.3 * 28)}人`,
    },
  ];

  const tasks = [
    { label: '待处理订单', value: stats.pendingTasks.pendingOrders, color: '#FA8C16' },
    { label: '待处理退款', value: stats.pendingTasks.pendingRefunds, color: '#F5222D' },
    { label: '库存预警', value: stats.pendingTasks.lowStockProducts, color: '#FA8C16' },
    { label: '未读消息', value: stats.pendingTasks.unreadMessages, color: '#1890FF' },
    { label: '竞品预警', value: stats.pendingTasks.competitorAlerts, color: '#722ED1' },
  ];

  return (
    <div className="fade-in">
      {/* 四大数据卡 */}
      <div className="stats-grid">
        {cards.map((card, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-top">
              <span className="stat-card-title">{card.title}</span>
              <div className="stat-card-icon" style={{ background: card.iconBg }}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-footer">
              <span>{card.today}</span>
              <span>{card.yesterday}</span>
              <span>日环比
                <b className={card.trend >= 0 ? 'trend-up' : 'trend-down'} style={{ marginLeft: 4 }}>
                  {card.trend >= 0 ? '+' : ''}{card.trend}%
                </b>
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>{card.monthly}</div>
          </div>
        ))}
      </div>

      {/* 图表区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">订单</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {['30天', '周', '月', '年'].map((t, i) => (
                <span key={t} style={{ fontSize: 13, color: i === 0 ? 'var(--primary)' : 'var(--text-3)', cursor: 'pointer' }}>{t}</span>
              ))}
            </div>
          </div>
          <div className="card-body">
            <AreaChart data={stats.weeklyTrend} xField="date" yField="orders" color="#1890FF" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">用户</span>
          </div>
          <div className="card-body">
            <AreaChart data={stats.weeklyTrend} xField="date" yField="customers" color="#52C41A" />
          </div>
        </div>
      </div>

      {/* 底部：待办 + 热销 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">待办事项</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text-2)' }}>{t.label}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: t.color }}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">热销商品 TOP 5</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 2, marginRight: 10, flexShrink: 0,
                  background: i < 3 ? ['#F5222D', '#1890FF', '#52C41A'][i] : '#F0F0F0',
                  color: i < 3 ? '#fff' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                }}>{p.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>销量 {p.sales}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>¥{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">购买用户统计</span></div>
          <div className="card-body">
            <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '20px 0' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-1)' }}>{Math.round(stats.todayCustomers * 0.6)}</div>
              <div style={{ marginTop: 8 }}>今日购买用户</div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around', fontSize: 13 }}>
                <div><div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{Math.round(stats.todayCustomers * 0.1)}</div><div style={{ color: 'var(--text-3)' }}>老用户</div></div>
                <div><div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{Math.round(stats.todayCustomers * 0.5)}</div><div style={{ color: 'var(--text-3)' }}>新用户</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
