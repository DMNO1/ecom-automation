import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Tag, Progress, Tabs, DatePicker, Select, Space, Button, 
  List, Avatar, Typography, Divider, Alert, Radio, Tooltip, Dropdown, Menu
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  EyeOutlined,
  PercentageOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  SyncOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { Line, Pie, Column, Funnel, Bar } from '@ant-design/plots';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 模拟数据生成函数
const generateDailyData = (days = 30) => {
  const data = [];
  const baseDate = dayjs().subtract(days, 'day');
  
  for (let i = 0; i < days; i++) {
    const date = baseDate.add(i, 'day').format('YYYY-MM-DD');
    data.push({
      date,
      visitors: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 200) + 50,
      conversionRate: (Math.random() * 5 + 2).toFixed(2),
      avgOrderValue: Math.floor(Math.random() * 300) + 100,
      refundRate: (Math.random() * 3 + 0.5).toFixed(2),
      revenue: Math.floor(Math.random() * 50000) + 10000,
    });
  }
  return data;
};

// 平台数据
const platformData = [
  { platform: '抖音', orders: 1245, revenue: 125680, percentage: 35 },
  { platform: '拼多多', orders: 986, revenue: 89420, percentage: 25 },
  { platform: '闲鱼', orders: 754, revenue: 67850, percentage: 20 },
  { platform: '快手', orders: 632, revenue: 58790, percentage: 20 },
];

// 热销商品数据
const hotProducts = [
  { key: '1', name: '蓝牙耳机A1', sales: 256, revenue: 25600, growth: 12.5, stock: 85 },
  { key: '2', name: '智能手表S2', sales: 189, revenue: 37800, growth: 8.2, stock: 42 },
  { key: '3', name: '充电宝10000mAh', sales: 167, revenue: 16700, growth: -2.1, stock: 120 },
  { key: '4', name: '手机壳透明款', sales: 145, revenue: 7250, growth: 5.7, stock: 200 },
  { key: '5', name: '数据线快充', sales: 132, revenue: 6600, growth: 3.4, stock: 150 },
  { key: '6', name: '无线鼠标M1', sales: 98, revenue: 9800, growth: 7.8, stock: 65 },
  { key: '7', name: '键盘机械款', sales: 87, revenue: 17400, growth: 15.2, stock: 30 },
  { key: '8', name: '耳机保护套', sales: 76, revenue: 3800, growth: -1.5, stock: 180 },
  { key: '9', name: '手机支架', sales: 65, revenue: 3250, growth: 2.3, stock: 95 },
  { key: '10', name: '屏幕清洁套装', sales: 54, revenue: 2700, growth: 0.8, stock: 110 },
];

// 流量来源数据
const trafficSourceData = [
  { source: '自然搜索', visitors: 4500, percentage: 35 },
  { source: '付费推广', visitors: 3200, percentage: 25 },
  { source: '社交媒体', visitors: 2800, percentage: 22 },
  { source: '直接访问', visitors: 1500, percentage: 12 },
  { source: '其他', visitors: 800, percentage: 6 },
];

// 转化漏斗数据
const funnelData = [
  { stage: '访问', count: 10000, percentage: 100 },
  { stage: '浏览商品', count: 6500, percentage: 65 },
  { stage: '加入购物车', count: 2800, percentage: 28 },
  { stage: '提交订单', count: 1200, percentage: 12 },
  { stage: '支付成功', count: 800, percentage: 8 },
];

// 客户增长数据
const customerGrowthData = [];
for (let i = 0; i < 12; i++) {
  const month = dayjs().subtract(11 - i, 'month').format('YYYY-MM');
  customerGrowthData.push({
    month,
    newCustomers: Math.floor(Math.random() * 500) + 200,
    totalCustomers: 5000 + i * 300 + Math.floor(Math.random() * 200),
  });
}

// 客户价值分布数据
const customerValueData = [
  { value: '高价值客户', count: 1200, percentage: 24, revenue: 360000 },
  { value: '中价值客户', count: 2500, percentage: 50, revenue: 250000 },
  { value: '低价值客户', count: 1300, percentage: 26, revenue: 65000 },
];

