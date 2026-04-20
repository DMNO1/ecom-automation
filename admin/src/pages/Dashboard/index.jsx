import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Grid,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
  Space,
  Button,
  Tooltip,
  List,
  Avatar,
  Divider,
} from '@arco-design/web-react';
import {
  IconTag,
  IconFire,
  IconUserGroup,
  IconFile,
  IconArrowRise,
  IconArrowFall,
  IconCheckCircle,
  IconClockCircle,
  IconExclamationCircle,
} from '@arco-design/web-react/icon';
import { Chart } from '@antv/g2';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

// Mock data for statistics cards
const statisticsData = [
  {
    title: '今日订单数',
    value: 1284,
    prefix: <IconTag style={{ fontSize: 24, color: '#4080FF' }} />,
    suffix: '%',
    trend: 'up',
    trendValue: 12.5,
    color: '#4080FF',
    gradientColor: ['#4080FF', '#6EAAFF'],
  },
  {
    title: '今日销售额',
    value: 89650,
    prefix: <IconFire style={{ fontSize: 24, color: '#00B42A' }} />,
    suffix: '元',
    trend: 'up',
    trendValue: 8.3,
    color: '#00B42A',
    gradientColor: ['#00B42A', '#23C343'],
  },
  {
    title: '活跃客户数',
    value: 3567,
    prefix: <IconUserGroup style={{ fontSize: 24, color: '#FF7D00' }} />,
    suffix: '',
    trend: 'down',
    trendValue: 2.1,
    color: '#FF7D00',
    gradientColor: ['#FF7D00', '#FFB366'],
  },
  {
    title: '待处理工单',
    value: 42,
    prefix: <IconFile style={{ fontSize: 24, color: '#F53F3F' }} />,
    suffix: '',
    trend: 'up',
    trendValue: 5.7,
    color: '#F53F3F',
    gradientColor: ['#F53F3F', '#FF7A7A'],
  },
];

// Mock data for order trend (7 days)
const orderTrendData = [
  { date: '04-14', orders: 120, sales: 24000 },
  { date: '04-15', orders: 132, sales: 28000 },
  { date: '04-16', orders: 101, sales: 19000 },
  { date: '04-17', orders: 134, sales: 31000 },
  { date: '04-18', orders: 190, sales: 42000 },
  { date: '04-19', orders: 230, sales: 56000 },
  { date: '04-20', orders: 210, sales: 48000 },
];

// Mock data for platform sales distribution
const platformSalesData = [
  { platform: '抖店', value: 35, color: '#4080FF' },
  { platform: '快手', value: 25, color: '#FF7D00' },
  { platform: '拼多多', value: 20, color: '#F53F3F' },
  { platform: '闲鱼', value: 15, color: '#00B42A' },
  { platform: '其他', value: 5, color: '#722ED1' },
];

// Mock data for latest orders
const latestOrders = [
  {
    id: 'DD20240420001',
    platform: '抖店',
    product: '无线蓝牙耳机',
    amount: 299,
    status: 'pending',
    time: '2024-04-20 14:32:15',
  },
  {
    id: 'DD20240420002',
    platform: '快手',
    product: '智能手表',
    amount: 599,
    status: 'processing',
    time: '2024-04-20 14:28:42',
  },
  {
    id: 'DD20240420003',
    platform: '拼多多',
    product: '充电宝',
    amount: 89,
    status: 'shipped',
    time: '2024-04-20 14:15:20',
  },
  {
    id: 'DD20240420004',
    platform: '抖店',
    product: '手机壳',
    amount: 49,
    status: 'delivered',
    time: '2024-04-20 13:58:33',
  },
  {
    id: 'DD20240420005',
    platform: '闲鱼',
    product: '二手相机',
    amount: 1299,
    status: 'cancelled',
    time: '2024-04-20 13:45:10',
  },
  {
    id: 'DD20240420006',
    platform: '快手',
    product: '运动鞋',
    amount: 359,
    status: 'refunded',
    time: '2024-04-20 13:30:55',
  },
  {
    id: 'DD20240420007',
    platform: '拼多多',
    product: '保温杯',
    amount: 79,
    status: 'pending',
    time: '2024-04-20 13:20:18',
  },
  {
    id: 'DD20240420008',
    platform: '抖店',
    product: '数据线',
    amount: 29,
    status: 'processing',
    time: '2024-04-20 13:10:45',
  },
];

