/**
 * 电商管理后台 - 主布局组件
 * 参考：抖音店铺管理后台布局
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { key: '/', icon: '📊', label: '数据概览', badge: 0 },
  { key: '/orders', icon: '📦', label: '订单管理', badge: 0 },
  { key: '/customer-service', icon: '💬', label: '客服中心', badge: 3 },
  { key: '/products', icon: '🏷️', label: '商品管理', badge: 0 },
  { key: '/competitors', icon: '🔍', label: '竞品分析', badge: 2 },
  { key: '/settings', icon: '⚙️', label: '系统设置', badge: 0 },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路由找到标题
  const currentMenu = MENU_ITEMS.find(m =>
    m.key === '/' ? location.pathname === '/' : location.pathname.startsWith(m.key)
  ) || MENU_ITEMS[0];

  // 移动端点击菜单后关闭侧边栏
  const handleMenuClick = (key) => {
    navigate(key);
    setMobileOpen(false);
  };

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🛒</div>
          <h1 className="logo-text">电商管理后台</h1>
        </div>
        <nav className="sidebar-menu">
          {MENU_ITEMS.map(item => (
            <div
              key={item.key}
              className={`menu-item ${location.pathname === item.key ||
                (item.key !== '/' && location.pathname.startsWith(item.key)) ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.key)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.label}</span>
              {item.badge > 0 && <span className="menu-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            v1.0.0 · 多平台电商自动化
          </div>
        )}
      </aside>

      {/* 主内容 */}
      <div className="app-main">
        {/* 顶部栏 */}
        <header className="app-header">
          <div className="header-left">
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? '☰' : '◀'}
            </button>
            <div className="header-breadcrumb">
              首页 / <span>{currentMenu.label}</span>
            </div>
          </div>
          <div className="header-right">
            <button className="header-action" title="搜索">🔍</button>
            <button className="header-action" title="通知">
              🔔
              <span className="badge"></span>
            </button>
            <button className="header-action" title="帮助">❓</button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '8px',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'var(--bg-3)'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600
              }}>马</div>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>马晓倩</span>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
