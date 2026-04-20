import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from '@arco-design/web-react';
import {
  IconDashboard,
  IconList,
  IconCustomerService,
  IconApps,
  IconSafe,
  IconSettings,
  IconNotification,
  IconPoweroff,
} from '@arco-design/web-react/icon';
import { useNavigate, useLocation, useRoutes } from 'react-router-dom';
import logoSvg from './assets/logo.svg';
import routes from './router/index.jsx';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <IconDashboard />, title: '仪表盘' },
  { key: '/orders', icon: <IconList />, title: '订单管理' },
  { key: '/customer-service', icon: <IconCustomerService />, title: '客服中心' },
  { key: '/products', icon: <IconApps />, title: '商品管理' },
  { key: '/competitors', icon: <IconSafe />, title: '竞品分析' },
  { key: '/settings', icon: <IconSettings />, title: '系统设置' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const element = useRoutes(routes);

  const userDropdown = (
    <Menu>
      <Menu.Item key="logout" style={{ color: '#f53f3f' }}>
        <IconPoweroff style={{ marginRight: 8 }} />
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="md"
        width={220}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <img src={logoSvg} alt="logo" style={{ height: 32 }} />
          {!collapsed && (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginLeft: 12, whiteSpace: 'nowrap' }}>
              电商管理
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          onClickMenuItem={(key) => navigate(key)}
          style={{ width: '100%', background: 'transparent' }}
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key}>
              {item.icon}
              <span>{item.title}</span>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Header
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Badge count={5} dot>
            <Button type="text" icon={<IconNotification style={{ fontSize: 20 }} />} />
          </Badge>
          <Dropdown droplist={userDropdown} position="br">
            <Avatar style={{ marginLeft: 16, cursor: 'pointer', backgroundColor: '#165dff' }}>管</Avatar>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: '#f2f3f5', overflow: 'auto' }}>
          {element}
        </Content>
      </Layout>
    </Layout>
  );
}