// Mock data for system status
const systemStatus = [
  { name: 'CPU', value: 45, status: 'normal' },
  { name: '内存', value: 68, status: 'warning' },
  { name: '磁盘', value: 32, status: 'normal' },
];

// Mock data for todos
const todoList = [
  { id: 1, text: '处理退款申请 #RF20240420001', completed: false, priority: 'high' },
  { id: 2, text: '回复客户咨询关于发货时间', completed: false, priority: 'medium' },
  { id: 3, text: '更新商品价格', completed: true, priority: 'low' },
  { id: 4, text: '处理库存预警', completed: false, priority: 'high' },
  { id: 5, text: '导出周报数据', completed: false, priority: 'medium' },
];

// Mini trend chart component - simplified CSS-based visualization
function MiniTrendChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', height: 40, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

// Order trend chart component - simplified bar chart
function OrderTrendChart() {
  const maxOrders = Math.max(...orderTrendData.map(d => d.orders));
  const maxSales = Math.max(...orderTrendData.map(d => d.sales));
  
  return (
    <div style={{ width: '100%', height: 280, padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#4080FF', borderRadius: 2 }}></div>
          <span style={{ color: '#86909C', fontSize: 12 }}>订单数</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#00B42A', borderRadius: 2 }}></div>
          <span style={{ color: '#86909C', fontSize: 12 }}>销售额</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8 }}>
        {orderTrendData.map((item, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: 4, width: '100%', justifyContent: 'center' }}>
              <div
                style={{
                  width: 16,
                  height: `${(item.orders / maxOrders) * 100}%`,
                  backgroundColor: '#4080FF',
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.3s',
                }}
                title={`订单数: ${item.orders}`}
              />
              <div
                style={{
                  width: 16,
                  height: `${(item.sales / maxSales) * 100}%`,
                  backgroundColor: '#00B42A',
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 0.3s',
                }}
                title={`销售额: ¥${item.sales.toLocaleString()}`}
              />
            </div>
            <div style={{ color: '#86909C', fontSize: 12, marginTop: 8 }}>{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Platform pie chart component - simplified CSS-based visualization
function PlatformPieChart() {
  const total = platformSalesData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const segments = platformSalesData.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    // Calculate SVG arc path
    const radius = 80;
    const innerRadius = 40;
    const cx = 100;
    const cy = 100;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    
    return {
      ...item,
      path,
      color: ['#4080FF', '#FF7D00', '#F53F3F', '#00B42A', '#722ED1'][index],
    };
  });

  return (
    <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="#1F2937"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <div style={{ color: '#86909C', fontSize: 12 }}>销售占比</div>
        </div>
      </div>
      <div style={{ marginLeft: 24, flex: 1 }}>
        {platformSalesData.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              width: 12,
              height: 12,
              backgroundColor: ['#4080FF', '#FF7D00', '#F53F3F', '#00B42A', '#722ED1'][index],
              borderRadius: 2,
              marginRight: 8,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 13 }}>{item.platform}</div>
              <div style={{ color: '#86909C', fontSize: 12 }}>{item.value}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Get platform tag color
function getPlatformColor(platform) {
  const colors = {
    '抖店': 'blue',
    '快手': 'orange',
    '拼多多': 'red',
    '闲鱼': 'green',
  };
  return colors[platform] || 'gray';
}

// Get order status text and color
function getOrderStatusInfo(status) {
  const statusMap = {
    pending: { text: '待处理', color: 'orange', icon: <IconClockCircle /> },
    processing: { text: '处理中', color: 'blue', icon: <IconClockCircle /> },
    shipped: { text: '已发货', color: 'cyan', icon: <IconCheckCircle /> },
    delivered: { text: '已送达', color: 'green', icon: <IconCheckCircle /> },
    cancelled: { text: '已取消', color: 'red', icon: <IconExclamationCircle /> },
    refunded: { text: '已退款', color: 'purple', icon: <IconExclamationCircle /> },
  };
  return statusMap[status] || { text: status, color: 'gray', icon: null };
}

// Get todo priority color
function getPriorityColor(priority) {
  const colors = {
    high: '#F53F3F',
    medium: '#FF7D00',
    low: '#00B42A',
  };
  return colors[priority] || '#86909C';
}

export default function Dashboard() {
  const [todos, setTodos] = useState(todoList);

  // Generate mini trend data
  const getMiniTrendData = (baseValue, variance) => {
    return Array.from({ length: 7 }, (_, i) => ({
      date: `Day${i + 1}`,
      value: baseValue + Math.random() * variance - variance / 2,
    }));
  };

  // Table columns
  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      width: 160,
      render: (value) => (
        <Text copyable={{ text: value }} style={{ fontFamily: 'monospace' }}>
          {value}
        </Text>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 100,
      render: (value) => (
        <Tag color={getPlatformColor(value)} bordered>
          {value}
        </Tag>
      ),
    },
    {
      title: '商品',
      dataIndex: 'product',
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 100,
      render: (value) => (
        <Text style={{ color: '#F53F3F', fontWeight: 500 }}>
          ¥{value.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => {
        const statusInfo = getOrderStatusInfo(value);
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'time',
      width: 160,
      render: (value) => (
        <Text style={{ color: '#86909C', fontSize: 13 }}>{value}</Text>
      ),
    },
  ];

  // Toggle todo
  const toggleTodo = (id) => {
    setTodos(todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#12131a' }}>
      <Title heading={4} style={{ marginBottom: 24, color: '#fff' }}>
        数据概览
      </Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statisticsData.map((item, index) => (
          <Col span={6} key={index}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <Text style={{ color: '#86909C', fontSize: 13, display: 'block', marginBottom: 8 }}>
                    {item.title}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: 600,
                        background: `linear-gradient(90deg, ${item.gradientColor[0]}, ${item.gradientColor[1]})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {item.value.toLocaleString()}
                    </Text>
                    {item.suffix && (
                      <Text style={{ color: '#86909C', fontSize: 14 }}>{item.suffix}</Text>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.prefix}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={4}>
                  {item.trend === 'up' ? (
                    <IconArrowRise style={{ color: '#00B42A' }} />
                  ) : (
                    <IconArrowFall style={{ color: '#F53F3F' }} />
                  )}
                  <Text
                    style={{
                      color: item.trend === 'up' ? '#00B42A' : '#F53F3F',
                      fontSize: 13,
                    }}
                  >
                    {item.trendValue}%
                  </Text>
                  <Text style={{ color: '#86909C', fontSize: 12 }}>同比</Text>
                </Space>
                <MiniTrendChart
                  data={getMiniTrendData(item.value / 7, item.value / 10)}
                  color={item.color}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <IconTag style={{ color: '#4080FF' }} />
                <Text style={{ color: '#fff' }}>订单趋势</Text>
                <Tag color="arcoblue" size="small">近7天</Tag>
              </Space>
            }
            style={{
              background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            headerStyle={{ borderBottom: '1px solid #303650' }}
            bodyStyle={{ padding: '20px' }}
          >
            <OrderTrendChart />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                <IconFire style={{ color: '#00B42A' }} />
                <Text style={{ color: '#fff' }}>平台销售占比</Text>
              </Space>
            }
            style={{
              background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            headerStyle={{ borderBottom: '1px solid #303650' }}
            bodyStyle={{ padding: '20px' }}
          >
            <PlatformPieChart />
          </Card>
        </Col>
      </Row>

      {/* Bottom Row: Orders Table + System Status + Todos */}
      <Row gutter={[16, 16]}>
        {/* Latest Orders Table */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <IconFile style={{ color: '#FF7D00' }} />
                <Text style={{ color: '#fff' }}>最新订单</Text>
                <Tag color="orangered" size="small">{latestOrders.length}条</Tag>
              </Space>
            }
            extra={
              <Button type="text" size="small" style={{ color: '#4080FF' }}>
                查看全部
              </Button>
            }
            style={{
              background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            headerStyle={{ borderBottom: '1px solid #303650' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={columns}
              data={latestOrders}
              pagination={false}
              border={false}
              rowKey="id"
              style={{ width: '100%' }}
              stripe
              rowClassName={() => 'dashboard-table-row'}
            />
          </Card>
        </Col>

        {/* Right Column: System Status + Todos */}
        <Col span={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* System Status Card */}
            <Card
              title={
                <Space>
                  <IconExclamationCircle style={{ color: '#722ED1' }} />
                  <Text style={{ color: '#fff' }}>系统状态</Text>
                </Space>
              }
              style={{
                background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              headerStyle={{ borderBottom: '1px solid #303650' }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {systemStatus.map((item, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#86909C', fontSize: 13 }}>{item.name}</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{item.value}%</Text>
                    </div>
                    <Progress
                      percent={item.value}
                      status={item.status === 'warning' ? 'warning' : 'success'}
                      showText={false}
                      strokeWidth={8}
                      trailColor="#303650"
                      color={item.status === 'warning' ? '#FF7D00' : '#00B42A'}
                    />
                  </div>
                ))}
              </Space>
            </Card>

            {/* Todo List Card */}
            <Card
              title={
                <Space>
                  <IconCheckCircle style={{ color: '#00B42A' }} />
                  <Text style={{ color: '#fff' }}>待办事项</Text>
                  <Tag color="green" size="small">
                    {todos.filter((t) => !t.completed).length}项待处理
                  </Tag>
                </Space>
              }
              style={{
                background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
              headerStyle={{ borderBottom: '1px solid #303650' }}
              bodyStyle={{ padding: '12px 0' }}
            >
              <List
                dataSource={todos}
                render={(item, index) => (
                  <List.Item
                    key={item.id}
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      background: item.completed ? 'transparent' : undefined,
                    }}
                    onClick={() => toggleTodo(item.id)}
                    actionList={[
                      <div
                        key="priority"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: getPriorityColor(item.priority),
                        }}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: `2px solid ${item.completed ? '#00B42A' : '#303650'}`,
                            background: item.completed ? '#00B42A' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          {item.completed && (
                            <IconCheckCircle style={{ color: '#fff', fontSize: 14 }} />
                          )}
                        </div>
                      }
                      title={
                        <Text
                          style={{
                            color: item.completed ? '#86909C' : '#fff',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            fontSize: 13,
                          }}
                        >
                          {item.text}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Global styles for table */}
      <style>{`
        .dashboard-table-row {
          background: transparent !important;
        }
        .dashboard-table-row:hover {
          background: rgba(64, 128, 255, 0.05) !important;
        }
        .arco-table-th {
          background: rgba(30, 32, 48, 0.8) !important;
          color: #86909C !important;
          font-weight: 500 !important;
          border-bottom: 1px solid #303650 !important;
        }
        .arco-table-td {
          border-bottom: 1px solid #303650 !important;
          color: #fff !important;
        }
        .arco-table-tr:last-child .arco-table-td {
          border-bottom: none !important;
        }
        .arco-list-item:hover {
          background: rgba(64, 128, 255, 0.05) !important;
        }
        .arco-card-header-title {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}