/**
 * 商品管理 v2 - 全功能版
 * 添加商品 + 编辑 + 下架 + 导入导出 + 详情弹窗
 */
import React, { useState, useMemo, useCallback } from 'react';
import { generateProducts, PLATFORMS } from '../../utils/mock';

const STATUS_MAP = {
  active: { label: '在售', color: '#00B42A' },
  low_stock: { label: '库存预警', color: '#FF7D00' },
  out_of_stock: { label: '缺货', color: '#F53F3F' },
};

const CATEGORIES = ['数码配件', '家居日用', '服饰鞋包', '美妆个护', '食品生鲜', '办公用品'];

// 导出CSV
function exportCSV(products) {
  const headers = ['SKU', '商品名称', '平台', '品类', '售价', '成本', '库存', '销量', '评分', '状态'];
  const rows = products.map(p => [
    p.id, p.name, PLATFORMS.find(x => x.key === p.platform)?.name || p.platform,
    p.category, p.price, p.cost, p.stock, p.sales, p.rating, STATUS_MAP[p.status]?.label || p.status
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `商品导出_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// 导出导入模板
function downloadTemplate() {
  const headers = ['商品名称', 'SKU', '平台', '品类', '售价', '成本', '库存', '描述'];
  const example = ['示例蓝牙耳机', 'SKU001', 'douyin', '数码配件', '199', '80', '100', '商品描述'];
  const csv = [headers, example].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '商品导入模板.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Products() {
  const [products, setProducts] = useState(() => generateProducts(30));
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('sales');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', platform: 'douyin', category: '数码配件', price: '', cost: '', stock: '', description: '' });
  const PAGE_SIZE = 10;

  const categories = [...new Set([...CATEGORIES, ...products.map(p => p.category)])];

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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) { showToast('请填写商品名称和售价'); return; }
    const product = {
      id: `SKU${String(products.length + 1).padStart(4, '0')}`,
      name: newProduct.name,
      platform: newProduct.platform,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      cost: parseFloat(newProduct.cost) || 0,
      stock: parseInt(newProduct.stock) || 0,
      sales: 0,
      rating: 5.0,
      status: 'active',
      image: `https://picsum.photos/seed/${Date.now()}/80/80`,
      description: newProduct.description,
    };
    setProducts(prev => [product, ...prev]);
    setShowAddForm(false);
    setNewProduct({ name: '', sku: '', platform: 'douyin', category: '数码配件', price: '', cost: '', stock: '', description: '' });
    showToast('商品添加成功！');
  };

  const handleEditSave = () => {
    if (!editProduct) return;
    setProducts(prev => prev.map(p => p.id === editProduct.id ? editProduct : p));
    setEditProduct(null);
    showToast('商品更新成功！');
  };

  const handleShelfOff = (product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: p.status === 'out_of_stock' ? 'active' : 'out_of_stock' } : p));
    showToast(product.status === 'out_of_stock' ? '已上架' : '已下架');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n').filter(l => l.trim());
      if (lines.length < 2) { showToast('文件格式错误'); return; }
      let count = 0;
      const newProducts = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 6) continue;
        newProducts.push({
          id: `SKU${String(products.length + newProducts.length + 1).padStart(4, '0')}`,
          name: cols[0] || `商品${i}`, platform: cols[2] || 'douyin', category: cols[3] || '其他',
          price: parseFloat(cols[4]) || 0, cost: parseFloat(cols[5]) || 0,
          stock: parseInt(cols[6]) || 0, sales: 0, rating: 5.0, status: 'active',
          image: `https://picsum.photos/seed/${Date.now() + i}/80/80`,
        });
        count++;
      }
      if (newProducts.length > 0) {
        setProducts(prev => [...newProducts, ...prev]);
        showToast(`成功导入 ${count} 个商品！`);
      } else {
        showToast('未识别到有效数据，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === field ? 1 : 0.3 }}>
      {sortBy === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const totalProducts = products.length;
  const activeCount = products.filter(p => p.status === 'active').length;
  const lowStockCount = products.filter(p => p.status === 'low_stock').length;
  const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, outline: 'none', marginBottom: 12 };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <p className="page-desc">多平台商品统一管理、库存监控</p>
      </div>

      {/* 统计概览 - 可点击筛选 */}
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
        <input className="filter-input" placeholder="搜索商品名称、SKU..." value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} />
        <select className="filter-select" value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}>
          <option value="all">全部平台</option>
          {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
        </select>
        <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">全部品类</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={downloadTemplate}>📋 下载模板</button>
          <label className="btn btn-default" style={{ cursor: 'pointer' }}>
            📥 导入
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-default" onClick={() => exportCSV(filtered)}>📤 导出</button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>➕ 添加商品</button>
        </div>
      </div>

      {/* 商品表格 */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>商品</th><th>SKU</th><th>平台</th><th>品类</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>售价 <SortIcon field="price" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cost')}>成本 <SortIcon field="cost" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stock')}>库存 <SortIcon field="stock" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sales')}>销量 <SortIcon field="sales" /></th>
                <th>评分</th><th>状态</th><th>操作</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setDetailProduct(product)}>
                        <img src={product.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: 'var(--bg-3)' }} />
                        <div>
                          <div style={{ fontWeight: 500, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
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
                        <span style={{ color: product.stock === 0 ? 'var(--danger)' : product.stock < 20 ? '#FF7D00' : 'var(--text-1)', fontWeight: product.stock < 20 ? 600 : 400 }}>{product.stock}</span>
                        {product.stock > 0 && product.stock < 20 && (
                          <div className="progress-bar" style={{ width: 40 }}>
                            <div className="progress-bar-fill" style={{ width: `${(product.stock / 20) * 100}%`, background: '#FF7D00' }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{product.sales.toLocaleString()}</td>
                    <td><span style={{ color: '#FF7D00' }}>★</span> {product.rating}</td>
                    <td><span className="tag" style={{ background: st.color + '15', color: st.color }}>{st.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-text btn-sm" onClick={() => setEditProduct({ ...product })}>编辑</button>
                        <button className="btn btn-text btn-sm" style={{ color: product.status === 'out_of_stock' ? 'var(--success)' : 'var(--danger)' }} onClick={() => handleShelfOff(product)}>
                          {product.status === 'out_of_stock' ? '上架' : '下架'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>共 {filtered.length} 件商品，第 {page}/{totalPages} 页</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-default btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-default'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn btn-default btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: 'fixed', top: 80, right: 24, background: 'var(--success)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>✅ {toast}</div>}

      {/* 添加商品弹窗 */}
      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddForm(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>添加商品</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1/3' }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>商品名称 *</label>
                <input style={inputStyle} placeholder="输入商品名称" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>SKU</label>
                <input style={inputStyle} placeholder="自动生成" value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>平台 *</label>
                <select style={inputStyle} value={newProduct.platform} onChange={e => setNewProduct(p => ({ ...p, platform: e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>品类 *</label>
                <select style={inputStyle} value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>售价 *</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>成本</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={newProduct.cost} onChange={e => setNewProduct(p => ({ ...p, cost: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>库存</label>
                <input style={inputStyle} type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/3' }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>描述</label>
                <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} placeholder="商品描述..." value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-default" onClick={() => setShowAddForm(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddProduct}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑商品弹窗 */}
      {editProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditProduct(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>编辑商品</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ gridColumn: '1/3' }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>商品名称</label>
                <input style={inputStyle} value={editProduct.name} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>售价</label>
                <input style={inputStyle} type="number" value={editProduct.price} onChange={e => setEditProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>成本</label>
                <input style={inputStyle} type="number" value={editProduct.cost} onChange={e => setEditProduct(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>库存</label>
                <input style={inputStyle} type="number" value={editProduct.stock} onChange={e => setEditProduct(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-2)' }}>品类</label>
                <select style={inputStyle} value={editProduct.category} onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-default" onClick={() => setEditProduct(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleEditSave}>保存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 商品详情弹窗 */}
      {detailProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetailProduct(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>商品详情</h3>
              <button onClick={() => setDetailProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <img src={detailProduct.image} alt="" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', background: 'var(--bg-3)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{detailProduct.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>SKU: {detailProduct.id}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span className="tag" style={{ background: STATUS_MAP[detailProduct.status]?.color + '15', color: STATUS_MAP[detailProduct.status]?.color }}>{STATUS_MAP[detailProduct.status]?.label}</span>
                  <span className="tag tag-gray">{detailProduct.category}</span>
                </div>
              </div>
            </div>
            {[
              ['平台', getPlatformInfo(detailProduct.platform).icon + ' ' + getPlatformInfo(detailProduct.platform).name],
              ['售价', `¥${detailProduct.price.toFixed(2)}`],
              ['成本', `¥${detailProduct.cost.toFixed(2)}`],
              ['利润率', `${((detailProduct.price - detailProduct.cost) / detailProduct.price * 100).toFixed(1)}%`],
              ['库存', detailProduct.stock],
              ['销量', detailProduct.sales.toLocaleString()],
              ['评分', `★ ${detailProduct.rating}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 80, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--text-1)', fontWeight: label === '售价' ? 600 : 400 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
