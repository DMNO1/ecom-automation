import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Typography,
  Divider,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Progress,
  Avatar,
  List,
  Descriptions,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  StopOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  TeamOutlined,
  DollarOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  EyeOutlined,
  SettingOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  UserOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 模拟优惠券数据
const mockCoupons = [
  {
    id: 1,
    name: '新用户专享券',
    type: '满减券',
    discount: 20,
    condition: '满100可用',
    total: 10000,
    used: 3562,
    status: 'active',
    startTime: '2026-04-01',
    endTime: '2026-04-30',
    createdAt: '2026-03-28',
  },
  {
    id: 2,
    name: '会员日折扣券',
    type: '折扣券',
    discount: 85,
    condition: '满200可用',
    total: 5000,
    used: 1234,
    status: 'active',
    startTime: '2026-04-15',
    endTime: '2026-04-20',
    createdAt: '2026-04-10',
  },
  {
    id: 3,
    name: '春季大促券',
    type: '满减券',
    discount: 50,
    condition: '满300可用',
    total: 20000,
    used: 8765,
    status: 'active',
    startTime: '2026-04-01',
    endTime: '2026-05-01',
    createdAt: '2026-03-25',
  },
  {
    id: 4,
    name: '限时秒杀券',
    type: '无门槛券',
    discount: 10,
    condition: '无限制',
    total: 50000,
    used: 45231,
    status: 'expired',
    startTime: '2026-03-01',
    endTime: '2026-03-31',
    createdAt: '2026-02-25',
  },
  {
    id: 5,
    name: 'VIP专属券',
    type: '折扣券',
    discount: 70,
    condition: '满500可用',
    total: 1000,
    used: 234,
    status: 'active',
    startTime: '2026-04-01',
    endTime: '2026-06-30',
    createdAt: '2026-03-20',
  },
];

// 模拟促销活动数据
const mockCampaigns = [
  {
    id: 1,
    name: '春季焕新大促',
    type: '满减活动',
    startTime: '2026-04-01',
    endTime: '2026-04-30',
    products: 156,
    sales: 23456,
    revenue: 1256800,
    status: 'ongoing',
    participants: 12580,
  },
  {
    id: 2,
    name: '会员专享日',
    type: '折扣活动',
    startTime: '2026-04-15',
    endTime: '2026-04-20',
    products: 89,
    sales: 8765,
    revenue: 456200,
    status: 'ongoing',
    participants: 5620,
  },
  {
    id: 3,
    name: '限时秒杀专场',
    type: '秒杀活动',
    startTime: '2026-04-10',
    endTime: '2026-04-12',
    products: 24,
    sales: 15620,
    revenue: 892300,
    status: 'ended',
    participants: 23150,
  },
  {
    id: 4,
    name: '新品首发特惠',
    type: '新品活动',
    startTime: '2026-04-20',
    endTime: '2026-04-25',
    products: 12,
    sales: 0,
    revenue: 0,
    status: 'pending',
    participants: 0,
  },
  {
    id: 5,
    name: '五一劳动节大促',
    type: '满减活动',
    startTime: '2026-05-01',
    endTime: '2026-05-07',
    products: 200,
    sales: 0,
    revenue: 0,
    status: 'pending',
    participants: 0,
  },
];

// 模拟分销员数据
const mockDistributors = [
  {
    id: 1,
    name: '张小明',
    avatar: '',
    level: '金牌分销员',
    sales: 156200,
    orders: 324,
    commission: 12580,
    status: 'active',
    joinDate: '2025-06-15',
    phone: '138****8888',
  },
  {
    id: 2,
    name: '李美丽',
    avatar: '',
    level: '银牌分销员',
    sales: 89500,
    orders: 186,
    commission: 7160,
    status: 'active',
    joinDate: '2025-08-20',
    phone: '139****9999',
  },
  {
    id: 3,
    name: '王大伟',
    avatar: '',
    level: '金牌分销员',
    sales: 134800,
    orders: 278,
    commission: 10784,
    status: 'active',
    joinDate: '2025-05-10',
    phone: '137****7777',
  },
  {
    id: 4,
    name: '赵晓燕',
    avatar: '',
    level: '铜牌分销员',
    sales: 45200,
    orders: 92,
    commission: 2712,
    status: 'inactive',
    joinDate: '2025-10-05',
    phone: '136****6666',
  },
  {
    id: 5,
    name: '刘强东',
    avatar: '',
    level: '金牌分销员',
    sales: 198500,
    orders: 412,
    commission: 15880,
    status: 'active',
    joinDate: '2025-04-01',
    phone: '135****5555',
  },
];

