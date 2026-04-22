import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Tabs, DatePicker, Select, Space, Button, List, Avatar, Typography, Divider, Alert } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

// 模拟数据
const generateDailyData = (days = 30) => {
  const data = [];
  const baseDate = dayjs().subtract(days, 'day');
  
  for (let i = 0; i < days; i++) {
    const date = baseDate.add(i, 'day').format('YYYY-MM-DD');
    data.push({
      date,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 200) + 50,
      customers: Math.floor(Math.random() * 100) + 20,
      profit: Math.floor(Math.random() * 15000) + 3000,
    });
  }
  return data;
};

const platformData = [
  { platform: '抖音', orders: 1245, revenue: 125680, percentage: 35 },
  { platform: '拼多多', orders: 986, revenue: 89420, percentage: 25 },
  { platform: '闲鱼', orders: 754, revenue: 67850, percentage: 20 },
  { platform: '快手', orders: 632, revenue: 58790, percentage: 20 },
];

const alertData = [
  { id: 1, type: 'warning', title: '库存预警', content: '蓝牙耳机A1库存不足10件', time: '10分钟前' },
  { id: 2, type: 'error', title: '退款申请', content: '订单#20260422001有退款申请待处理', time: '25分钟前' },
  { id: 3, type: 'info', title: '订单提醒', content: '有15个订单待发货', time: '1小时前' },
  { id: 4, type: 'warning', title: '差评预警', content: '商品"智能手表"收到1星评价', time: '2小时前' },
];

const todoData = [
  { id: 1, title: '待发货订单', count: 15, icon: <ShoppingCartOutlined />, color: '#165DFF' },
  { id: 2, title: '待处理退款', count: 3, icon: <DollarOutlined />, color: '#F53F3F' },
  { id: 3, title: '待回复消息', count: 8, icon: <UserOutlined />, color: '#FF7D00' },
  { id: 4, title: '库存预警', count: 5, icon: <WarningOutlined />, color: '#722ED1' },
];

