/**
 * 竞品分析 v3 - 商业级
 * 价格历史趋势 + 调价规则引擎 + 竞品对标分析 + 自动预警
 */
import React, { useState, useMemo } from 'react';
import { generateCompetitors, PLATFORMS } from '../../utils/mock';

const PRICE_RULES = [
  { id: 1, name: '低价跟随策略', desc: '竞品降价时，我方自动跟进降价5%', condition: '竞品价 < 我方价', action: '设为竞品价 × 0.95', enabled: true },
  { id: 2, name: '高价截流策略', desc: '竞品涨价时，我方保持原价截取流量', condition: '竞品价 > 我方价', action: '保持原价不变', enabled: false },
  { id: 3, name: '利润保护策略', desc: '当利润率低于15%时，不自动降价', condition: '利润率 < 15%', action: '暂停自动调价', enabled: true },
  { id: 4, name: '库存清仓策略', desc: '库存>200且30天无销量时，自动降价20%', condition: '库存>200 & 30天销量=0', action: '自动降价20%', enabled: false },
];

export default function Competitors() {
  const [competitors, setCompetitors] = useState(() => generateCompetitors(20));
  const [platform, setPlatform] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('priceDiff');
  const [sortDir, setSortDir] = useState('desc');
  const [detailItem, setDetailItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustPrice, setAdjustPrice] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState('');
  const [newMonitor, setNewMonitor] = useState({ name: '', platform: 'douyin', theirPrice: '', ourPrice: '', competitor: '' });
  const [priceHistory, setPriceHistory] = useState([]);
  const [rules, setRules] = useState(PRICE_RULES);
  const [analysisMode, setAnalysisMode] = useState('overview'); // overview | pricing | alerts

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

  const recordPriceChange = (item, oldPrice, newPrice, reason) => {
    setPriceHistory(prev => [{
      time: new Date().toLocaleString('zh-CN'),
      name: item.name,
      platform: PLATFORMS.find(p => p.key === item.platform)?.name,
      oldPrice: oldPrice.toFixed(2),
      newPrice: newPrice.toFixed(2),
      diff: ((newPrice - oldPrice) / oldPrice * 100).toFixed(1),
      reason: reason || '手动调价',
      operator: '马晓倩',
    }, ...prev].slice(0, 50));
  };

  const handleApplySuggestion = (item, customPrice) => {
    const newPrice = customPrice || item.theirPrice * 0.95;
    const oldPrice = item.ourPrice;
    setCompetitors(prev => prev.map(c => c.id === item.id ? { ...c, ourPrice: newPrice, priceDiff: ((newPrice - c.theirPrice) / c.theirPrice * 100).toFixed(1) } : c));
    recordPriceChange(item, oldPrice, newPrice, customPrice ? '手动调价' : '应用建议价');
    showToast(`${item.name} 价格已从 ¥${oldPrice.toFixed(2)} 调整为 ¥${newPrice.toFixed(2)}`);
  };

  const handleAdjustPrice = () => {
    if (!adjustItem || !adjustPrice) return;
    const newPrice = parseFloat(adjustPrice);
    if (isNaN(newPrice) || newPrice <= 0) { showToast('请输入有效价格'); return; }
    handleApplySuggestion(adjustItem, newPrice);
    setAdjustItem(null); setAdjustPrice(''); setAdjustReason('');
  };

  const handleBatchApplyRule = (rule) => {
    let count = 0;
    setCompetitors(prev => prev.map(c => {
      const margin = (c.ourPrice - c.theirPrice) / c.ourPrice;
      if (rule.id === 1 && c.theirPrice < c.ourPrice && margin > 0.15) {
        const newPrice = c.theirPrice * 0.95;
        recordPriceChange(c, c.ourPrice, newPrice, '低价跟随策略');
        count++;
        return { ...c, ourPrice: newPrice, priceDiff: ((newPrice - c.theirPrice) / c.theirPrice * 100).toFixed(1) };
      }
      return c;
    }));
    showToast(`「${rule.name}」已对 ${count} 个商品生效`);
  };

  const handleToggleRule = (ruleId) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleExport = () => {
    const headers = ['商品名称', '竞品店铺', '平台', '竞品价格', '我方价格', '价差%', '利润率%', '竞品销量', '我方销量', '竞品评分', '状态'];
    const rows = filtered.map(c => {
      const margin = ((c.ourPrice - c.ourPrice * 0.4) / c.ourPrice * 100).toFixed(1);
      const status = parseFloat(c.priceDiff) < 0 ? '有优势' : parseFloat(c.priceDiff) > 5 ? '需关注' : '正常';
      return [c.name, c.competitor, PLATFORMS.find(p => p.key === c.platform)?.name, c.theirPrice, c.ourPrice, c.priceDiff + '%', margin + '%', c.theirSales, c.ourSales, c.theirRating, status];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `竞品分析_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('竞品数据已导出');
  };

  const handleAddMonitor = () => {
    if (!newMonitor.name || !newMonitor.theirPrice || !newMonitor.ourPrice) { showToast('请填写必要信息'); return; }
    const item = {
      id: `comp_${Date.now()}`,
      name: newMonitor.name, platform: newMonitor.platform,
      competitor: newMonitor.competitor || '未知店铺',
      theirPrice: parseFloat(newMonitor.theirPrice), ourPrice: parseFloat(newMonitor.ourPrice),
      priceDiff: (((parseFloat(newMonitor.ourPrice) - parseFloat(newMonitor.theirPrice)) / parseFloat(newMonitor.theirPrice)) * 100).toFixed(1),
      theirSales: 0, ourSales: 0,
      theirRating: '-', updatedAt: new Date().toISOString(),
    };
    setCompetitors(prev => [item, ...prev]);
    setShowAddMonitor(false);
    setNewMonitor({ name: '', platform: 'douyin', theirPrice: '', ourPrice: '', competitor: '' });
    showToast('竞品监控添加成功');
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };
  const avgDiff = competitors.length ? (competitors.reduce((s, c) => s + parseFloat(c.priceDiff), 0) / competitors.length).toFixed(1) : 0;
  const cheaperCount = competitors.filter(c => parseFloat(c.priceDiff) < 0).length;
  const expensiveCount = competitors.filter(c => parseFloat(c.priceDiff) > 0).length;
  const criticalCount = competitors.filter(c => parseFloat(c.priceDiff) > 10).length;

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === field ? 1 : 0.3 }}>{sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
  );
  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, outline: 'none', marginBottom: 12 };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">竞品分析</h2>
          <p className="page-desc">价格监控、调价策略、竞品对标分析</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${analysisMode === 'overview' ? 'btn-primary' : 'btn-default'}`} onClick={() => setAnalysisMode('overview')}>📊 总览</button>
          <button className={`btn btn-sm ${analysisMode === 'pricing' ? 'btn-primary' : 'btn-default'}`} onClick={() => setAnalysisMode('pricing')}>💰 调价策略</button>
          <button className={`btn btn-sm ${analysisMode === 'alerts' ? 'btn-primary' : 'btn-default'}`} onClick={() => setAnalysisMode('alerts')}>🚨 预警</button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-card-title">监控商品</div><div className="stat-card-value" style={{ fontSize: 24 }}>{competitors.length}</div></div>
        <div className="stat-card">
          <div className="stat-card-title">平均价差</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: parseFloat(avgDiff) > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {parseFloat(avgDiff) > 0 ? '+' : ''}{avgDiff}%
          </div>
        </div>
        <div className="stat-card"><div className="stat-card-title">我方有优势</div><div className="stat-card-value" style={{ fontSize: 24, color: 'var(--success)' }}>{cheaperCount}</div></div>
        <div className="stat-card"><div className="stat-card-title">价格偏高(>10%)</div><div className="stat-card-value" style={{ fontSize: 24, color: 'var(--danger)' }}>{criticalCount}</div></div>
      </div>

      {/* 总览模式 */}
      {analysisMode === 'overview' && (
        <>
          <div className="filter-bar">
            <input className="filter-input" placeholder="搜索商品名、竞品店铺..." value={keyword} onChange={e => setKeyword(e.target.value)} />
            <select className="filter-select" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="all">全部平台</option>
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-default" onClick={handleExport}>📤 导出分析</button>
              <button className="btn btn-primary" onClick={() => setShowAddMonitor(true)}>➕ 添加监控</button>
            </div>
          </div>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>商品</th><th>竞品店铺</th><th>平台</th><th>竞品价</th><th>我方价</th><th>价差</th><th>竞品销量</th><th>竞品评分</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>
                  {filtered.map(item => {
                    const plat = getPlatformInfo(item.platform);
                    const diff = parseFloat(item.priceDiff);
                    const status = diff > 10 ? { label: '需调价', color: 'var(--danger)' } : diff > 0 ? { label: '偏高', color: '#FF7D00' } : diff > -5 ? { label: '正常', color: 'var(--success)' } : { label: '有优势', color: '#165DFF' };
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ color: 'var(--text-2)' }}>{item.competitor}</td>
                        <td>{plat.icon} {plat.name}</td>
                        <td style={{ fontWeight: 600 }}>¥{item.theirPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>¥{item.ourPrice.toFixed(2)}</td>
                        <td><span style={{ color: diff < 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{diff > 0 ? '+' : ''}{diff}%</span></td>
                        <td>{item.theirSales.toLocaleString()}</td>
                        <td><span style={{ color: '#FF7D00' }}>★</span> {item.theirRating}</td>
                        <td><span className="tag" style={{ background: status.color + '15', color: status.color }}>{status.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-text btn-sm" onClick={() => { setAdjustItem(item); setAdjustPrice(item.ourPrice.toString()); }}>调价</button>
                            <button className="btn btn-text btn-sm" onClick={() => setDetailItem(item)}>详情</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 调价策略模式 */}
      {analysisMode === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">⚙️ 调价规则引擎</span><span style={{ fontSize: 12, color: 'var(--text-3)' }}>自动调价策略配置</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {rules.map((rule, i) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{rule.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{rule.desc}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>条件: {rule.condition} → {rule.action}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleBatchApplyRule(rule)} disabled={!rule.enabled}>应用</button>
                    <div className={`switch ${rule.enabled ? 'on' : ''}`} onClick={() => handleToggleRule(rule.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">💰 定价建议</span></div>
            <div className="card-body" style={{ padding: 0 }}>
              {filtered.filter(c => parseFloat(c.priceDiff) > 5).slice(0, 6).map(item => {
                const suggested = item.theirPrice * 0.95;
                const profitMargin = ((suggested - item.ourPrice * 0.4) / suggested * 100).toFixed(1);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        竞品 ¥{item.theirPrice.toFixed(2)} | 当前 ¥{item.ourPrice.toFixed(2)} | 建议 ¥{suggested.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: 12 }}>
                      <div style={{ fontSize: 12, color: parseFloat(profitMargin) > 20 ? 'var(--success)' : 'var(--danger)' }}>利润率 {profitMargin}%</div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleApplySuggestion(item, suggested)}>应用</button>
                  </div>
                );
              })}
              {filtered.filter(c => parseFloat(c.priceDiff) > 5).length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--success)' }}>✅ 所有商品价格合理</div>
              )}
            </div>
          </div>
          {/* 调价历史 */}
          {priceHistory.length > 0 && (
            <div className="card" style={{ gridColumn: '1/3' }}>
              <div className="card-header"><span className="card-title">📋 调价记录</span><span style={{ fontSize: 12, color: 'var(--text-3)' }}>{priceHistory.length}条记录</span></div>
              <table className="data-table">
                <thead><tr><th>时间</th><th>商品</th><th>平台</th><th>原价</th><th>新价</th><th>变动</th><th>原因</th><th>操作人</th></tr></thead>
                <tbody>
                  {priceHistory.slice(0, 10).map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.time}</td>
                      <td style={{ fontWeight: 500 }}>{h.name}</td>
                      <td>{h.platform}</td>
                      <td>¥{h.oldPrice}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{h.newPrice}</td>
                      <td style={{ color: parseFloat(h.diff) > 0 ? 'var(--danger)' : 'var(--success)' }}>{parseFloat(h.diff) > 0 ? '+' : ''}{h.diff}%</td>
                      <td style={{ fontSize: 12 }}>{h.reason}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{h.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 预警模式 */}
      {analysisMode === 'alerts' && (
        <div className="card">
          <div className="card-header"><span className="card-title">🚨 价格异常预警</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {competitors.filter(c => parseFloat(c.priceDiff) > 10).map((item, i, arr) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: '#FFF1F0' }}>
                <span style={{ fontSize: 20, marginRight: 12 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>竞品「{item.competitor}」售价 ¥{item.theirPrice.toFixed(2)}，我方 ¥{item.ourPrice.toFixed(2)}，价差 {item.priceDiff}%</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => handleApplySuggestion(item)}>一键跟随</button>
                  <button className="btn btn-sm btn-default" onClick={() => { setAdjustItem(item); setAdjustPrice(item.ourPrice.toString()); }}>手动调价</button>
                </div>
              </div>
            ))}
            {competitors.filter(c => parseFloat(c.priceDiff) > 10).length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--success)', fontSize: 16 }}>✅ 无价格异常预警</div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 80, right: 24, background: 'var(--success)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>✅ {toast}</div>}

      {/* 调价弹窗 */}
      {adjustItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAdjustItem(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>调整价格</h3>
              <button onClick={() => setAdjustItem(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{adjustItem.name}</div>
              <div>竞品价: <b>¥{adjustItem.theirPrice.toFixed(2)}</b> | 建议价: <b style={{ color: 'var(--primary)' }}>¥{(adjustItem.theirPrice * 0.95).toFixed(2)}</b></div>
            </div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>新价格 *</label>
            <input style={inputStyle} type="number" value={adjustPrice} onChange={e => setAdjustPrice(e.target.value)} placeholder="输入新价格" />
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>调价原因</label>
            <select style={inputStyle} value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
              <option value="">选择原因</option>
              <option value="跟随竞品">跟随竞品降价</option>
              <option value="促销活动">促销活动</option>
              <option value="成本变动">成本变动</option>
              <option value="库存清仓">库存清仓</option>
              <option value="其他">其他</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-default" onClick={() => setAdjustItem(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleAdjustPrice}>确认调价</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetailItem(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>竞品详情</h3>
              <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>{detailItem.name}</div>
            {[
              ['竞品店铺', detailItem.competitor], ['平台', getPlatformInfo(detailItem.platform).icon + ' ' + getPlatformInfo(detailItem.platform).name],
              ['竞品价格', `¥${detailItem.theirPrice.toFixed(2)}`], ['我方价格', `¥${detailItem.ourPrice.toFixed(2)}`],
              ['价差', `${parseFloat(detailItem.priceDiff) > 0 ? '+' : ''}${detailItem.priceDiff}%`],
              ['竞品销量', detailItem.theirSales.toLocaleString()], ['我方销量', detailItem.ourSales?.toLocaleString() || '-'],
              ['竞品评分', `★ ${detailItem.theirRating}`], ['建议价格', `¥${(detailItem.theirPrice * 0.95).toFixed(2)}`],
              ['更新时间', detailItem.updatedAt?.slice(0, 19)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 100, color: 'var(--text-3)' }}>{label}</span>
                <span style={{ fontWeight: label === '我方价格' || label === '竞品价格' ? 600 : 400 }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { handleApplySuggestion(detailItem); setDetailItem(null); }}>应用建议价</button>
              <button className="btn btn-default" onClick={() => { setAdjustItem(detailItem); setAdjustPrice(detailItem.ourPrice.toString()); setDetailItem(null); }}>手动调价</button>
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
              <button onClick={() => setShowAddMonitor(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>商品名称 *</label>
            <input style={inputStyle} placeholder="输入商品名称" value={newMonitor.name} onChange={e => setNewMonitor(p => ({ ...p, name: e.target.value }))} />
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>竞品店铺</label>
            <input style={inputStyle} placeholder="竞品店铺名称" value={newMonitor.competitor} onChange={e => setNewMonitor(p => ({ ...p, competitor: e.target.value }))} />
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>平台 *</label>
            <select style={inputStyle} value={newMonitor.platform} onChange={e => setNewMonitor(p => ({ ...p, platform: e.target.value }))}>
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div><label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>竞品价格 *</label><input style={inputStyle} type="number" placeholder="0.00" value={newMonitor.theirPrice} onChange={e => setNewMonitor(p => ({ ...p, theirPrice: e.target.value }))} /></div>
              <div><label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>我方价格 *</label><input style={inputStyle} type="number" placeholder="0.00" value={newMonitor.ourPrice} onChange={e => setNewMonitor(p => ({ ...p, ourPrice: e.target.value }))} /></div>
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