// 统计卡片数据
const statsData = [
  {
    title: '进行中活动',
    value: 8,
    icon: <FireOutlined />,
    color: '#FF7D00',
    suffix: '个',
    trend: '+2',
    trendType: 'up',
  },
  {
    title: '优惠券发放量',
    value: 156892,
    icon: <GiftOutlined />,
    color: '#165DFF',
    suffix: '张',
    trend: '+12.5%',
    trendType: 'up',
  },
  {
    title: '营销收入',
    value: 2685400,
    icon: <DollarOutlined />,
    color: '#00B42A',
    suffix: '元',
    trend: '+18.2%',
    trendType: 'up',
    precision: 2,
  },
  {
    title: 'ROI',
    value: 4.8,
    icon: <PercentageOutlined />,
    color: '#722ED1',
    suffix: '',
    trend: '+0.6',
    trendType: 'up',
    precision: 1,
  },
];

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [coupons, setCoupons] = useState(mockCoupons);
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [distributors, setDistributors] = useState(mockDistributors);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // 优惠券弹窗
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponModalType, setCouponModalType] = useState('create');
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm] = Form.useForm();
  
  // 活动弹窗
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [campaignForm] = Form.useForm();
  
  // 佣金设置抽屉
  const [commissionDrawerVisible, setCommissionDrawerVisible] = useState(false);
  const [commissionForm] = Form.useForm();

  // 创建/编辑优惠券
  const handleCouponSubmit = () => {
    couponForm.validateFields().then((values) => {
      if (couponModalType === 'create') {
        const newCoupon = {
          id: Date.now(),
          ...values,
          used: 0,
          status: 'active',
          createdAt: dayjs().format('YYYY-MM-DD'),
          startTime: values.dateRange[0].format('YYYY-MM-DD'),
          endTime: values.dateRange[1].format('YYYY-MM-DD'),
        };
        setCoupons([newCoupon, ...coupons]);
        message.success('优惠券创建成功');
      } else {
        const updatedCoupons = coupons.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                ...values,
                startTime: values.dateRange[0].format('YYYY-MM-DD'),
                endTime: values.dateRange[1].format('YYYY-MM-DD'),
              }
            : c
        );
        setCoupons(updatedCoupons);
        message.success('优惠券更新成功');
      }
      setCouponModalVisible(false);
      couponForm.resetFields();
    });
  };

  // 编辑优惠券
  const handleEditCoupon = (record) => {
    setCouponModalType('edit');
    setEditingCoupon(record);
    couponForm.setFieldsValue({
      ...record,
      dateRange: [dayjs(record.startTime), dayjs(record.endTime)],
    });
    setCouponModalVisible(true);
  };

  // 删除优惠券
  const handleDeleteCoupon = (id) => {
    setCoupons(coupons.filter((c) => c.id !== id));
    message.success('优惠券已删除');
  };

  // 批量发放
  const handleBatchSend = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要发放的优惠券');
      return;
    }
    message.success(`已发放 ${selectedRowKeys.length} 张优惠券`);
    setSelectedRowKeys([]);
  };

  // 批量停用
  const handleBatchStop = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要停用的优惠券');
      return;
    }
    const updatedCoupons = coupons.map((c) =>
      selectedRowKeys.includes(c.id) ? { ...c, status: 'stopped' } : c
    );
    setCoupons(updatedCoupons);
    message.success(`已停用 ${selectedRowKeys.length} 张优惠券`);
    setSelectedRowKeys([]);
  };

  // 创建活动
  const handleCampaignSubmit = () => {
    campaignForm.validateFields().then((values) => {
      const newCampaign = {
        id: Date.now(),
        ...values,
        startTime: values.dateRange[0].format('YYYY-MM-DD'),
        endTime: values.dateRange[1].format('YYYY-MM-DD'),
        products: 0,
        sales: 0,
        revenue: 0,
        status: 'pending',
        participants: 0,
      };
      setCampaigns([newCampaign, ...campaigns]);
      setCampaignModalVisible(false);
      campaignForm.resetFields();
      message.success('活动创建成功');
    });
  };

  // 优惠券表格列
  const couponColumns = [
    {
      title: '优惠券名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <GiftOutlined style={{ color: '#165DFF' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colorMap = {
          '满减券': 'blue',
          '折扣券': 'green',
          '无门槛券': 'orange',
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '面值',
      dataIndex: 'discount',
      key: 'discount',
      render: (val, record) => (
        <Text strong style={{ color: '#F53F3F', fontSize: 16 }}>
          {record.type === '折扣券' ? `${val / 10}折` : `¥${val}`}
        </Text>
      ),
    },
    {
      title: '使用条件',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: '发放量',
      dataIndex: 'total',
      key: 'total',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: '已使用',
      dataIndex: 'used',
      key: 'used',
      render: (val, record) => (
        <Space direction="vertical" size={0}>
          <Text>{val.toLocaleString()}</Text>
          <Progress
            percent={Math.round((val / record.total) * 100)}
            size="small"
            showInfo={false}
            strokeColor="#165DFF"
          />
        </Space>
      ),
      sorter: (a, b) => a.used - b.used,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          active: { color: 'success', text: '进行中', icon: <CheckCircleOutlined /> },
          expired: { color: 'default', text: '已过期', icon: <ClockCircleOutlined /> },
          stopped: { color: 'error', text: '已停用', icon: <StopOutlined /> },
        };
        const config = statusMap[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditCoupon(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button type="link" icon={<CopyOutlined />} size="small" />
          </Tooltip>
          <Popconfirm
            title="确定要删除这张优惠券吗？"
            onConfirm={() => handleDeleteCoupon(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 活动表格列
  const campaignColumns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <ThunderboltOutlined style={{ color: '#FF7D00' }} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.startTime} ~ {record.endTime}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colorMap = {
          '满减活动': 'blue',
          '折扣活动': 'green',
          '秒杀活动': 'red',
          '新品活动': 'purple',
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '参与商品',
      dataIndex: 'products',
      key: 'products',
      render: (val) => `${val} 件`,
      sorter: (a, b) => a.products - b.products,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.sales - b.sales,
    },
    {
      title: '营销收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => (
        <Text strong style={{ color: '#00B42A' }}>
          ¥{val.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      key: 'participants',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.participants - b.participants,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          ongoing: { color: 'processing', text: '进行中', icon: <PlayCircleOutlined /> },
          pending: { color: 'warning', text: '待开始', icon: <ClockCircleOutlined /> },
          ended: { color: 'default', text: '已结束', icon: <CheckCircleOutlined /> },
        };
        const config = statusMap[status];
        return (
          <Badge status={config.color} text={config.text} />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} size="small" />
          </Tooltip>
          {record.status === 'pending' && (
            <Popconfirm title="确定要删除这个活动吗？">
              <Tooltip title="删除">
                <Button type="link" danger icon={<DeleteOutlined />} size="small" />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 分销员表格列
  const distributorColumns = [
    {
      title: '分销员',
      key: 'distributor',
      render: (_, record) => (
        <Space>
          <Avatar
            style={{
              backgroundColor:
                record.level === '金牌分销员'
                  ? '#FFD700'
                  : record.level === '银牌分销员'
                  ? '#C0C0C0'
                  : '#CD7F32',
            }}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const colorMap = {
          '金牌分销员': 'gold',
          '银牌分销员': 'default',
          '铜牌分销员': 'orange',
        };
        return (
          <Tag color={colorMap[level]} icon={<CrownOutlined />}>
            {level}
          </Tag>
        );
      },
    },
    {
      title: '销售额',
      dataIndex: 'sales',
      key: 'sales',
      render: (val) => (
        <Text strong style={{ color: '#165DFF' }}>
          ¥{val.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.sales - b.sales,
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.orders - b.orders,
    },
    {
      title: '佣金',
      dataIndex: 'commission',
      key: 'commission',
      render: (val) => (
        <Text strong style={{ color: '#00B42A' }}>
          ¥{val.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.commission - b.commission,
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? '活跃' : '停用'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: () => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div className="marketing-page">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ShopOutlined style={{ marginRight: 8, color: '#165DFF' }} />
          营销中心
        </Title>
        <Text type="secondary">管理优惠券、促销活动和分销体系</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{ borderRadius: 8 }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Statistic
                title={
                  <Space>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: `${stat.color}15`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </span>
                    <span>{stat.title}</span>
                  </Space>
                }
                value={stat.value}
                precision={stat.precision}
                valueStyle={{ color: stat.color, fontSize: 28 }}
                suffix={stat.suffix}
              />
              <div style={{ marginTop: 8 }}>
                <Tag
                  color={stat.trendType === 'up' ? 'success' : 'error'}
                  style={{ borderRadius: 4 }}
                >
                  {stat.trendType === 'up' ? '↑' : '↓'} {stat.trend}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  较上月
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 主要内容区域 */}
      <Card style={{ borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Space>
              {activeTab === 'coupons' && (
                <>
                  <Button
                    icon={<SendOutlined />}
                    onClick={handleBatchSend}
                    disabled={selectedRowKeys.length === 0}
                  >
                    批量发放
                  </Button>
                  <Button
                    icon={<StopOutlined />}
                    onClick={handleBatchStop}
                    disabled={selectedRowKeys.length === 0}
                  >
                    批量停用
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCouponModalType('create');
                      setEditingCoupon(null);
                      couponForm.resetFields();
                      setCouponModalVisible(true);
                    }}
                    style={{ backgroundColor: '#165DFF' }}
                  >
                    创建优惠券
                  </Button>
                </>
              )}
              {activeTab === 'campaigns' && (
                <>
                  <Button icon={<FilterOutlined />}>筛选</Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCampaignModalVisible(true)}
                    style={{ backgroundColor: '#165DFF' }}
                  >
                    创建活动
                  </Button>
                </>
              )}
              {activeTab === 'distributors' && (
                <>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setCommissionDrawerVisible(true)}
                  >
                    佣金设置
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: '#165DFF' }}
                  >
                    添加分销员
                  </Button>
                </>
              )}
            </Space>
          }
        >
          {/* 优惠券管理 */}
          <TabPane
            tab={
              <span>
                <GiftOutlined />
                优惠券管理
              </span>
            }
            key="coupons"
          >
            <Table
              columns={couponColumns}
              dataSource={coupons}
              rowKey="id"
              rowSelection={rowSelection}
              loading={loading}
              pagination={{
                total: coupons.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          {/* 促销活动 */}
          <TabPane
            tab={
              <span>
                <ThunderboltOutlined />
                促销活动
              </span>
            }
            key="campaigns"
          >
            <Table
              columns={campaignColumns}
              dataSource={campaigns}
              rowKey="id"
              loading={loading}
              pagination={{
                total: campaigns.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          {/* 分销管理 */}
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                分销管理
              </span>
            }
            key="distributors"
          >
            {/* 分销统计概览 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Statistic
                    title="分销员总数"
                    value={distributors.length}
                    prefix={<TeamOutlined style={{ color: '#165DFF' }} />}
                    suffix="人"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Statistic
                    title="本月分销额"
                    value={456200}
                    precision={2}
                    prefix={<DollarOutlined style={{ color: '#00B42A' }} />}
                    suffix="元"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Statistic
                    title="本月佣金支出"
                    value={36356}
                    precision={2}
                    prefix={<PercentageOutlined style={{ color: '#FF7D00' }} />}
                    suffix="元"
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={distributorColumns}
              dataSource={distributors}
              rowKey="id"
              loading={loading}
              pagination={{
                total: distributors.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑优惠券弹窗 */}
      <Modal
        title={couponModalType === 'create' ? '创建优惠券' : '编辑优惠券'}
        open={couponModalVisible}
        onOk={handleCouponSubmit}
        onCancel={() => {
          setCouponModalVisible(false);
          couponForm.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#165DFF' } }}
      >
        <Form form={couponForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="优惠券名称"
            rules={[{ required: true, message: '请输入优惠券名称' }]}
          >
            <Input placeholder="请输入优惠券名称" maxLength={50} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="优惠类型"
                rules={[{ required: true, message: '请选择优惠类型' }]}
              >
                <Select placeholder="请选择优惠类型">
                  <Option value="满减券">满减券</Option>
                  <Option value="折扣券">折扣券</Option>
                  <Option value="无门槛券">无门槛券</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount"
                label="面值"
                rules={[{ required: true, message: '请输入面值' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={10000}
                  placeholder="请输入面值"
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="condition"
            label="使用条件"
            rules={[{ required: true, message: '请输入使用条件' }]}
          >
            <Input placeholder="例如：满100可用" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="total"
                label="发放数量"
                rules={[{ required: true, message: '请输入发放数量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000000}
                  placeholder="请输入发放数量"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateRange"
                label="有效期"
                rules={[{ required: true, message: '请选择有效期' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="使用说明">
            <TextArea
              rows={3}
              placeholder="请输入优惠券使用说明（选填）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建活动弹窗 */}
      <Modal
        title="创建促销活动"
        open={campaignModalVisible}
        onOk={handleCampaignSubmit}
        onCancel={() => {
          setCampaignModalVisible(false);
          campaignForm.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#165DFF' } }}
      >
        <Form form={campaignForm} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="name"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="请输入活动名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="type"
            label="活动类型"
            rules={[{ required: true, message: '请选择活动类型' }]}
          >
            <Select placeholder="请选择活动类型">
              <Option value="满减活动">满减活动</Option>
              <Option value="折扣活动">折扣活动</Option>
              <Option value="秒杀活动">秒杀活动</Option>
              <Option value="新品活动">新品活动</Option>
              <Option value="拼团活动">拼团活动</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="活动时间"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item
            name="budget"
            label="活动预算"
            rules={[{ required: true, message: '请输入活动预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={10000000}
              placeholder="请输入活动预算"
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="description" label="活动描述">
            <TextArea
              rows={3}
              placeholder="请输入活动描述（选填）"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 佣金设置抽屉 */}
      <Drawer
        title="佣金设置"
        placement="right"
        width={400}
        open={commissionDrawerVisible}
        onClose={() => setCommissionDrawerVisible(false)}
        extra={
          <Button
            type="primary"
            style={{ backgroundColor: '#165DFF' }}
            onClick={() => {
              message.success('佣金设置已保存');
              setCommissionDrawerVisible(false);
            }}
          >
            保存设置
          </Button>
        }
      >
        <Form form={commissionForm} layout="vertical">
          <Divider orientation="left">分销等级佣金比例</Divider>
          
          <Form.Item label="金牌分销员" name="goldRate" initialValue={8}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
            />
          </Form.Item>
          
          <Form.Item label="银牌分销员" name="silverRate" initialValue={6}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
            />
          </Form.Item>
          
          <Form.Item label="铜牌分销员" name="bronzeRate" initialValue={4}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
            />
          </Form.Item>

          <Divider orientation="left">佣金结算规则</Divider>
          
          <Form.Item label="结算周期" name="settlementCycle" initialValue="monthly">
            <Select>
              <Option value="daily">每日结算</Option>
              <Option value="weekly">每周结算</Option>
              <Option value="monthly">每月结算</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="佣金冻结期" name="freezeDays" initialValue={7}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={30}
              addonAfter="天"
            />
          </Form.Item>
          
          <Form.Item label="最低提现金额" name="minWithdraw" initialValue={100}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `¥ ${value}`}
              parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Divider orientation="left">其他设置</Divider>
          
          <Form.Item
            label="允许自购佣金"
            name="allowSelfPurchase"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            label="允许二级分销"
            name="allowSecondLevel"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}