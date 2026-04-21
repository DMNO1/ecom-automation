/**
 * 订单管理 v2
 * 批量操作 + CSV导出 + 状态流转 + 统计概览
 */
import React, { useState, useMemo, useCallback } from 'react';
import { generateOrders, PLATFORMS, ORDER_STATUS } from '../../utils/mock';

const PAGE_SIZE = 10;

// 导出CSV
function exportCSV(orders) {
  const headers = ['订单号','平台','客户','电话','地址','商品数','金额','利润','支付方式','状态','物流单号','下单时间','备注'];
  const rows = orders.map(o => [
    o.orderNo,
    PLATFORMS.find(p => p.key === o.platform)?.name || o.platform,
    o.customer, o.phone, o.address,
    o.items, o.amount.toFixed(2), o.profit.toFixed(2),
    o.paymentMethod,
    ORDER_STATUS[o.status]?.label || o.status,
    o.logisticsNo || '',
    o.createdAt,
    o.remark || ''
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `订单导出_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function Orders() {
  const [orders, setOrders] = useState(() => generateOrders(80));
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [detailOrder, setDetailOrder] = useState(null);
  const [batchAction, setBatchAction] = useState('');
  const [toast, setToast] = useState('');

  // 筛选
  const filtered = useMemo(() => {
    let list = orders;
    if (platform !== 'all') list = list.filter(o => o.platform === platform);
    if (status !== 'all') list = list.filter(o => o.status === status);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(kw) || o.orderNo.includes(kw) ||
        o.customer.includes(kw) || o.phone.includes(kw)
      );
    }
    return list;
  }, [orders, platform, status, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 各状态数量统计
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  // 选中项金额统计
  const selectedStats = useMemo(() => {
    const sel = orders.filter(o => selected.has(o.id));
    return {
      count: sel.length,
      amount: sel.reduce((s, o) => s + o.amount, 0),
      profit: sel.reduce((s, o) => s + o.profit, 0),
    };
  }, [orders, selected]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === pageData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map(o => o.id)));
    }
  }, [selected.size, pageData]);

  // 批量操作
  const executeBatchAction = useCallback(() => {
    if (!batchAction || selected.size === 0) return;
    setOrders(prev => prev.map(o => {
      if (!selected.has(o.id)) return o;
      switch (batchAction) {
        case 'ship': return { ...o, status: 'shipped', shippedAt: new Date().toISOString() };
        case 'complete': return { ...o, status: 'completed', completedAt: new Date().toISOString() };
        case 'cancel': return { ...o, status: 'cancelled' };
        case 'refund': return { ...o, status: 'refunding' };
        default: return o;
      }
    }));
    const actionLabels = { ship: '发货', complete: '完成', cancel: '取消', refund: '退款' };
    showToast(`已批量${actionLabels[batchAction]} ${selected.size} 条订单`);
    setSelected(new Set());
    setBatchAction('');
  }, [batchAction, selected]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };
  const getStatusInfo = (key) => ORDER_STATUS[key] || { label: key, color: '#86909C' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
        <p className="page-desc">管理多平台订单，跟踪物流状态</p>
      </div>

      {/* 状态快捷筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${status === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatus('all'); setPage(1); }}
        >全部 ({orders.length})</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button
            key={k}
            className={`btn btn-sm ${status === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatus(k); setPage(1); }}
            style={status === k ? {} : { borderColor: v.color, color: v.color }}
          >
            {v.label} ({statusCounts[k] || 0})
          </button>
        ))}
      </div>

      {/* 搜索+操作栏 */}
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="搜索订单号、客户名、手机号..."
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}>
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => exportCSV(filtered)}>📥 导出CSV</button>
          <button className="btn btn-primary">➕ 新增订单</button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: 'var(--primary-light)',
          borderRadius: 8, marginBottom: 'var(--spacing-md)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
            已选 {selected.size} 条 · 总额 ¥{selectedStats.amount.toFixed(2)} · 利润 ¥{selectedStats.profit.toFixed(2)}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select
              className="filter-select"
              value={batchAction}
              onChange={e => setBatchAction(e.target.value)}
              style={{ minWidth: 100 }}
            >
              <option value="">选择操作</option>
              <option value="ship">📦 批量发货</option>
              <option value="complete">✅ 批量完成</option>
              <option value="refund">💰 批量退款</option>
              <option value="cancel">❌ 批量取消</option>
            </select>
            <button
              className="btn btn-primary btn-sm"
              disabled={!batchAction}
              onClick={executeBatchAction}
            >执行</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>取消选择</button>
          </div>
        </div>
      )}

      {/* 统计条 */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 'var(--spacing-md)', fontSize: 13, color: 'var(--text-3)' }}>
        <span>共 <b style={{ color: 'var(--text-1)' }}>{filtered.length}</b> 条订单</span>
        <span>总额 <b style={{ color: 'var(--primary)' }}>¥{filtered.reduce((s, o) => s + o.amount, 0).toFixed(2)}</b></span>
        <span>利润 <b style={{ color: 'var(--success)' }}>¥{filtered.reduce((s, o) => s + o.profit, 0).toFixed(2)}</b></span>
      </div>

      {/* 表格 */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={selected.size === pageData.length && pageData.length > 0} onChange={toggleAll} />
                </th>
                <th>订单号</th>
                <th>平台</th>
                <th>客户</th>
                <th>商品数</th>
                <th>金额</th>
                <th>利润</th>
                <th>状态</th>
                <th>下单时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(order => {
                const plat = getPlatformInfo(order.platform);
                const st = getStatusInfo(order.status);
                return (
                  <tr key={order.id} style={selected.has(order.id) ? { background: 'var(--primary-light)' } : {}}>
                    <td>
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} />
                    </td>
                    <td>
                      <span className="primary" style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                        {order.orderNo}
                      </span>
                    </td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{plat.icon} {plat.name}</span></td>
                    <td>
                      <div>{order.customer}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{order.phone}</div>
                    </td>
                    <td>{order.items}件</td>
                    <td style={{ fontWeight: 600 }}>¥{order.amount.toFixed(2)}</td>
                    <td style={{ color: order.profit > 0 ? 'var(--success)' : 'var(--danger)' }}>¥{order.profit.toFixed(2)}</td>
                    <td><span className="tag" style={{ background: st.color + '18', color: st.color }}>{st.label}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)' }}>{order.createdAt.slice(0, 16)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-text btn-sm" onClick={() => setDetailOrder(order)}>详情</button>
                        {order.status === 'paid' && (
                          <button className="btn btn-text btn-sm" style={{ color: 'var(--primary)' }}
                            onClick={() => {
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'shipped', shippedAt: new Date().toISOString() } : o));
                              showToast('已发货');
                            }}
                          >发货</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>第 {page}/{totalPages} 页</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, background: 'var(--success)', color: '#fff',
          padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease'
        }}>✅ {toast}</div>
      )}

      {/* 详情弹窗 */}
      {detailOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setDetailOrder(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 28, width: 560, maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>订单详情</h3>
              <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            {/* 状态时间线 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 8 }}>
              {['pending', 'paid', 'shipped', 'delivered', 'completed'].map((s, i) => {
                const isActive = ['pending','paid','shipped','delivered','completed'].indexOf(detailOrder.status) >= i;
                const st = ORDER_STATUS[s];
                return (
                  <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', margin: '0 auto 4px',
                      background: isActive ? st.color : 'var(--bg-3)',
                      color: isActive ? '#fff' : 'var(--text-4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 11, color: isActive ? st.color : 'var(--text-4)' }}>{st.label}</div>
                  </div>
                );
              })}
            </div>
            {[
              ['订单号', detailOrder.orderNo],
              ['平台', getPlatformInfo(detailOrder.platform).name],
              ['客户', detailOrder.customer],
              ['电话', detailOrder.phone],
              ['地址', detailOrder.address],
              ['商品数', `${detailOrder.items} 件`],
              ['订单金额', `¥${detailOrder.amount.toFixed(2)}`],
              ['利润', `¥${detailOrder.profit.toFixed(2)}`],
              ['支付方式', detailOrder.paymentMethod],
              ['状态', getStatusInfo(detailOrder.status).label],
              ['物流单号', detailOrder.logisticsNo || '-'],
              ['下单时间', detailOrder.createdAt],
              ['备注', detailOrder.remark || '-'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 100, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--text-1)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
