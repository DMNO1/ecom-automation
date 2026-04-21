/**
 * 数据概览 Dashboard
 * 核心业务指标 + 趋势图表 + 待办事项
 */
import React, { useState, useEffect, useRef } from 'react';
import { generateDashboardStats, PLATFORMS } from '../../utils/mock';
import { Chart } from '@antv/g2';

// 趋势图组件
function TrendChart({ data, xField, yField, color = '#165DFF', height = 200 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height,
    });

    chart
      .line()
      .data(data)
      .encode('x', xField)
      .encode('y', yField)
      .encode('shape', 'smooth')
      .style('stroke', color)
      .style('lineWidth', 2.5)
      .style('opacity', 0.9);

    chart
      .area()
      .data(data)
      .encode('x', xField)
      .encode('y', yField)
      .encode('shape', 'smooth')
      .style('fill', `l(90) 0:${color}33 1:${color}05`);

    chart.interaction('tooltip', { crosshairs: true });
    chart.render();
    chartRef.current = chart;

    return () => { chart.destroy(); chartRef.current = null; };
  }, [data, xField, yField, color, height]);

  return <div ref={containerRef} />;
}

// 平台分布饼图
function PlatformPie({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 260,
    });

    chart.coordinate({ type: 'theta', innerRadius: 0.6 });

    chart
      .interval()
      .data(data)
      .transform({ type: 'stackY' })
      .encode('y', 'value')
      .encode('color', 'platform')
      .scale('color', { range: data.map(d => d.color) })
      .style('stroke', '#fff')
      .style('lineWidth', 2)
      .animate('enter', { type: 'waveIn' });

    chart
      .text()
      .style('text', '平台分布')
      .style('x', '50%')
      .style('y', '50%')
      .style('fontSize', 14)
      .style('fill', '#86909C')
      .style('textAlign', 'center');

    chart.interaction('elementHighlight', true);
    chart.interaction('tooltip', true);
    chart.render();
    chartRef.current = chart;

    return () => { chart.destroy(); chartRef.current = null; };
  }, [data]);

  return <div ref={containerRef} />;
}

// 品类柱状图
function CategoryBar({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;
    if (chartRef.current) chartRef.current.destroy();

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 260,
    });

    chart
      .interval()
      .data(data)
      .encode('x', 'category')
      .encode('y', 'sales')
      .encode('color', '#165DFF')
      .style('fill', '#165DFF')
      .style('radiusTopLeft', 4)
      .style('radiusTopRight', 4)
      .axis('x', { labelAutoRotate: false })
      .animate('enter', { type: 'growInY' });

    chart.interaction('elementHighlight', true);
    chart.interaction('tooltip', true);
    chart.render();
    chartRef.current = chart;

    return () => { chart.destroy(); chartRef.current = null; };
  }, [data]);

  return <div ref={containerRef} />;
}

// 格式化金额
const fmtMoney = (n) => `¥${Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(generateDashboardStats());
  }, []);

  if (!stats) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-3)' }}>加载中...</div>;

  const statCards = [
    {
      title: '今日订单',
      value: stats.todayOrders,
      trend: stats.ordersTrend,
      suffix: '单',
      icon: '📦',
      iconBg: '#E8F0FF',
    },
    {
      title: '今日营收',
      value: fmtMoney(stats.todayRevenue),
      trend: stats.revenueTrend,
      suffix: '',
      icon: '💰',
      iconBg: '#E8FFEA',
    },
    {
      title: '今日客户',
      value: stats.todayCustomers,
      trend: stats.customersTrend,
      suffix: '人',
      icon: '👥',
      iconBg: '#FFF3E8',
    },
    {
      title: '转化率',
      value: `${stats.conversionRate}%`,
      trend: stats.conversionTrend,
      suffix: '',
      icon: '📈',
      iconBg: '#F2E8FF',
    },
  ];

  const tasks = [
    { label: '待处理订单', value: stats.pendingTasks.pendingOrders, color: '#FF7D00', icon: '📋' },
    { label: '待处理退款', value: stats.pendingTasks.pendingRefunds, color: '#F53F3F', icon: '💸' },
    { label: '库存预警', value: stats.pendingTasks.lowStockProducts, color: '#FF7D00', icon: '⚠️' },
    { label: '未读消息', value: stats.pendingTasks.unreadMessages, color: '#165DFF', icon: '💬' },
    { label: '竞品预警', value: stats.pendingTasks.competitorAlerts, color: '#7B61FF', icon: '🔔' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">数据概览</h2>
        <p className="page-desc">实时监控多平台电商运营数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-header">
              <span className="stat-card-title">{card.title}</span>
              <div className="stat-card-icon" style={{ background: card.iconBg }}>{card.icon}</div>
            </div>
            <div className="stat-card-value">{card.value}{card.suffix}</div>
            <div className={`stat-card-trend ${card.trend >= 0 ? 'up' : 'down'}`}>
              {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
              <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>较昨日</span>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图 + 待办事项 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">近7天营收趋势</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>● 订单</span>
              <span style={{ fontSize: 12, color: '#00B42A' }}>● 营收</span>
            </div>
          </div>
          <div className="card-body">
            <TrendChart data={stats.weeklyTrend} xField="date" yField="revenue" color="#165DFF" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">待办事项</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {tasks.map((task, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{task.icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{task.label}</span>
                </div>
                <span style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: task.color,
                }}>{task.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 平台分布 + 品类销售 + 热销商品 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">平台营收分布</span>
          </div>
          <div className="card-body">
            <PlatformPie data={stats.platformDistribution} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">品类销售排名</span>
          </div>
          <div className="card-body">
            <CategoryBar data={stats.categorySales} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">热销商品 TOP 5</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats.topProducts.map((p, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: i < 3 ? ['#FF7D00', '#165DFF', '#00B42A'][i] : 'var(--bg-3)',
                  color: i < 3 ? '#fff' : 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  marginRight: 12,
                  flexShrink: 0,
                }}>{p.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>销量 {p.sales}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                  {fmtMoney(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
