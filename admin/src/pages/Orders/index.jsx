/**
 * 订单管理
 * 支持筛选、搜索、分页、状态管理
 */
import React, { useState, useMemo } from 'react';
import { generateOrders, PLATFORMS, ORDER_STATUS } from '../../utils/mock';

const PAGE_SIZE = 10;

export default function Orders() {
  const [orders] = useState(() => generateOrders(80));
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [detailOrder, setDetailOrder] = useState(null);

  // 筛选逻辑
  const filtered = useMemo(() => {
    let list = orders;
    if (platform !== 'all') list = list.filter(o => o.platform === platform);
    if (status !== 'all') list = list.filter(o => o.status === status);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(kw) ||
        o.orderNo.includes(kw) ||
        o.customer.includes(kw) ||
        o.phone.includes(kw)
      );
    }
    return list;
  }, [orders, platform, status, keyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === pageData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageData.map(o => o.id)));
    }
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };
  const getStatusInfo = (key) => ORDER_STATUS[key] || { label: key, color: '#86909C' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
        <p className="page-desc">管理多平台订单，跟踪物流状态</p>
      </div>

      {/* 筛选栏 */}
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
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">全部状态</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary">📥 导出</button>
          <button className="btn btn-primary">➕ 新增订单</button>
        </div>
      </div>

      {/* 统计条 */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 'var(--spacing-md)',
        fontSize: 13,
        color: 'var(--text-3)'
      }}>
        <span>共 <b style={{ color: 'var(--text-1)' }}>{filtered.length}</b> 条订单</span>
        {selected.size > 0 && <span>已选 <b style={{ color: 'var(--primary)' }}>{selected.size}</b> 条</span>}
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
                  <tr key={order.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)} />
                    </td>
                    <td>
                      <span className="primary" style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(order)}>
                        {order.orderNo}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {plat.icon} {plat.name}
                      </span>
                    </td>
                    <td>
                      <div>{order.customer}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{order.phone}</div>
                    </td>
                    <td>{order.items}件</td>
                    <td style={{ fontWeight: 600 }}>¥{order.amount.toFixed(2)}</td>
                    <td style={{ color: order.profit > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ¥{order.profit.toFixed(2)}
                    </td>
                    <td>
                      <span className="tag" style={{ background: st.color + '18', color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)' }}>{order.createdAt.slice(0, 16)}</td>
                    <td>
                      <button className="btn btn-text btn-sm" onClick={() => setDetailOrder(order)}>详情</button>
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            第 {page}/{totalPages} 页
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>

      {/* 订单详情弹窗 */}
      {detailOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setDetailOrder(null)}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>订单详情</h3>
              <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
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
