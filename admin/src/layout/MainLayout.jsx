/**
 * 主布局 - CRMEB风格
 * 左侧窄导航 + 顶栏 + 内容区
 */
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const MENU_GROUPS = [
  {
    title: '核心',
    items: [
      { key: '/', icon: '📊', label: '工作台' },
      { key: '/orders', icon: '📦', label: '订单管理', badge: 0 },
      { key: '/products', icon: '🏷️', label: '商品管理' },
    ]
  },
  {
    title: '运营',
    items: [
      { key: '/customer-service', icon: '💬', label: '客服管理', badge: 3 },
      { key: '/competitors', icon: '🔍', label: '竞品分析', badge: 2 },
    ]
  },
  {
    title: '系统',
    items: [
      { key: '/settings', icon: '⚙️', label: '系统设置' },
    ]
  }
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentMenu = MENU_GROUPS.flatMap(g => g.items).find(m =>
    m.key === '/' ? location.pathname === '/' : location.pathname.startsWith(m.key)
  ) || { label: '工作台' };

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🛒</div>
          <h1>电商管理平台</h1>
        </div>
        <nav className="sidebar-menu">
          {MENU_GROUPS.map((group, gi) => (
            <div key={gi}>
              {!collapsed && <div className="menu-group-title">{group.title}</div>}
              {group.items.map(item => (
                <div
                  key={item.key}
                  className={`menu-item ${location.pathname === item.key ||
                    (item.key !== '/' && location.pathname.startsWith(item.key)) ? 'active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  <span className="mi-icon">{item.icon}</span>
                  <span className="mi-text">{item.label}</span>
                  {item.badge > 0 && <span className="mi-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <div className="app-main">
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
              <span className="dot"></span>
            </button>
            <div className="header-user">
              <div className="avatar">马</div>
              <span className="name">马晓倩</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
