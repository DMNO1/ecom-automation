import React, { useState } from 'react';
import { Layout, Menu, Breadcrumb, Avatar, Dropdown, Input, Badge, theme, Tag } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  UserOutlined,
  GiftOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  AccountBookOutlined,
  CarOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    type: 'group',
    label: '概览',
    children: [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '工作台',
      },
      {
        key: '/analytics',
        icon: <BarChartOutlined />,
        label: '数据中心',
      },
    ],
  },
  {
    type: 'group',
    label: '交易运营',
    children: [
      {
        key: '/products',
        icon: <ShoppingOutlined />,
        label: '商品中心',
      },
      {
        key: '/orders',
        icon: <OrderedListOutlined />,
        label: '订单中心',
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: '客户中心',
      },
      {
        key: '/marketing',
        icon: <GiftOutlined />,
        label: '营销中心',
      },
      {
        key: '/service',
        icon: <CustomerServiceOutlined />,
        label: '客服中心',
      },
    ],
  },
  {
    type: 'group',
    label: '履约与结算',
    children: [
      {
        key: '/finance',
        icon: <AccountBookOutlined />,
        label: '财务中心',
      },
      {
        key: '/supply-chain',
        icon: <CarOutlined />,
        label: '供应链',
      },
    ],
  },
  {
    type: 'group',
    label: '系统',
    children: [
      {
        key: '/system',
        icon: <SettingOutlined />,
        label: '系统管理',
      },
    ],
  },
];

const flatMenuItems = menuItems.flatMap((group) => group.children || []);

const userMenuItems = [
  {
    key: 'profile',
    label: '个人中心',
  },
  {
    key: 'settings',
    label: '账户设置',
  },
  {
    key: 'logout',
    label: '退出登录',
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      // 处理退出登录
      console.log('退出登录');
    }
  };

  // 生成面包屑
  const pathSnippets = location.pathname.split('/').filter(i => i);
  const breadcrumbItems = [
    {
      title: '首页',
    },
    ...pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      return {
        title: flatMenuItems.find(item => item.key === url)?.label || url,
      };
    }),
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F2F4F7' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
          borderRight: '1px solid #e5e6eb',
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold', color: '#165DFF' }}>E</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#165DFF' }}>电商运营系统</span>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>PRO</Tag>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none', paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e6eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', cursor: 'pointer' },
            })}
            <Breadcrumb 
              items={breadcrumbItems} 
              style={{ marginLeft: 16 }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="搜索商品/订单/客户" 
              style={{ width: 260 }} 
            />
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Avatar 
                icon={<UserOutlined />} 
                style={{ cursor: 'pointer', backgroundColor: '#165DFF' }} 
              />
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            background: 'transparent',
            borderRadius: 0,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}