/**
 * 竞品分析
 * 竞品对比 + 价格监控 + 预警
 */
import React, { useState, useMemo } from 'react';
import { generateCompetitors, PLATFORMS } from '../../utils/mock';

export default function Competitors() {
  const [competitors] = useState(() => generateCompetitors(20));
  const [platform, setPlatform] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('priceDiff');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useMemo(() => {
    let list = competitors;
    if (platform !== 'all') list = list.filter(c => c.platform === platform);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(kw) || c.competitor.toLowerCase().includes(kw));
    }
    return [...list].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mul;
    });
  }, [competitors, platform, keyword, sortBy, sortDir]);

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };

  // 统计
  const avgDiff = competitors.length
    ? (competitors.reduce((s, c) => s + c.priceDiff, 0) / competitors.length).toFixed(1)
    : 0;
  const cheaperCount = competitors.filter(c => c.priceDiff < 0).length;
  const expensiveCount = competitors.filter(c => c.priceDiff > 0).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">竞品分析</h2>
        <p className="page-desc">实时监控竞品价格、销量，优化定价策略</p>
      </div>

      {/* 统计概览 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-title">监控商品</div>
          <div className="stat-card-value" style={{ fontSize: 24 }}>{competitors.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">平均价差</div>
          <div className="stat-card-value" style={{
            fontSize: 24,
            color: avgDiff > 0 ? 'var(--danger)' : 'var(--success)'
          }}>
            {avgDiff > 0 ? '+' : ''}{avgDiff}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">我方价格更低</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--success)' }}>{cheaperCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">我方价格更高</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--danger)' }}>{expensiveCount}</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="搜索商品名、竞品店铺..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <select className="filter-select" value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary">➕ 添加监控</button>
        </div>
      </div>

      {/* 竞品表格 */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>竞品店铺</th>
                <th>平台</th>
                <th>竞品价格</th>
                <th>我方价格</th>
                <th>价差</th>
                <th>竞品销量</th>
                <th>我方销量</th>
                <th>竞品评分</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const plat = getPlatformInfo(item.platform);
                const isCheaper = item.priceDiff < 0;
                return (
                  <tr key={item.id}>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{item.competitor}</td>
                    <td>{plat.icon} {plat.name}</td>
                    <td style={{ fontWeight: 600 }}>¥{item.theirPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>¥{item.ourPrice.toFixed(2)}</td>
                    <td>
                      <span style={{
                        color: isCheaper ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        {isCheaper ? '↓' : '↑'} {Math.abs(item.priceDiff)}%
                      </span>
                    </td>
                    <td>{item.theirSales.toLocaleString()}</td>
                    <td>{item.ourSales.toLocaleString()}</td>
                    <td><span style={{ color: '#FF7D00' }}>★</span> {item.theirRating}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.updatedAt?.slice(0, 16)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-text btn-sm">调价</button>
                        <button className="btn btn-text btn-sm">详情</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 价格建议卡片 */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💡 智能定价建议</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.slice(0, 4).map(item => (
              <div key={item.id} style={{
                padding: 16,
                background: 'var(--bg-2)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 500, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-3)' }}>当前价</span>
                  <span style={{ fontWeight: 600 }}>¥{item.ourPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-3)' }}>建议价</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    ¥{(item.theirPrice * 0.95).toFixed(2)}
                  </span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>应用建议价格</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