export default function Dashboard() {
  const [dailyData, setDailyData] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载数据
    setLoading(true);
    setTimeout(() => {
      setDailyData(generateDailyData(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 1));
      setLoading(false);
    }, 500);
  }, [dateRange]);

  // 核心指标
  const totalRevenue = dailyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = dailyData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = dailyData.reduce((sum, item) => sum + item.customers, 0);
  const totalProfit = dailyData.reduce((sum, item) => sum + item.profit, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;

  // 趋势图配置
  const lineConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'revenue',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    line: {
      color: '#165DFF',
      lineWidth: 2,
    },
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#e6f4ff 1:#165DFF',
      },
    },
    tooltip: {
      showMarkers: true,
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: '#0050b3',
          fill: '#165DFF',
        },
      },
    },
    interactions: [
      {
        type: 'marker-active',
      },
    ],
  };

  // 平台占比图配置
  const pieConfig = {
    data: platformData,
    angleField: 'percentage',
    colorField: 'platform',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}%',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    color: ['#165DFF', '#00B42A', '#FF7D00', '#722ED1'],
  };

  // 订单趋势图配置
  const columnConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'orders',
    columnWidthRatio: 0.6,
    columnStyle: {
      radius: [4, 4, 0, 0],
      fill: '#165DFF',
    },
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    tooltip: {
      showMarkers: true,
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: '#0050b3',
          fill: '#165DFF',
        },
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // 表格列配置
  const platformColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a, b) => a.orders - b.orders,
    },
    {
      title: '营收',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val) => (
        <Progress 
          percent={val} 
          size="small" 
          status="active"
          strokeColor={val > 30 ? '#165DFF' : val > 20 ? '#00B42A' : '#FF7D00'}
        />
      ),
    },
  ];

  return (
    <div className="dashboard">
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>工作台</Title>
        <Space>
          <Select 
            value={dateRange} 
            onChange={setDateRange}
            style={{ width: 120 }}
          >
            <Option value="1d">今日</Option>
            <Option value="7d">近7天</Option>
            <Option value="30d">近30天</Option>
          </Select>
          <Select 
            value={platform} 
            onChange={setPlatform}
            style={{ width: 120 }}
          >
            <Option value="all">全部平台</Option>
            <Option value="douyin">抖音</Option>
            <Option value="pdd">拼多多</Option>
            <Option value="xianyu">闲鱼</Option>
            <Option value="kuaishou">快手</Option>
          </Select>
          <Button type="primary" icon={<SyncOutlined />}>
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="总营收"
              value={totalRevenue}
              precision={2}
              valueStyle={{ color: '#165DFF' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">日均: ¥{Math.round(totalRevenue / (dailyData.length || 1)).toLocaleString()}</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>
                <ArrowUpOutlined /> 12.5%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="净利润"
              value={totalProfit}
              precision={2}
              valueStyle={{ color: '#00B42A' }}
              prefix={<ArrowUpOutlined />}
              suffix="元"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">利润率: {profitMargin}%</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>
                <ArrowUpOutlined /> 8.2%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="订单数"
              value={totalOrders}
              valueStyle={{ color: '#FF7D00' }}
              prefix={<ShoppingCartOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">客单价: ¥{avgOrderValue.toFixed(2)}</Text>
              <Tag color="red" style={{ marginLeft: 8 }}>
                <ArrowDownOutlined /> 3.1%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="新增客户"
              value={totalCustomers}
              valueStyle={{ color: '#722ED1' }}
              prefix={<UserOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">转化率: 4.2%</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>
                <ArrowUpOutlined /> 5.7%
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="营收趋势" loading={loading}>
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="平台占比" loading={loading}>
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* 下方区域 */}
      <Row gutter={[16, 16]}>
        {/* 左侧：待办事项和预警 */}
        <Col xs={24} lg={8}>
          <Card title="待办事项" style={{ marginBottom: 16 }}>
            <List
              itemLayout="horizontal"
              dataSource={todoData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.icon} 
                        style={{ backgroundColor: item.color }} 
                      />
                    }
                    title={item.title}
                    description={`有 ${item.count} 条需要处理`}
                  />
                  <Button type="link">去处理</Button>
                </List.Item>
              )}
            />
          </Card>
          
          <Card title="预警信息">
            <List
              itemLayout="horizontal"
              dataSource={alertData}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <ExclamationCircleOutlined 
                        style={{ 
                          color: item.type === 'error' ? '#F53F3F' : 
                                 item.type === 'warning' ? '#FF7D00' : '#165DFF',
                          fontSize: 20,
                        }} 
                      />
                    }
                    title={item.title}
                    description={item.content}
                  />
                  <Text type="secondary">{item.time}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：订单趋势和平台对比 */}
        <Col xs={24} lg={16}>
          <Card title="订单趋势" style={{ marginBottom: 16 }} loading={loading}>
            <Column {...columnConfig} height={200} />
          </Card>
          
          <Card title="平台经营对比">
            <Table
              columns={platformColumns}
              dataSource={platformData}
              pagination={false}
              size="small"
              rowKey="platform"
            />
          </Card>
        </Col>
      </Row>

      {/* 底部：库存预警 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#FF7D00' }} />
                <span>库存预警</span>
                <Tag color="orange">5件</Tag>
              </Space>
            }
            extra={<Button type="link">查看全部</Button>}
          >
            <Table
              columns={[
                {
                  title: '商品',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: '平台',
                  dataIndex: 'platform',
                  key: 'platform',
                  render: (text) => <Tag>{text}</Tag>,
                },
                {
                  title: '库存',
                  dataIndex: 'stock',
                  key: 'stock',
                  render: (val) => (
                    <Text type={val < 5 ? 'danger' : 'warning'}>{val}</Text>
                  ),
                },
                {
                  title: '日均销量',
                  dataIndex: 'dailySales',
                  key: 'dailySales',
                },
                {
                  title: '预计可售天数',
                  dataIndex: 'daysLeft',
                  key: 'daysLeft',
                  render: (val) => (
                    <Text type={val < 3 ? 'danger' : val < 7 ? 'warning' : 'success'}>
                      {val}天
                    </Text>
                  ),
                },
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Button type="link" size="small">
                      立即补货
                    </Button>
                  ),
                },
              ]}
              dataSource={[
                { key: '1', name: '蓝牙耳机A1', platform: '抖音', stock: 8, dailySales: 2, daysLeft: 4 },
                { key: '2', name: '智能手表S2', platform: '拼多多', stock: 3, dailySales: 1, daysLeft: 3 },
                { key: '3', name: '充电宝10000mAh', platform: '闲鱼', stock: 12, dailySales: 3, daysLeft: 4 },
                { key: '4', name: '手机壳透明款', platform: '快手', stock: 5, dailySales: 2, daysLeft: 2 },
                { key: '5', name: '数据线快充', platform: '抖音', stock: 2, dailySales: 1, daysLeft: 2 },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}