import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  Message,
  Drawer,
  Descriptions,
  Tabs,
  Badge,
  Dropdown,
  Menu,
} from '@arco-design/web-react';
import {
  IconSearch,
  IconRefresh,
  IconExport,
  IconEye,
  IconEdit,
  IconDelete,
  IconMoreVertical,
  IconShake,
  IconCheckCircle,
  IconClockCircle,
  IconCloseCircle,
  IconExclamationCircle,
  IconSend,
  IconStorage,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Order status configuration
const orderStatusMap = {
  pending: { label: '待付款', color: 'orange', icon: <IconClockCircle /> },
  paid: { label: '已付款', color: 'arcoblue', icon: <IconCheckCircle /> },
  shipped: { label: '已发货', color: 'cyan', icon: <IconSend /> },
  delivered: { label: '已签收', color: 'green', icon: <IconCheckCircle /> },
  cancelled: { label: '已取消', color: 'gray', icon: <IconCloseCircle /> },
  refunding: { label: '退款中', color: 'orangered', icon: <IconExclamationCircle /> },
  refunded: { label: '已退款', color: 'red', icon: <IconCloseCircle /> },
};

// Mock order data
const generateMockOrders = () => {
  const statuses = Object.keys(orderStatusMap);
  const platforms = ['淘宝', '京东', '拼多多', '抖音', '小红书'];
  const products = ['无线蓝牙耳机', '智能手表', '手机壳', '充电器', '数据线', '平板支架', '鼠标垫'];
  const customers = ['张三', '李四', '王五', '赵六', '陈七', '刘八'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `ORD${String(20240001 + i).padStart(8, '0')}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    customer: customers[Math.floor(Math.random() * customers.length)],
    product: products[Math.floor(Math.random() * products.length)],
    quantity: Math.floor(Math.random() * 5) + 1,
    amount: +(Math.random() * 500 + 20).toFixed(2),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createTime: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 3600 * 1000)).toISOString().slice(0, 19).replace('T', ' '),
    payTime: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 6 * 24 * 3600 * 1000)).toISOString().slice(0, 19).replace('T', ' ') : '-',
    address: `浙江省杭州市西湖区${Math.floor(Math.random() * 100) + 1}号`,
    phone: `1${3 + Math.floor(Math.random() * 7)}${String(Math.random()).slice(2, 11)}`,
    trackingNo: Math.random() > 0.4 ? `SF${String(Math.random()).slice(2, 15)}` : '-',
    remark: Math.random() > 0.7 ? '请尽快发货' : '',
  }));
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockOrders();
      setOrders(data);
      setPagination(prev => ({ ...prev, total: data.length }));
      setLoading(false);
    }, 500);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = !searchText ||
      order.id.includes(searchText) ||
      order.customer.includes(searchText) ||
      order.product.includes(searchText) ||
      order.trackingNo.includes(searchText);
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchPlatform = platformFilter === 'all' || order.platform === platformFilter;
    return matchSearch && matchStatus && matchPlatform;
  });

  // Status summary counts
  const statusCounts = Object.keys(orderStatusMap).reduce((acc, key) => {
    acc[key] = orders.filter(o => o.status === key).length;
    return acc;
  }, {});

  const handleViewDetail = (record) => {
    setCurrentOrder(record);
    setDetailVisible(true);
  };

  const handleBatchShip = () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要发货的订单');
      return;
    }
    Message.success(`已批量发货 ${selectedRowKeys.length} 个订单`);
    setSelectedRowKeys([]);
  };

  const handleBatchExport = () => {
    Message.info('正在导出订单数据...');
    setTimeout(() => Message.success('导出成功'), 1000);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockOrders();
      setOrders(data);
      setPagination(prev => ({ ...prev, total: data.length }));
      setLoading(false);
      Message.success('数据已刷新');
    }, 500);
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      width: 160,
      sorter: true,
      render: (value) => <Text copyable style={{ color: '#165dff' }}>{value}</Text>,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 80,
      render: (value) => {
        const colors = { '淘宝': '#ff4d00', '京东': '#e2231a', '拼多多': '#e02e24', '抖音': '#010101', '小红书': '#ff2442' };
        return <Tag color={colors[value] || 'gray'}>{value}</Tag>;
      },
    },
    {
      title: '客户',
      dataIndex: 'customer',
      width: 80,
    },
    {
      title: '商品',
      dataIndex: 'product',
      width: 140,
      ellipsis: true,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 60,
      align: 'center',
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      width: 100,
      sorter: (a, b) => a.amount - b.amount,
      render: (value) => <Text style={{ color: '#f53f3f', fontWeight: 600 }}>¥{value}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value) => {
        const config = orderStatusMap[value];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '下单时间',
      dataIndex: 'createTime',
      width: 170,
      sorter: (a, b) => new Date(a.createTime) - new Date(b.createTime),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<IconEye />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="edit"><IconEdit style={{ marginRight: 8 }} />编辑</Menu.Item>
                <Menu.Item key="ship"><IconSend style={{ marginRight: 8 }} />发货</Menu.Item>
                <Menu.Item key="refund" style={{ color: '#f53f3f' }}><IconDelete style={{ marginRight: 8 }} />退款</Menu.Item>
              </Menu>
            }
            position="br"
          >
            <Button type="text" size="small" icon={<IconMoreVertical />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title heading={4} style={{ margin: '0 0 16px 0' }}>订单管理</Title>

      {/* Status summary cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(orderStatusMap).map(([key, config]) => (
          <Col span={3} key={key}>
            <Card
              size="small"
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                borderColor: statusFilter === key ? config.color : undefined,
                borderWidth: statusFilter === key ? 2 : 1,
              }}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            >
              <div style={{ fontSize: 12, color: '#86909c', marginBottom: 4 }}>{config.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: `rgb(${config.color === 'gray' ? '134,144,156' : '22,93,255'})` }}>
                {statusCounts[key] || 0}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters and actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="center">
          <Col flex="auto">
            <Space wrap>
              <Input
                prefix={<IconSearch />}
                placeholder="搜索订单号/客户/商品/物流单号"
                value={searchText}
                onChange={setSearchText}
                style={{ width: 280 }}
                allowClear
              />
              <Select
                placeholder="平台筛选"
                value={platformFilter}
                onChange={setPlatformFilter}
                style={{ width: 120 }}
                options={[
                  { label: '全部平台', value: 'all' },
                  { label: '淘宝', value: '淘宝' },
                  { label: '京东', value: '京东' },
                  { label: '拼多多', value: '拼多多' },
                  { label: '抖音', value: '抖音' },
                  { label: '小红书', value: '小红书' },
                ]}
              />
              <RangePicker style={{ width: 240 }} placeholder={['开始日期', '结束日期']} />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<IconRefresh />} onClick={handleRefresh}>刷新</Button>
              <Button type="primary" icon={<IconSend />} onClick={handleBatchShip}>
                批量发货{selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
              </Button>
              <Button icon={<IconExport />} onClick={handleBatchExport}>导出</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Orders table */}
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          data={filteredOrders}
          pagination={{
            ...pagination,
            total: filteredOrders.length,
            showTotal: (total) => `共 ${total} 条`,
            showJumper: true,
            sizeCanChange: true,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 1200 }}
          stripe
        />
      </Card>

      {/* Order detail drawer */}
      <Drawer
        width={520}
        title="订单详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDetailVisible(false)} style={{ marginRight: 8 }}>关闭</Button>
            <Button type="primary" onClick={() => { Message.success('操作成功'); setDetailVisible(false); }}>确认发货</Button>
          </div>
        }
      >
        {currentOrder && (
          <div>
            <Descriptions
              column={1}
              title="基本信息"
              data={[
                { label: '订单编号', value: currentOrder.id },
                { label: '平台', value: currentOrder.platform },
                { label: '状态', value: orderStatusMap[currentOrder.status]?.label },
                { label: '下单时间', value: currentOrder.createTime },
                { label: '付款时间', value: currentOrder.payTime },
              ]}
              style={{ marginBottom: 24 }}
            />
            <Descriptions
              column={1}
              title="商品信息"
              data={[
                { label: '商品名称', value: currentOrder.product },
                { label: '数量', value: currentOrder.quantity },
                { label: '金额', value: `¥${currentOrder.amount}` },
              ]}
              style={{ marginBottom: 24 }}
            />
            <Descriptions
              column={1}
              title="收货信息"
              data={[
                { label: '客户', value: currentOrder.customer },
                { label: '电话', value: currentOrder.phone },
                { label: '地址', value: currentOrder.address },
                { label: '物流单号', value: currentOrder.trackingNo },
              ]}
              style={{ marginBottom: 24 }}
            />
            {currentOrder.remark && (
              <Descriptions
                column={1}
                title="备注"
                data={[{ label: '买家留言', value: currentOrder.remark }]}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
