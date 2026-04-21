/**
 * 商品管理
 * 商品列表 + 库存管理 + 状态筛选
 */
import React, { useState, useMemo } from 'react';
import { generateProducts, PLATFORMS } from '../../utils/mock';

const STATUS_MAP = {
  active: { label: '在售', color: '#00B42A' },
  low_stock: { label: '库存预警', color: '#FF7D00' },
  out_of_stock: { label: '缺货', color: '#F53F3F' },
};

export default function Products() {
  const [products] = useState(() => generateProducts(30));
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = useMemo(() => {
    let list = products;
    if (platform !== 'all') list = list.filter(p => p.platform === platform);
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (status !== 'all') list = list.filter(p => p.status === status);
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw));
    }
    list = [...list].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mul;
    });
    return list;
  }, [products, platform, category, status, keyword, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 统计
  const totalProducts = products.length;
  const activeCount = products.filter(p => p.status === 'active').length;
  const lowStockCount = products.filter(p => p.status === 'low_stock').length;
  const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === field ? 1 : 0.3 }}>
      {sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <p className="page-desc">多平台商品统一管理、库存监控</p>
      </div>

      {/* 统计概览 */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setStatus('all'); setPage(1); }}>
          <div className="stat-card-title">全部商品</div>
          <div className="stat-card-value" style={{ fontSize: 24 }}>{totalProducts}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setStatus('active'); setPage(1); }}>
          <div className="stat-card-title">在售中</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--success)' }}>{activeCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setStatus('low_stock'); setPage(1); }}>
          <div className="stat-card-title">库存预警</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: '#FF7D00' }}>{lowStockCount}</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setStatus('out_of_stock'); setPage(1); }}>
          <div className="stat-card-title">已缺货</div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--danger)' }}>{outOfStockCount}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="搜索商品名称、SKU..."
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}>
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
        </select>
        <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">全部品类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-default">📥 导入</button>
          <button className="btn btn-default">📤 导出</button>
          <button className="btn btn-primary">➕ 添加商品</button>
        </div>
      </div>

      {/* 商品表格 */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>SKU</th>
                <th>平台</th>
                <th>品类</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                  售价 <SortIcon field="price" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cost')}>
                  成本 <SortIcon field="cost" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stock')}>
                  库存 <SortIcon field="stock" />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sales')}>
                  销量 <SortIcon field="sales" />
                </th>
                <th>评分</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(product => {
                const plat = getPlatformInfo(product.platform);
                const st = STATUS_MAP[product.status];
                const margin = ((product.price - product.cost) / product.price * 100).toFixed(0);
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={product.image}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: 'var(--bg-3)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>利润率 {margin}%</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{product.id}</td>
                    <td>{plat.icon} {plat.name}</td>
                    <td><span className="tag tag-gray">{product.category}</span></td>
                    <td style={{ fontWeight: 600 }}>¥{product.price.toFixed(1)}</td>
                    <td style={{ color: 'var(--text-3)' }}>¥{product.cost}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          color: product.stock === 0 ? 'var(--danger)' : product.stock < 20 ? '#FF7D00' : 'var(--text-1)',
                          fontWeight: product.stock < 20 ? 600 : 400
                        }}>{product.stock}</span>
                        {product.stock > 0 && product.stock < 20 && (
                          <div className="progress-bar" style={{ width: 40 }}>
                            <div className="progress-bar-fill" style={{
                              width: `${(product.stock / 20) * 100}%`,
                              background: '#FF7D00',
                            }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{product.sales.toLocaleString()}</td>
                    <td>
                      <span style={{ color: '#FF7D00' }}>★</span> {product.rating}
                    </td>
                    <td>
                      <span className="tag" style={{ background: st.color + '15', color: st.color }}>{st.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-text btn-sm">编辑</button>
                        <button className="btn btn-text btn-sm" style={{ color: 'var(--danger)' }}>下架</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            共 {filtered.length} 件商品，第 {page}/{totalPages} 页
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-default btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            <button className="btn btn-default btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
