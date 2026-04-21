/**
 * 竞品分析 v2 - 全功能版
 * 详情弹窗 + 调价操作 + 添加监控 + 导出
 */
import React, { useState, useMemo } from 'react';
import { generateCompetitors, PLATFORMS } from '../../utils/mock';

export default function Competitors() {
  const [competitors, setCompetitors] = useState(() => generateCompetitors(20));
  const [platform, setPlatform] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('priceDiff');
  const [sortDir, setSortDir] = useState('desc');
  const [detailItem, setDetailItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustPrice, setAdjustPrice] = useState('');
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  const [toast, setToast] = useState('');
  const [newMonitor, setNewMonitor] = useState({ name: '', platform: 'douyin', theirPrice: '', ourPrice: '', competitor: '' });
  const [history, setHistory] = useState([]);

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const handleApplySuggestion = (item) => {
    const suggestedPrice = item.theirPrice * 0.95;
    setCompetitors(prev => prev.map(c => c.id === item.id ? { ...c, ourPrice: suggestedPrice, priceDiff: ((suggestedPrice - item.theirPrice) / item.theirPrice * 100).toFixed(1) } : c));
    showToast(`已将「${item.name}」价格调整为 ¥${suggestedPrice.toFixed(2)}`);
    setHistory(prev => [{ time: new Date().toLocaleString(), name: item.name, action: '应用建议价', from: `¥${item.ourPrice.toFixed(2)}`, to: `¥${suggestedPrice.toFixed(2)}` }, ...prev]);
  };

  const handleAdjustPrice = () => {
    if (!adjustItem || !adjustPrice) return;
    const newPrice = parseFloat(adjustPrice);
    if (isNaN(newPrice) || newPrice <= 0) { showToast('请输入有效价格'); return; }
    setCompetitors(prev => prev.map(c => c.id === adjustItem.id ? { ...c, ourPrice: newPrice, priceDiff: ((newPrice - c.theirPrice) / c.theirPrice * 100).toFixed(1) } : c));
    showToast(`已将「${adjustItem.name}」价格调整为 ¥${newPrice.toFixed(2)}`);
    setHistory(prev => [{ time: new Date().toLocaleString(), name: adjustItem.name, action: '手动调价', from: `¥${adjustItem.ourPrice.toFixed(2)}`, to: `¥${newPrice.toFixed(2)}` }, ...prev]);
    setAdjustItem(null);
    setAdjustPrice('');
  };

  const handleAddMonitor = () => {
    if (!newMonitor.name || !newMonitor.theirPrice || !newMonitor.ourPrice) { showToast('请填写必要信息'); return; }
    const item = {
      id: `comp_${Date.now()}`,
      name: newMonitor.name, platform: newMonitor.platform,
      competitor: newMonitor.competitor || '未知店铺',
      theirPrice: parseFloat(newMonitor.theirPrice), ourPrice: parseFloat(newMonitor.ourPrice),
      priceDiff: (((parseFloat(newMonitor.ourPrice) - parseFloat(newMonitor.theirPrice)) / parseFloat(newMonitor.theirPrice)) * 100).toFixed(1),
      theirSales: Math.floor(Math.random() * 5000), ourSales: Math.floor(Math.random() * 3000),
      theirRating: (4 + Math.random()).toFixed(1), updatedAt: new Date().toISOString(),
    };
    setCompetitors(prev => [item, ...prev]);
    setShowAddMonitor(false);
    setNewMonitor({ name: '', platform: 'douyin', theirPrice: '', ourPrice: '', competitor: '' });
    showToast('竞品监控添加成功！');
  };

  const handleExport = () => {
    const headers = ['商品名称', '竞品店铺', '平台', '竞品价格', '我方价格', '价差%', '竞品销量', '我方销量'];
    const rows = filtered.map(c => [c.name, c.competitor, PLATFORMS.find(p => p.key === c.platform)?.name, c.theirPrice, c.ourPrice, c.priceDiff + '%', c.theirSales, c.ourSales]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '竞品分析.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('竞品数据已导出');
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };

  const avgDiff = competitors.length ? (competitors.reduce((s, c) => s + parseFloat(c.priceDiff), 0) / competitors.length).toFixed(1) : 0;
  const cheaperCount = competitors.filter(c => parseFloat(c.priceDiff) < 0).length;
  const expensiveCount = competitors.filter(c => parseFloat(c.priceDiff) > 0).length;

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === field ? 1 : 0.3 }}>
      {sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, outline: 'none', marginBottom: 12 };

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
          <div className="stat-card-value" style={{ fontSize: 24, color: parseFloat(avgDiff) > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {parseFloat(avgDiff) > 0 ? '+' : ''}{avgDiff}%
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
        <input className="filter-input" placeholder="搜索商品名、竞品店铺..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <select className="filter-select" value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={handleExport}>📤 导出数据</button>
          <button className="btn btn-primary" onClick={() => setShowAddMonitor(true)}>➕ 添加监控</button>
        </div>
      </div>

      {/* 竞品表格 */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>商品名称</th><th>竞品店铺</th><th>平台</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('theirPrice')}>竞品价格 <SortIcon field="theirPrice" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ourPrice')}>我方价格 <SortIcon field="ourPrice" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('priceDiff')}>价差 <SortIcon field="priceDiff" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('theirSales')}>竞品销量 <SortIcon field="theirSales" /></th>
                <th>我方销量</th><th>竞品评分</th><th>更新时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const plat = getPlatformInfo(item.platform);
                const isCheaper = parseFloat(item.priceDiff) < 0;
                return (
                  <tr key={item.id}>
                    <td style={{ maxWidth: 180, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</td>
                    <td style={{ color: 'var(--text-2)' }}>{item.competitor}</td>
                    <td>{plat.icon} {plat.name}</td>
                    <td style={{ fontWeight: 600 }}>¥{item.theirPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>¥{item.ourPrice.toFixed(2)}</td>
                    <td>
                      <span style={{ color: isCheaper ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {isCheaper ? '↓' : '↑'} {Math.abs(parseFloat(item.priceDiff))}%
                      </span>
                    </td>
                    <td>{item.theirSales.toLocaleString()}</td>
                    <td>{item.ourSales.toLocaleString()}</td>
                    <td><span style={{ color: '#FF7D00' }}>★</span> {item.theirRating}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.updatedAt?.slice(0, 16)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-text btn-sm" onClick={() => { setAdjustItem(item); setAdjustPrice(item.ourPrice.toString()); }}>调价</button>
                        <button className="btn btn-text btn-sm" onClick={() => setDetailItem(item)}>详情</button>
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

      {/* 智能定价建议 */}
      <div className="card">
        <div className="card-header"><span className="card-title">智能定价建议</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.slice(0, 4).map(item => (
              <div key={item.id} style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 500, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-3)' }}>当前价</span>
                  <span style={{ fontWeight: 600 }}>¥{item.ourPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-3)' }}>建议价</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{(item.theirPrice * 0.95).toFixed(2)}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleApplySuggestion(item)}>应用建议价格</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 调价历史 */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">📋 调价记录</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {history.slice(0, 10).map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < Math.min(history.length, 10) - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>{h.time}</span>
                <span style={{ fontWeight: 500 }}>{h.name}</span>
                <span>{h.action}: {h.from} → <b style={{ color: 'var(--primary)' }}>{h.to}</b></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 80, right: 24, background: 'var(--success)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>✅ {toast}</div>}

      {/* 详情弹窗 */}
      {detailItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetailItem(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>竞品详情</h3>
              <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>{detailItem.name}</div>
            {[
              ['竞品店铺', detailItem.competitor],
              ['平台', getPlatformInfo(detailItem.platform).icon + ' ' + getPlatformInfo(detailItem.platform).name],
              ['竞品价格', `¥${detailItem.theirPrice.toFixed(2)}`],
              ['我方价格', `¥${detailItem.ourPrice.toFixed(2)}`],
              ['价差', `${parseFloat(detailItem.priceDiff) > 0 ? '+' : ''}${detailItem.priceDiff}%`],
              ['竞品销量', detailItem.theirSales.toLocaleString()],
              ['我方销量', detailItem.ourSales.toLocaleString()],
              ['竞品评分', `★ ${detailItem.theirRating}`],
              ['建议价格', `¥${(detailItem.theirPrice * 0.95).toFixed(2)}`],
              ['更新时间', detailItem.updatedAt?.slice(0, 19)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 100, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--text-1)' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { handleApplySuggestion(detailItem); setDetailItem(null); }}>应用建议价</button>
              <button className="btn btn-default" onClick={() => { setAdjustItem(detailItem); setAdjustPrice(detailItem.ourPrice.toString()); setDetailItem(null); }}>手动调价</button>
            </div>
          </div>
        </div>
      )}

      {/* 调价弹窗 */}
      {adjustItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAdjustItem(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>调整价格</h3>
              <button onClick={() => setAdjustItem(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{adjustItem.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>竞品价: ¥{adjustItem.theirPrice.toFixed(2)} | 建议价: ¥{(adjustItem.theirPrice * 0.95).toFixed(2)}</div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>新价格</label>
            <input style={inputStyle} type="number" value={adjustPrice} onChange={e => setAdjustPrice(e.target.value)} placeholder="输入新价格" />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-default" onClick={() => setAdjustItem(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleAdjustPrice}>确认调价</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加监控弹窗 */}
      {showAddMonitor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddMonitor(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>添加竞品监控</h3>
              <button onClick={() => setShowAddMonitor(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>商品名称 *</label>
            <input style={inputStyle} placeholder="输入要监控的商品名称" value={newMonitor.name} onChange={e => setNewMonitor(p => ({ ...p, name: e.target.value }))} />
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>竞品店铺</label>
            <input style={inputStyle} placeholder="竞品店铺名称" value={newMonitor.competitor} onChange={e => setNewMonitor(p => ({ ...p, competitor: e.target.value }))} />
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>平台 *</label>
            <select style={inputStyle} value={newMonitor.platform} onChange={e => setNewMonitor(p => ({ ...p, platform: e.target.value }))}>
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>竞品价格 *</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={newMonitor.theirPrice} onChange={e => setNewMonitor(p => ({ ...p, theirPrice: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>我方价格 *</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={newMonitor.ourPrice} onChange={e => setNewMonitor(p => ({ ...p, ourPrice: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-default" onClick={() => setShowAddMonitor(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddMonitor}>确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
