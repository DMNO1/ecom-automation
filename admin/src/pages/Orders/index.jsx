import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  Drawer,
  Descriptions,
  Timeline,
  Steps,
  Tabs,
  Typography,
  Divider,
  Badge,
  Avatar,
  Tooltip,
  message,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  PrinterOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CopyOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;

// 模拟订单数据
const generateOrders = (count = 80) => {
  const platforms = [
    { key: 'douyin', name: '抖音', color: '#165DFF' },
    { key: 'pdd', name: '拼多多', color: '#F53F3F' },
    { key: 'xianyu', name: '闲鱼', color: '#FF7D00' },
    { key: 'kuaishou', name: '快手', color: '#722ED1' },
  ];
  const statuses = [
    { key: 'pending', label: '待付款', color: 'default', step: 0 },
    { key: 'paid', label: '待发货', color: 'processing', step: 1 },
    { key: 'shipped', label: '已发货', color: 'warning', step: 2 },
    { key: 'completed', label: '已完成', color: 'success', step: 3 },
    { key: 'refunding', label: '退款中', color: 'error', step: -1 },
    { key: 'refunded', label: '已退款', color: 'default', step: -1 },
    { key: 'cancelled', label: '已取消', color: 'default', step: -1 },
  ];
  const products = [
    '蓝牙耳机A1', '智能手表S2', '充电宝10000mAh', '手机壳透明款', '数据线快充',
    '无线鼠标M1', '机械键盘K3', '显示器支架', 'USB集线器', '移动硬盘1T',
  ];
  const customers = [
    '张三', '李四', '王五', '赵六', '钱七',
    '孙八', '周九', '吴十', '郑十一', '王十二',
  ];
  const phones = ['138****1234', '139****5678', '136****9012', '137****3456', '135****7890'];

  const orders = [];
  for (let i = 1; i <= count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const price = Math.floor(Math.random() * 300) + 50;
    const amount = price * quantity;
    const profit = Math.floor(amount * (0.2 + Math.random() * 0.3));

    orders.push({
      id: `DD${String(i).padStart(8, '0')}`,
      orderNo: `${platform.key.toUpperCase()}${Date.now()}${String(i).padStart(4, '0')}`,
      platform: platform.key,
      platformName: platform.name,
      platformColor: platform.color,
      status: status.key,
      statusLabel: status.label,
      statusColor: status.color,
      statusStep: status.step,
      product,
      quantity,
      price,
      amount,
      profit,
      customer,
      phone,
      address: `${['北京市', '上海市', '广州市', '深圳市', '杭州市'][Math.floor(Math.random() * 5)]}某某区某某路${Math.floor(Math.random() * 100)}号`,
      logisticsNo: status.step >= 2 ? `SF${Math.floor(Math.random() * 10000000000)}` : null,
      logisticsCompany: status.step >= 2 ? '顺丰速运' : null,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: status.step >= 1 ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() : null,
      shippedAt: status.step >= 2 ? new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString() : null,
      completedAt: status.step >= 3 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : null,
      remark: Math.random() > 0.7 ? '请尽快发货' : '',
    });
  }
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const Orders = () => {
  const [orders, setOrders] = useState(() => generateOrders(80));
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // 统计数据
  const stats = {
    total: orders.length,
    pendingShip: orders.filter(o => o.status === 'paid').length,
    pendingRefund: orders.filter(o => o.status === 'refunding').length,
    todayOrders: orders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }).length,
    todayRevenue: orders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }).reduce((sum, o) => sum + o.amount, 0),
  };

  // 筛选
  const [filters, setFilters] = useState({
    keyword: '',
    platform: 'all',
    status: 'all',
    dateRange: null,
  });

  // 处理筛选
  const handleFilter = (changedValues) => {
    setFilters({ ...filters, ...changedValues });
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      keyword: '',
      platform: 'all',
      status: 'all',
      dateRange: null,
    });
  };

  // 过滤订单
  const filteredOrders = orders.filter((order) => {
    if (filters.keyword && !order.orderNo.toLowerCase().includes(filters.keyword.toLowerCase()) && !order.customer.includes(filters.keyword)) {
      return false;
    }
    if (filters.platform !== 'all' && order.platform !== filters.platform) {
      return false;
    }
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      const orderDate = new Date(order.createdAt);
      if (orderDate < filters.dateRange[0].startOf('day').toDate() || orderDate > filters.dateRange[1].endOf('day').toDate()) {
        return false;
      }
    }
    if (activeTab !== 'all') {
      if (activeTab === 'pending' && order.status !== 'pending') return false;
      if (activeTab === 'paid' && order.status !== 'paid') return false;
      if (activeTab === 'shipped' && order.status !== 'shipped') return false;
      if (activeTab === 'refund' && !['refunding', 'refunded'].includes(order.status)) return false;
    }
    return true;
  });

  // 查看订单详情
  const handleView = (order) => {
    setCurrentOrder(order);
    setDrawerVisible(true);
  };

  // 发货
  const handleShip = (order) => {
    Modal.confirm({
      title: '确认发货',
      content: `确定要发货订单"${order.orderNo}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setOrders(orders.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                status: 'shipped', 
                statusLabel: '已发货', 
                statusColor: 'warning',
                statusStep: 2,
                logisticsNo: `SF${Math.floor(Math.random() * 10000000000)}`,
                logisticsCompany: '顺丰速运',
                shippedAt: new Date().toISOString(),
              } 
            : o
        ));
        message.success('发货成功');
      },
    });
  };

  // 处理退款
  const handleRefund = (order) => {
    Modal.confirm({
      title: '确认退款',
      content: `确定要退款订单"${order.orderNo}"吗？退款金额：¥${order.amount.toFixed(2)}`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setOrders(orders.map(o => 
          o.id === order.id 
            ? { 
                ...o, 
                status: 'refunded', 
                statusLabel: '已退款', 
                statusColor: 'default',
                statusStep: -1,
              } 
            : o
        ));
        message.success('退款成功');
      },
    });
  };

  // 批量发货
  const handleBatchShip = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择订单');
      return;
    }
    const pendingShipOrders = orders.filter(o => selectedRowKeys.includes(o.id) && o.status === 'paid');
    if (pendingShipOrders.length === 0) {
      message.warning('选中的订单中没有待发货订单');
      return;
    }
    Modal.confirm({
      title: '批量发货',
      content: `确定要发货选中的 ${pendingShipOrders.length} 个订单吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setOrders(orders.map(o => 
          selectedRowKeys.includes(o.id) && o.status === 'paid'
            ? { 
                ...o, 
                status: 'shipped', 
                statusLabel: '已发货', 
                statusColor: 'warning',
                statusStep: 2,
                logisticsNo: `SF${Math.floor(Math.random() * 10000000000)}`,
                logisticsCompany: '顺丰速运',
                shippedAt: new Date().toISOString(),
              } 
            : o
        ));
        setSelectedRowKeys([]);
        message.success(`成功发货 ${pendingShipOrders.length} 个订单`);
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '订单信息',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 280,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Space size="small">
            <Tag color={record.platformColor}>{record.platformName}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(record.createdAt).toLocaleString()}
            </Text>
          </Space>
        </div>
      ),
    },
    {
      title: '商品',
      dataIndex: 'product',
      key: 'product',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>{text}</div>
          <Text type="secondary">x{record.quantity}</Text>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: (a, b) => a.amount - b.amount,
      render: (val, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#165DFF' }}>¥{val.toFixed(2)}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>利润: ¥{record.profit.toFixed(2)}</Text>
        </div>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
      render: (text, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      key: 'status',
      width: 100,
      render: (text, record) => (
        <Tag color={record.statusColor}>{text}</Tag>
      ),
    },
    {
      title: '物流',
      dataIndex: 'logisticsNo',
      key: 'logistics',
      width: 150,
      render: (text, record) => (
        text ? (
          <div>
            <div style={{ marginBottom: 4 }}>{record.logisticsCompany}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>
          </div>
        ) : '-'
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          {record.status === 'paid' && (
            <Tooltip title="发货">
              <Button type="text" icon={<TruckOutlined />} onClick={() => handleShip(record)} />
            </Tooltip>
          )}
          {record.status === 'refunding' && (
            <Tooltip title="退款">
              <Button type="text" icon={<DollarOutlined />} onClick={() => handleRefund(record)} />
            </Tooltip>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'copy', icon: <CopyOutlined />, label: '复制订单号' },
                { key: 'print', icon: <PrinterOutlined />, label: '打印订单' },
                { key: 'message', icon: <MessageOutlined />, label: '联系客户' },
              ],
              onClick: ({ key }) => {
                if (key === 'copy') {
                  navigator.clipboard.writeText(record.orderNo);
                  message.success('订单号已复制');
                } else if (key === 'print') {
                  message.success('正在打印...');
                } else if (key === 'message') {
                  message.success('正在打开聊天窗口...');
                }
              },
            }}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      disabled: !['pending', 'paid'].includes(record.status),
    }),
  };

  return (
    <div className="orders-page">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="待发货"
              value={stats.pendingShip}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#FF7D00' }}
            />
            <div style={{ marginTop: 8 }}>
              <Button type="link" size="small" style={{ padding: 0 }}>
                去处理 →
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="待处理退款"
              value={stats.pendingRefund}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#F53F3F' }}
            />
            <div style={{ marginTop: 8 }}>
              <Button type="link" size="small" style={{ padding: 0 }} danger>
                去处理 →
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="今日订单"
              value={stats.todayOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              较昨日 +8.5%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="今日营收"
              value={stats.todayRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#00B42A' }}
              formatter={(val) => `¥${Number(val).toLocaleString()}`}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              较昨日 +12.3%
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space size="middle" wrap>
              <Input
                placeholder="搜索订单号/客户"
                prefix={<SearchOutlined />}
                style={{ width: 220 }}
                value={filters.keyword}
                onChange={(e) => handleFilter({ keyword: e.target.value })}
                allowClear
              />
              <Select
                placeholder="平台"
                style={{ width: 120 }}
                value={filters.platform}
                onChange={(val) => handleFilter({ platform: val })}
              >
                <Option value="all">全部平台</Option>
                <Option value="douyin">抖音</Option>
                <Option value="pdd">拼多多</Option>
                <Option value="xianyu">闲鱼</Option>
                <Option value="kuaishou">快手</Option>
              </Select>
              <Select
                placeholder="状态"
                style={{ width: 100 }}
                value={filters.status}
                onChange={(val) => handleFilter({ status: val })}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待付款</Option>
                <Option value="paid">待发货</Option>
                <Option value="shipped">已发货</Option>
                <Option value="completed">已完成</Option>
                <Option value="refunding">退款中</Option>
              </Select>
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                value={filters.dateRange}
                onChange={(val) => handleFilter({ dateRange: val })}
              />
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ExportOutlined />}>导出</Button>
              <Button icon={<PrinterOutlined />}>批量打印</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 订单表格 */}
      <Card bordered={false}>
        {/* 标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
          <TabPane tab="全部订单" key="all" />
          <TabPane tab="待付款" key="pending" />
          <TabPane tab="待发货" key="paid" />
          <TabPane tab="已发货" key="shipped" />
          <TabPane tab="退款/售后" key="refund" />
        </Tabs>

        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#E6F7FF',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>
              已选择 <Text strong>{selectedRowKeys.length}</Text> 个订单
            </span>
            <Space>
              <Button size="small" icon={<TruckOutlined />} onClick={handleBatchShip}>
                批量发货
              </Button>
              <Button size="small" icon={<PrinterOutlined />}>
                批量打印
              </Button>
              <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          rowSelection={rowSelection}
          loading={loading}
          pagination={{
            total: filteredOrders.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 订单详情抽屉 */}
      <Drawer
        title="订单详情"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {currentOrder?.status === 'paid' && (
              <Button type="primary" onClick={() => {
                setDrawerVisible(false);
                handleShip(currentOrder);
              }}>
                发货
              </Button>
            )}
            <Button onClick={() => setDrawerVisible(false)}>
              关闭
            </Button>
          </Space>
        }
      >
        {currentOrder && (
          <div>
            {/* 订单状态步骤条 */}
            {currentOrder.statusStep >= 0 ? (
              <Steps current={currentOrder.statusStep} size="small" style={{ marginBottom: 24 }}>
                <Step title="待付款" />
                <Step title="待发货" />
                <Step title="已发货" />
                <Step title="已完成" />
              </Steps>
            ) : (
              <div style={{ 
                marginBottom: 24, 
                padding: 16, 
                background: '#FFF1F0', 
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <Tag color={currentOrder.statusColor} style={{ fontSize: 14 }}>
                  {currentOrder.statusLabel}
                </Tag>
              </div>
            )}

            <Descriptions title="订单信息" bordered column={2}>
              <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="平台">
                <Tag color={currentOrder.platformColor}>{currentOrder.platformName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={currentOrder.statusColor}>{currentOrder.statusLabel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {new Date(currentOrder.createdAt).toLocaleString()}
              </Descriptions.Item>
              {currentOrder.paidAt && (
                <Descriptions.Item label="付款时间">
                  {new Date(currentOrder.paidAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {currentOrder.shippedAt && (
                <Descriptions.Item label="发货时间">
                  {new Date(currentOrder.shippedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="商品信息" bordered column={1}>
              <Descriptions.Item label="商品名称">{currentOrder.product}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentOrder.quantity}</Descriptions.Item>
              <Descriptions.Item label="单价">¥{currentOrder.price.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="总价">
                <Text strong style={{ color: '#165DFF', fontSize: 16 }}>
                  ¥{currentOrder.amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="利润">
                <Text style={{ color: '#00B42A' }}>¥{currentOrder.profit.toFixed(2)}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="客户信息" bordered column={1}>
              <Descriptions.Item label="客户姓名">{currentOrder.customer}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.phone}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{currentOrder.address}</Descriptions.Item>
              {currentOrder.remark && (
                <Descriptions.Item label="备注">{currentOrder.remark}</Descriptions.Item>
              )}
            </Descriptions>

            {currentOrder.logisticsNo && (
              <>
                <Divider />
                <Descriptions title="物流信息" bordered column={1}>
                  <Descriptions.Item label="物流公司">{currentOrder.logisticsCompany}</Descriptions.Item>
                  <Descriptions.Item label="物流单号">{currentOrder.logisticsNo}</Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider />

            <Title level={5}>订单日志</Title>
            <Timeline style={{ marginTop: 16 }}>
              <Timeline.Item color="green">
                {new Date(currentOrder.createdAt).toLocaleString()} - 订单创建
              </Timeline.Item>
              {currentOrder.paidAt && (
                <Timeline.Item color="green">
                  {new Date(currentOrder.paidAt).toLocaleString()} - 买家已付款
                </Timeline.Item>
              )}
              {currentOrder.shippedAt && (
                <Timeline.Item color="blue">
                  {new Date(currentOrder.shippedAt).toLocaleString()} - 卖家已发货
                </Timeline.Item>
              )}
              {currentOrder.completedAt && (
                <Timeline.Item color="green">
                  {new Date(currentOrder.completedAt).toLocaleString()} - 订单完成
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Orders;