import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Avatar,
  Typography,
  Drawer,
  Descriptions,
  Tabs,
  List,
  Progress,
  Modal,
  Form,
  message,
  Divider,
  Badge,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  MessageOutlined,
  TeamOutlined,
  CrownOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TagOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ManOutlined,
  WomanOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

// 模拟客户数据
const generateCustomers = () => {
  const levels = ['普通', '银卡', '金卡', '钻石'];
  const tags = ['新客户', '活跃', '沉睡', '流失'];
  const customers = [];

  for (let i = 1; i <= 50; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const customerTags = [];
    if (Math.random() > 0.5) customerTags.push(tags[Math.floor(Math.random() * tags.length)]);
    if (Math.random() > 0.7) customerTags.push(tags[Math.floor(Math.random() * tags.length)]);

    customers.push({
      key: i,
      id: `C${String(i).padStart(6, '0')}`,
      name: `客户${i}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      phone: `1${3 + Math.floor(Math.random() * 6)}${String(Math.random()).slice(2, 11)}`,
      email: `customer${i}@example.com`,
      gender: Math.random() > 0.5 ? '男' : '女',
      level,
      tags: [...new Set(customerTags)],
      totalSpent: Math.floor(Math.random() * 50000) + 1000,
      orderCount: Math.floor(Math.random() * 50) + 1,
      lastOrderTime: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
      registerTime: dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD'),
      address: `北京市朝阳区某某街道${i}号`,
      points: Math.floor(Math.random() * 10000),
      balance: Math.floor(Math.random() * 5000),
    });
  }
  return customers;
};

// 模拟订单数据
const generateOrders = () => {
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    orders.push({
      key: i,
      orderId: `ORD${String(i).padStart(8, '0')}`,
      amount: Math.floor(Math.random() * 2000) + 100,
      status: ['已完成', '待发货', '已发货', '已取消'][Math.floor(Math.random() * 4)],
      time: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm'),
      products: Math.floor(Math.random() * 5) + 1,
    });
  }
  return orders;
};

// 获取等级对应的图标和颜色
const getLevelInfo = (level) => {
  const levelMap = {
    '普通': { icon: <UserOutlined />, color: '#8c8c8c' },
    '银卡': { icon: <StarOutlined />, color: '#bfbfbf' },
    '金卡': { icon: <StarOutlined />, color: '#faad14' },
    '钻石': { icon: <CrownOutlined />, color: '#722ed1' },
  };
  return levelMap[level] || levelMap['普通'];
};

// 获取标签颜色
const getTagColor = (tag) => {
  const tagColors = {
    '新客户': 'blue',
    '活跃': 'green',
    '沉睡': 'orange',
    '流失': 'red',
  };
  return tagColors[tag] || 'default';
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [form] = Form.useForm();
  const [orders, setOrders] = useState([]);

  // 筛选状态
  const [filters, setFilters] = useState({
    keyword: '',
    level: undefined,
    dateRange: null,
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    newCustomers: 0,
    activeCustomers: 0,
    vipCustomers: 0,
  });

  useEffect(() => {
    // 模拟加载数据
    setLoading(true);
    setTimeout(() => {
      const data = generateCustomers();
      setCustomers(data);
      setOrders(generateOrders());

      // 计算统计数据
      const total = data.length;
      const newCustomers = data.filter(c => c.tags.includes('新客户')).length;
      const activeCustomers = data.filter(c => c.tags.includes('活跃')).length;
      const vipCustomers = data.filter(c => ['金卡', '钻石'].includes(c.level)).length;

      setStats({ total, newCustomers, activeCustomers, vipCustomers });
      setPagination(prev => ({ ...prev, total }));
      setLoading(false);
    }, 500);
  }, []);

  // 处理筛选
  const handleFilter = () => {
    let filtered = [...customers];

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(keyword) ||
          c.phone.includes(keyword) ||
          c.id.toLowerCase().includes(keyword)
      );
    }

    if (filters.level) {
      filtered = filtered.filter(c => c.level === filters.level);
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(c => {
        const registerDate = dayjs(c.registerTime);
        return registerDate.isAfter(start) && registerDate.isBefore(end);
      });
    }

    setCustomers(filtered);
    setPagination(prev => ({ ...prev, total: filtered.length, current: 1 }));
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({ keyword: '', level: undefined, dateRange: null });
    const data = generateCustomers();
    setCustomers(data);
    setPagination(prev => ({ ...prev, total: data.length, current: 1 }));
  };

  // 查看客户详情
  const handleView = (record) => {
    setSelectedCustomer(record);
    setDrawerVisible(true);
  };

  // 编辑客户
  const handleEdit = (record) => {
    setSelectedCustomer(record);
    setModalType('edit');
    form.setFieldsValue({
      ...record,
      registerTime: dayjs(record.registerTime),
    });
    setModalVisible(true);
  };

  // 添加客户
  const handleAdd = () => {
    setSelectedCustomer(null);
    setModalType('add');
    form.resetFields();
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalType === 'add') {
        const newCustomer = {
          ...values,
          key: customers.length + 1,
          id: `C${String(customers.length + 1).padStart(6, '0')}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customers.length + 1}`,
          registerTime: values.registerTime.format('YYYY-MM-DD'),
          totalSpent: 0,
          orderCount: 0,
          lastOrderTime: '-',
          points: 0,
          balance: 0,
          tags: ['新客户'],
        };
        setCustomers([newCustomer, ...customers]);
        message.success('客户添加成功');
      } else {
        const updatedCustomers = customers.map(c =>
          c.key === selectedCustomer.key
            ? { ...c, ...values, registerTime: values.registerTime.format('YYYY-MM-DD') }
            : c
        );
        setCustomers(updatedCustomers);
        message.success('客户信息更新成功');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 发送消息
  const handleSendMessage = (record) => {
    message.info(`正在向 ${record.name} 发送消息...`);
  };

  // 表格列配置
  const columns = [
    {
      title: '客户信息',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      filters: [
        { text: '普通', value: '普通' },
        { text: '银卡', value: '银卡' },
        { text: '金卡', value: '金卡' },
        { text: '钻石', value: '钻石' },
      ],
      onFilter: (value, record) => record.level === value,
      render: (level) => {
        const levelInfo = getLevelInfo(level);
        return (
          <Tag icon={levelInfo.icon} color={levelInfo.color}>
            {level}
          </Tag>
        );
      },
    },
    {
      title: '消费统计',
      key: 'spending',
      width: 200,
      render: (_, record) => (
        <div>
          <div>
            <Text strong>¥{record.totalSpent.toLocaleString()}</Text>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              {record.orderCount}单
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最近: {record.lastOrderTime}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <Space size={[0, 4]} wrap>
          {tags.map((tag) => (
            <Tag key={tag} color={getTagColor(tag)}>
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      width: 120,
      sorter: (a, b) => dayjs(a.registerTime).unix() - dayjs(b.registerTime).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
              查看
            </Button>
          </Tooltip>
          <Tooltip title="编辑客户">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="发送消息">
            <Button type="link" icon={<MessageOutlined />} onClick={() => handleSendMessage(record)}>
              消息
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 订单表格列配置
  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `¥${val.toLocaleString()}`,
    },
    {
      title: '商品数',
      dataIndex: 'products',
      key: 'products',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          '已完成': 'success',
          '待发货': 'warning',
          '已发货': 'processing',
          '已取消': 'default',
        };
        return <Badge status={statusColors[status]} text={status} />;
      },
    },
    {
      title: '下单时间',
      dataIndex: 'time',
      key: 'time',
    },
  ];

  return (
    <div className="customers-page">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          客户中心
        </Title>
        <Space>
          <Button icon={<ImportOutlined />}>导入</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加客户
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#165DFF' }} />}
              valueStyle={{ color: '#165DFF' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">较昨日 +12</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>+5.2%</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="新增客户"
              value={stats.newCustomers}
              prefix={<UserOutlined style={{ color: '#00B42A' }} />}
              valueStyle={{ color: '#00B42A' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">本周新增</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>+8.3%</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃客户"
              value={stats.activeCustomers}
              prefix={<ShoppingCartOutlined style={{ color: '#FF7D00' }} />}
              valueStyle={{ color: '#FF7D00' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">近30天有购买</Text>
              <Tag color="orange" style={{ marginLeft: 8 }}>+2.1%</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="会员客户"
              value={stats.vipCustomers}
              prefix={<CrownOutlined style={{ color: '#722ED1' }} />}
              valueStyle={{ color: '#722ED1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">金卡/钻石会员</Text>
              <Tag color="purple" style={{ marginLeft: 8 }}>+3.5%</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索客户姓名/手机号/ID"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="客户等级"
              style={{ width: '100%' }}
              value={filters.level}
              onChange={(value) => setFilters({ ...filters, level: value })}
              allowClear
            >
              <Option value="普通">普通</Option>
              <Option value="银卡">银卡</Option>
              <Option value="金卡">金卡</Option>
              <Option value="钻石">钻石</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['注册开始时间', '注册结束时间']}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
                筛选
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 客户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
          scroll={{ x: 1200 }}
          rowKey="key"
        />
      </Card>

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => handleEdit(selectedCustomer)}>编辑</Button>
            <Button type="primary" onClick={() => handleSendMessage(selectedCustomer)}>
              发送消息
            </Button>
          </Space>
        }
      >
        {selectedCustomer && (
          <div>
            {/* 基本信息 */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar src={selectedCustomer.avatar} size={80} icon={<UserOutlined />} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {selectedCustomer.name}
                {selectedCustomer.gender === '男' ? (
                  <ManOutlined style={{ color: '#165DFF', marginLeft: 8 }} />
                ) : (
                  <WomanOutlined style={{ color: '#F53F3F', marginLeft: 8 }} />
                )}
              </Title>
              <Space size={[0, 8]} wrap style={{ marginTop: 8 }}>
                {selectedCustomer.tags.map((tag) => (
                  <Tag key={tag} color={getTagColor(tag)}>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>

            <Divider />

            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="客户ID">{selectedCustomer.id}</Descriptions.Item>
                  <Descriptions.Item label="客户等级">
                    <Tag icon={getLevelInfo(selectedCustomer.level).icon} color={getLevelInfo(selectedCustomer.level).color}>
                      {selectedCustomer.level}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">{selectedCustomer.phone}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{selectedCustomer.email}</Descriptions.Item>
                  <Descriptions.Item label="注册时间">{selectedCustomer.registerTime}</Descriptions.Item>
                  <Descriptions.Item label="积分">{selectedCustomer.points}</Descriptions.Item>
                  <Descriptions.Item label="地址" span={2}>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    {selectedCustomer.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="账户余额" span={2}>
                    <Text strong style={{ color: '#165DFF' }}>
                      ¥{selectedCustomer.balance.toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>

              <TabPane tab="消费统计" key="2">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="消费总额"
                        value={selectedCustomer.totalSpent}
                        prefix={<DollarOutlined style={{ color: '#165DFF' }} />}
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="订单总数"
                        value={selectedCustomer.orderCount}
                        prefix={<ShoppingCartOutlined style={{ color: '#00B42A' }} />}
                        suffix="单"
                      />
                    </Card>
                  </Col>
                </Row>
                <Card style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text>消费等级进度</Text>
                  </div>
                  <Progress
                    percent={Math.min((selectedCustomer.totalSpent / 50000) * 100, 100)}
                    status="active"
                    strokeColor={{
                      '0%': '#165DFF',
                      '100%': '#722ED1',
                    }}
                  />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">当前: ¥{selectedCustomer.totalSpent.toLocaleString()}</Text>
                    <Text type="secondary">目标: ¥50,000</Text>
                  </div>
                </Card>
              </TabPane>

              <TabPane tab="订单记录" key="3">
                <Table
                  columns={orderColumns}
                  dataSource={orders}
                  pagination={false}
                  size="small"
                  rowKey="key"
                />
              </TabPane>

              <TabPane tab="标签管理" key="4">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>当前标签</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space size={[0, 8]} wrap>
                      {selectedCustomer.tags.map((tag) => (
                        <Tag
                          key={tag}
                          color={getTagColor(tag)}
                          closable
                          onClose={() => {
                            const newTags = selectedCustomer.tags.filter((t) => t !== tag);
                            setSelectedCustomer({ ...selectedCustomer, tags: newTags });
                          }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                <Divider />
                <div>
                  <Text strong>添加标签</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space size={[0, 8]} wrap>
                      {['新客户', '活跃', '沉睡', '流失', 'VIP', '高价值'].map((tag) => (
                        <Tag
                          key={tag}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (!selectedCustomer.tags.includes(tag)) {
                              setSelectedCustomer({
                                ...selectedCustomer,
                                tags: [...selectedCustomer.tags, tag],
                              });
                            }
                          }}
                        >
                          + {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* 添加/编辑客户弹窗 */}
      <Modal
        title={modalType === 'add' ? '添加客户' : '编辑客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={640}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
              >
                <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别">
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="level" label="客户等级">
                <Select placeholder="请选择客户等级">
                  <Option value="普通">普通</Option>
                  <Option value="银卡">银卡</Option>
                  <Option value="金卡">金卡</Option>
                  <Option value="钻石">钻石</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="registerTime" label="注册时间">
                <DatePicker style={{ width: '100%' }} placeholder="请选择注册时间" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}