export default function Analytics() {
  const [dailyData, setDailyData] = useState([]);
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState(null);

  useEffect(() => {
    // 模拟加载数据
    setLoading(true);
    setTimeout(() => {
      const days = dateRange === '1d' ? 1 : dateRange === 'yesterday' ? 1 : 
                   dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 7;
      setDailyData(generateDailyData(days));
      setLoading(false);
    }, 500);
  }, [dateRange]);

  // 计算核心指标
  const totalVisitors = dailyData.reduce((sum, item) => sum + item.visitors, 0);
  const totalOrders = dailyData.reduce((sum, item) => sum + item.orders, 0);
  const avgConversionRate = dailyData.length > 0 ? 
    (dailyData.reduce((sum, item) => sum + parseFloat(item.conversionRate), 0) / dailyData.length).toFixed(2) : 0;
  const avgOrderValue = dailyData.length > 0 ? 
    Math.round(dailyData.reduce((sum, item) => sum + item.avgOrderValue, 0) / dailyData.length) : 0;
  const avgRefundRate = dailyData.length > 0 ? 
    (dailyData.reduce((sum, item) => sum + parseFloat(item.refundRate), 0) / dailyData.length).toFixed(2) : 0;

  // 销售趋势图配置
  const salesTrendConfig = {
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
      formatter: (datum) => {
        return { name: '销售额', value: `¥${datum.revenue.toLocaleString()}` };
      },
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
  const platformPieConfig = {
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
    statistic: {
      title: {
        style: {
          color: '#8c8c8c',
          fontSize: '12px',
          lineHeight: '14px',
          textAlign: 'center',
        },
        content: '总占比',
      },
      content: {
        style: {
          color: '#000',
          fontSize: '16px',
          lineHeight: '16px',
          textAlign: 'center',
        },
        content: '100%',
      },
    },
  };

  // 流量趋势图配置
  const trafficTrendConfig = {
    data: dailyData,
    xField: 'date',
    yField: 'visitors',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    line: {
      color: '#00B42A',
      lineWidth: 2,
    },
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#e6ffe6 1:#00B42A',
      },
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => {
        return { name: '访客数', value: datum.visitors.toLocaleString() };
      },
    },
  };

  // 流量来源图配置
  const trafficSourcePieConfig = {
    data: trafficSourceData,
    angleField: 'percentage',
    colorField: 'source',
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
    color: ['#165DFF', '#00B42A', '#FF7D00', '#722ED1', '#F53F3F'],
  };

  // 转化漏斗图配置
  const funnelConfig = {
    data: funnelData,
    xField: 'stage',
    yField: 'count',
    label: {
      formatter: (datum) => {
        return `${datum.stage}: ${datum.count} (${datum.percentage}%)`;
      },
    },
    colorField: 'stage',
    color: ['#165DFF', '#4080FF', '#6AAEFF', '#94BBFF', '#BDD7FF'],
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // 客户增长趋势图配置
  const customerGrowthConfig = {
    data: customerGrowthData,
    xField: 'month',
    yField: 'newCustomers',
    point: {
      size: 3,
      shape: 'circle',
    },
    smooth: true,
    line: {
      color: '#722ED1',
      lineWidth: 2,
    },
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#f9f0ff 1:#722ED1',
      },
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => {
        return { name: '新增客户', value: datum.newCustomers };
      },
    },
  };

  // 客户价值分布图配置
  const customerValuePieConfig = {
    data: customerValueData,
    angleField: 'percentage',
    colorField: 'value',
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
    color: ['#F53F3F', '#FF7D00', '#00B42A'],
    statistic: {
      title: {
        style: {
          color: '#8c8c8c',
          fontSize: '12px',
          lineHeight: '14px',
          textAlign: 'center',
        },
        content: '客户价值',
      },
      content: {
        style: {
          color: '#000',
          fontSize: '16px',
          lineHeight: '16px',
          textAlign: 'center',
        },
        content: '分布',
      },
    },
  };

  // 热销商品表格列配置
  const hotProductsColumns = [
    {
      title: '排名',
      dataIndex: 'key',
      key: 'rank',
      width: 60,
      render: (text, record, index) => (
        <Tag color={index < 3 ? '#165DFF' : 'default'}>{index + 1}</Tag>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      sorter: (a, b) => a.sales - b.sales,
    },
    {
      title: '销售额',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '增长率',
      dataIndex: 'growth',
      key: 'growth',
      render: (val) => (
        <Tag color={val >= 0 ? 'green' : 'red'}>
          {val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(val)}%
        </Tag>
      ),
      sorter: (a, b) => a.growth - b.growth,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (val) => (
        <Progress 
          percent={Math.min(val, 100)} 
          size="small" 
          status={val < 30 ? 'exception' : val < 60 ? 'normal' : 'success'}
          format={() => val}
        />
      ),
    },
  ];

  // 商品销售排行表格列配置
  const productRankingColumns = [
    {
      title: '排名',
      dataIndex: 'key',
      key: 'rank',
      width: 60,
      render: (text, record, index) => (
        <Tag color={index < 3 ? '#165DFF' : 'default'}>{index + 1}</Tag>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      sorter: (a, b) => a.sales - b.sales,
    },
    {
      title: '销售额',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '库存周转天数',
      key: 'turnover',
      render: (_, record) => {
        const turnoverDays = Math.floor(Math.random() * 30) + 5;
        return (
          <Tag color={turnoverDays < 15 ? 'green' : turnoverDays < 30 ? 'orange' : 'red'}>
            {turnoverDays}天
          </Tag>
        );
      },
    },
    {
      title: '动销率',
      key: 'sellThrough',
      render: () => {
        const rate = Math.floor(Math.random() * 40) + 60;
        return (
          <Progress 
            percent={rate} 
            size="small" 
            strokeColor={rate > 80 ? '#00B42A' : rate > 60 ? '#FF7D00' : '#F53F3F'}
          />
        );
      },
    },
  ];

  // 库存周转分析表格列配置
  const inventoryTurnoverColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '日均销量',
      key: 'dailySales',
      render: () => Math.floor(Math.random() * 10) + 1,
    },
    {
      title: '库存周转天数',
      key: 'turnoverDays',
      render: (_, record) => {
        const turnoverDays = Math.floor(record.stock / (Math.floor(Math.random() * 10) + 1));
        return (
          <Tag color={turnoverDays < 15 ? 'green' : turnoverDays < 30 ? 'orange' : 'red'}>
            {turnoverDays}天
          </Tag>
        );
      },
    },
    {
      title: '库存状态',
      key: 'status',
      render: (_, record) => {
        const turnoverDays = Math.floor(record.stock / (Math.floor(Math.random() * 10) + 1));
        if (turnoverDays < 7) return <Tag color="red">库存紧张</Tag>;
        if (turnoverDays < 15) return <Tag color="orange">需补货</Tag>;
        if (turnoverDays < 30) return <Tag color="blue">正常</Tag>;
        return <Tag color="green">充足</Tag>;
      },
    },
  ];

  // 客户价值分布表格列配置
  const customerValueColumns = [
    {
      title: '客户类型',
      dataIndex: 'value',
      key: 'value',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '客户数量',
      dataIndex: 'count',
      key: 'count',
      render: (val) => val.toLocaleString(),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val) => (
        <Progress 
          percent={val} 
          size="small" 
          strokeColor={val > 40 ? '#165DFF' : val > 20 ? '#00B42A' : '#FF7D00'}
        />
      ),
    },
    {
      title: '贡献收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `¥${val.toLocaleString()}`,
    },
    {
      title: '人均消费',
      key: 'avgConsumption',
      render: (_, record) => `¥${Math.round(record.revenue / record.count).toLocaleString()}`,
    },
  ];

  // 时间筛选菜单
  const dateMenu = (
    <Menu onClick={({ key }) => setDateRange(key)}>
      <Menu.Item key="1d">今日</Menu.Item>
      <Menu.Item key="yesterday">昨日</Menu.Item>
      <Menu.Item key="7d">近7天</Menu.Item>
      <Menu.Item key="15d">近15天</Menu.Item>
      <Menu.Item key="30d">近30天</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="custom">自定义</Menu.Item>
    </Menu>
  );

  return (
    <div className="analytics" style={{ padding: 24 }}>
      {/* 顶部操作栏 */}
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Title level={4} style={{ margin: 0 }}>
          <LineChartOutlined style={{ marginRight: 8, color: '#165DFF' }} />
          数据中心
        </Title>
        <Space wrap>
          <Dropdown overlay={dateMenu} trigger={['click']}>
            <Button icon={<CalendarOutlined />}>
              {dateRange === '1d' ? '今日' : 
               dateRange === 'yesterday' ? '昨日' : 
               dateRange === '7d' ? '近7天' : 
               dateRange === '15d' ? '近15天' : 
               dateRange === '30d' ? '近30天' : '自定义'}
            </Button>
          </Dropdown>
          {dateRange === 'custom' && (
            <RangePicker 
              onChange={(dates) => setCustomDateRange(dates)}
              style={{ width: 240 }}
            />
          )}
          <Select 
            defaultValue="all" 
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
          <Button icon={<DownloadOutlined />}>
            导出报表
          </Button>
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card 
            loading={loading}
            style={{ borderRadius: 8 }}
            hoverable
          >
            <Statistic
              title={
                <Space>
                  <EyeOutlined style={{ color: '#165DFF' }} />
                  <span>访客数</span>
                </Space>
              }
              value={totalVisitors}
              valueStyle={{ color: '#165DFF', fontSize: 24 }}
              prefix={<ArrowUpOutlined />}
              suffix={
                <Tag color="green" style={{ marginLeft: 8 }}>
                  +12.5%
                </Tag>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">日均: {Math.round(totalVisitors / (dailyData.length || 1)).toLocaleString()}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card 
            loading={loading}
            style={{ borderRadius: 8 }}
            hoverable
          >
            <Statistic
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: '#00B42A' }} />
                  <span>订单量</span>
                </Space>
              }
              value={totalOrders}
              valueStyle={{ color: '#00B42A', fontSize: 24 }}
              prefix={<ArrowUpOutlined />}
              suffix={
                <Tag color="green" style={{ marginLeft: 8 }}>
                  +8.2%
                </Tag>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">日均: {Math.round(totalOrders / (dailyData.length || 1))}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card 
            loading={loading}
            style={{ borderRadius: 8 }}
            hoverable
          >
            <Statistic
              title={
                <Space>
                  <PercentageOutlined style={{ color: '#FF7D00' }} />
                  <span>转化率</span>
                </Space>
              }
              value={avgConversionRate}
              precision={2}
              valueStyle={{ color: '#FF7D00', fontSize: 24 }}
              suffix="%"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">行业平均: 3.2%</Text>
              <Tag color={parseFloat(avgConversionRate) > 3.2 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                {parseFloat(avgConversionRate) > 3.2 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(parseFloat(avgConversionRate) - 3.2).toFixed(2)}%
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card 
            loading={loading}
            style={{ borderRadius: 8 }}
            hoverable
          >
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#722ED1' }} />
                  <span>客单价</span>
                </Space>
              }
              value={avgOrderValue}
              valueStyle={{ color: '#722ED1', fontSize: 24 }}
              prefix="¥"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">行业平均: ¥150</Text>
              <Tag color={avgOrderValue > 150 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                {avgOrderValue > 150 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(avgOrderValue - 150)}元
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card 
            loading={loading}
            style={{ borderRadius: 8 }}
            hoverable
          >
            <Statistic
              title={
                <Space>
                  <FallOutlined style={{ color: '#F53F3F' }} />
                  <span>退款率</span>
                </Space>
              }
              value={avgRefundRate}
              precision={2}
              valueStyle={{ color: '#F53F3F', fontSize: 24 }}
              suffix="%"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">行业平均: 2.5%</Text>
              <Tag color={parseFloat(avgRefundRate) < 2.5 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                {parseFloat(avgRefundRate) < 2.5 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                {Math.abs(parseFloat(avgRefundRate) - 2.5).toFixed(2)}%
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 标签页切换 */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarStyle={{ marginBottom: 24 }}
        >
          {/* 销售分析 */}
          <TabPane 
            tab={
              <span>
                <DollarOutlined />
                销售分析
              </span>
            } 
            key="sales"
          >
            <Row gutter={[16, 16]}>
              {/* 销售趋势图 */}
              <Col xs={24} lg={16}>
                <Card 
                  title="销售趋势" 
                  loading={loading}
                  extra={
                    <Space>
                      <Tooltip title="销售额趋势">
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                      </Tooltip>
                    </Space>
                  }
                  style={{ borderRadius: 8 }}
                >
                  <Line {...salesTrendConfig} height={300} />
                </Card>
              </Col>
              
              {/* 销售构成饼图 */}
              <Col xs={24} lg={8}>
                <Card 
                  title="销售构成" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Pie {...platformPieConfig} height={300} />
                </Card>
              </Col>
              
              {/* 热销商品TOP10 */}
              <Col span={24}>
                <Card 
                  title="热销商品TOP10" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    columns={hotProductsColumns}
                    dataSource={hotProducts}
                    pagination={false}
                    size="middle"
                    rowKey="key"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 流量分析 */}
          <TabPane 
            tab={
              <span>
                <EyeOutlined />
                流量分析
              </span>
            } 
            key="traffic"
          >
            <Row gutter={[16, 16]}>
              {/* 流量趋势图 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="流量趋势" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Line {...trafficTrendConfig} height={300} />
                </Card>
              </Col>
              
              {/* 流量来源分布 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="流量来源分布" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Pie {...trafficSourcePieConfig} height={300} />
                </Card>
              </Col>
              
              {/* 转化漏斗 */}
              <Col span={24}>
                <Card 
                  title="转化漏斗" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Funnel {...funnelConfig} height={300} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 商品分析 */}
          <TabPane 
            tab={
              <span>
                <ShoppingOutlined />
                商品分析
              </span>
            } 
            key="products"
          >
            <Row gutter={[16, 16]}>
              {/* 商品销售排行 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="商品销售排行" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    columns={productRankingColumns}
                    dataSource={hotProducts.slice(0, 8)}
                    pagination={false}
                    size="middle"
                    rowKey="key"
                  />
                </Card>
              </Col>
              
              {/* 库存周转分析 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="库存周转分析" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    columns={inventoryTurnoverColumns}
                    dataSource={hotProducts.slice(0, 8)}
                    pagination={false}
                    size="middle"
                    rowKey="key"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 客户分析 */}
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                客户分析
              </span>
            } 
            key="customers"
          >
            <Row gutter={[16, 16]}>
              {/* 客户增长趋势 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="客户增长趋势" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Line {...customerGrowthConfig} height={300} />
                </Card>
              </Col>
              
              {/* 客户价值分布 */}
              <Col xs={24} lg={12}>
                <Card 
                  title="客户价值分布" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Pie {...customerValuePieConfig} height={300} />
                </Card>
              </Col>
              
              {/* 客户价值明细 */}
              <Col span={24}>
                <Card 
                  title="客户价值明细" 
                  loading={loading}
                  style={{ borderRadius: 8 }}
                >
                  <Table
                    columns={customerValueColumns}
                    dataSource={customerValueData}
                    pagination={false}
                    size="middle"
                    rowKey="value"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* 底部提示信息 */}
      <Alert
        message="数据更新时间"
        description={`数据最后更新于 ${dayjs().format('YYYY-MM-DD HH:mm:ss')}，数据每小时自动更新一次。`}
        type="info"
        showIcon
        style={{ marginTop: 24, borderRadius: 8 }}
      />
    </div>
  );
}