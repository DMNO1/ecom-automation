import React, { useState } from 'react';
import { 
  Tabs, 
  Card, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Table, 
  Tag, 
  Space, 
  Select, 
  DatePicker, 
  Upload, 
  message,
  Divider,
  List,
  Avatar,
  Badge,
  Row,
  Col,
  Typography,
  Modal,
  Tooltip
} from 'antd';
import { 
  ShopOutlined, 
  TeamOutlined, 
  HistoryOutlined, 
  BellOutlined,
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  LockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import './System.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 模拟数据
const mockRoles = [
  { id: 1, name: '管理员', description: '拥有所有权限', userCount: 2, permissions: ['all'] },
  { id: 2, name: '运营', description: '负责商品和订单管理', userCount: 5, permissions: ['product', 'order', 'marketing'] },
  { id: 3, name: '客服', description: '处理客户咨询和售后', userCount: 8, permissions: ['customer_service', 'order_view'] },
  { id: 4, name: '财务', description: '查看财务数据和报表', userCount: 3, permissions: ['finance', 'order_view'] },
];

const mockUsers = [
  { id: 1, username: 'admin', name: '系统管理员', role: '管理员', status: 'active', lastLogin: '2024-01-15 10:30:00' },
  { id: 2, username: 'operator1', name: '张三', role: '运营', status: 'active', lastLogin: '2024-01-15 09:15:00' },
  { id: 3, username: 'service1', name: '李四', role: '客服', status: 'active', lastLogin: '2024-01-14 16:45:00' },
  { id: 4, username: 'finance1', name: '王五', role: '财务', status: 'inactive', lastLogin: '2024-01-10 14:20:00' },
];

const mockLogs = [
  { id: 1, time: '2024-01-15 10:30:00', user: 'admin', type: '登录', content: '管理员登录系统', ip: '192.168.1.100' },
  { id: 2, time: '2024-01-15 10:25:00', user: 'operator1', type: '商品', content: '修改商品SKU-001价格', ip: '192.168.1.101' },
  { id: 3, time: '2024-01-15 10:20:00', user: 'service1', type: '订单', content: '处理订单ORD-20240115-001退款', ip: '192.168.1.102' },
  { id: 4, time: '2024-01-15 10:15:00', user: 'admin', type: '系统', content: '更新店铺基本信息', ip: '192.168.1.100' },
  { id: 5, time: '2024-01-15 10:10:00', user: 'operator1', type: '营销', content: '创建优惠券活动', ip: '192.168.1.101' },
];

const mockNotifications = [
  { id: 1, type: '订单通知', enabled: true, channels: ['站内信', '邮件'] },
  { id: 2, type: '库存预警', enabled: true, channels: ['站内信', '短信'] },
  { id: 3, type: '退款提醒', enabled: true, channels: ['站内信'] },
  { id: 4, type: '客户投诉', enabled: false, channels: ['站内信'] },
  { id: 5, type: '系统更新', enabled: true, channels: ['站内信', '邮件'] },
];

const notificationRecords = [
  { id: 1, title: '新订单通知', content: '订单ORD-20240115-002已创建', time: '2024-01-15 10:35:00', read: false },
  { id: 2, title: '库存预警', content: '商品SKU-002库存低于安全库存', time: '2024-01-15 10:30:00', read: false },
  { id: 3, title: '退款申请', content: '订单ORD-20240114-003申请退款', time: '2024-01-15 10:25:00', read: true },
  { id: 4, title: '系统更新', content: '系统将于今晚进行维护升级', time: '2024-01-15 09:00:00', read: true },
];

export default function System() {
  const [activeTab, setActiveTab] = useState('shop');
  const [shopForm] = Form.useForm();
  const [editingRole, setEditingRole] = useState(null);
  const [logFilters, setLogFilters] = useState({ user: '', type: '', dateRange: [] });
  const [notificationSettings, setNotificationSettings] = useState(mockNotifications);

  // 店铺设置表单提交
  const handleShopSubmit = (values) => {
    console.log('店铺设置:', values);
    message.success('店铺设置保存成功');
  };

  // 权限管理 - 角色表格列
  const roleColumns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '用户数量', dataIndex: 'userCount', key: 'userCount' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => setEditingRole(record)}
          >
            编辑
          </Button>
          <Button type="link" icon={<LockOutlined />}>权限</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  // 用户表格列
  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" icon={<LockOutlined />}>重置密码</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  // 操作日志表格列
  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '用户', dataIndex: 'user', key: 'user', width: 120 },
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const colorMap = {
          '登录': 'blue',
          '商品': 'green',
          '订单': 'orange',
          '系统': 'purple',
          '营销': 'cyan',
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    { title: '操作内容', dataIndex: 'content', key: 'content' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 150 },
  ];

  // 切换通知设置
  const toggleNotification = (id) => {
    setNotificationSettings(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  // 平台授权状态
  const platformStatus = [
    { name: '抖音', status: '已授权', color: 'green', icon: '🎵' },
    { name: '拼多多', status: '未授权', color: 'red', icon: '🛒' },
    { name: '闲鱼', status: '已授权', color: 'green', icon: '🐟' },
    { name: '快手', status: '授权中', color: 'orange', icon: '⚡' },
  ];

  return (
    <div className="system-page">
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>系统管理</Title>
        <Text type="secondary">管理店铺设置、用户权限、操作日志和消息通知</Text>
      </div>

      <Card 
        className="main-card"
        bordered={false}
        style={{ borderRadius: 8 }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="system-tabs"
        >
          {/* 店铺设置 */}
          <TabPane 
            tab={
              <span>
                <ShopOutlined />
                店铺设置
              </span>
            } 
            key="shop"
          >
            <div className="tab-content">
              <Row gutter={24}>
                <Col span={16}>
                  <Card 
                    title="基本信息" 
                    bordered={false}
                    className="section-card"
                  >
                    <Form
                      form={shopForm}
                      layout="vertical"
                      initialValues={{
                        shopName: '优选好店',
                        shopDesc: '专注品质好物，提供优质服务',
                        contactPhone: '400-123-4567',
                        contactEmail: 'service@example.com',
                        address: '北京市朝阳区某某大厦',
                      }}
                      onFinish={handleShopSubmit}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="店铺名称"
                            name="shopName"
                            rules={[{ required: true, message: '请输入店铺名称' }]}
                          >
                            <Input placeholder="请输入店铺名称" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="联系电话"
                            name="contactPhone"
                            rules={[{ required: true, message: '请输入联系电话' }]}
                          >
                            <Input placeholder="请输入联系电话" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="联系邮箱"
                            name="contactEmail"
                            rules={[
                              { required: true, message: '请输入联系邮箱' },
                              { type: 'email', message: '请输入有效的邮箱地址' }
                            ]}
                          >
                            <Input placeholder="请输入联系邮箱" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="店铺地址"
                            name="address"
                          >
                            <Input placeholder="请输入店铺地址" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        label="店铺简介"
                        name="shopDesc"
                      >
                        <Input.TextArea rows={4} placeholder="请输入店铺简介" />
                      </Form.Item>
                      <Form.Item label="店铺Logo">
                        <Upload
                          listType="picture-card"
                          maxCount={1}
                          showUploadList={false}
                        >
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>上传Logo</div>
                          </div>
                        </Upload>
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ backgroundColor: '#165DFF' }}>
                          保存设置
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card 
                    title="平台授权" 
                    bordered={false}
                    className="section-card"
                    extra={<Button type="link">管理</Button>}
                  >
                    <List
                      dataSource={platformStatus}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Button 
                              type="link" 
                              size="small"
                              style={{ color: item.status === '已授权' ? '#ff4d4f' : '#165DFF' }}
                            >
                              {item.status === '已授权' ? '解绑' : '授权'}
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<span style={{ fontSize: 24 }}>{item.icon}</span>}
                            title={item.name}
                            description={
                              <Tag color={item.color}>{item.status}</Tag>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                  
                  <Card 
                    title="运费模板" 
                    bordered={false}
                    className="section-card"
                    style={{ marginTop: 16 }}
                    extra={
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<PlusOutlined />}
                        style={{ backgroundColor: '#165DFF' }}
                      >
                        新增
                      </Button>
                    }
                  >
                    <List
                      size="small"
                      dataSource={[
                        { name: '默认模板', areas: '全国（除偏远地区）' },
                        { name: '偏远地区', areas: '新疆、西藏、内蒙古' },
                      ]}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Button type="link" size="small">编辑</Button>,
                            <Button type="link" size="small" danger>删除</Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={item.name}
                            description={item.areas}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>

          {/* 权限管理 */}
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                权限管理
              </span>
            } 
            key="permission"
          >
            <div className="tab-content">
              <Card 
                title="角色管理" 
                bordered={false}
                className="section-card"
                extra={
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: '#165DFF' }}
                  >
                    新增角色
                  </Button>
                }
              >
                <Table
                  columns={roleColumns}
                  dataSource={mockRoles}
                  rowKey="id"
                  pagination={false}
                />
              </Card>

              <Card 
                title="用户管理" 
                bordered={false}
                className="section-card"
                style={{ marginTop: 16 }}
                extra={
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: '#165DFF' }}
                  >
                    新增用户
                  </Button>
                }
              >
                <Table
                  columns={userColumns}
                  dataSource={mockUsers}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </div>
          </TabPane>

          {/* 操作日志 */}
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />
                操作日志
              </span>
            } 
            key="logs"
          >
            <div className="tab-content">
              <Card 
                bordered={false}
                className="section-card"
              >
                <div className="filter-bar">
                  <Space size="middle">
                    <Select
                      placeholder="选择用户"
                      style={{ width: 150 }}
                      allowClear
                      onChange={(value) => setLogFilters(prev => ({ ...prev, user: value }))}
                    >
                      <Option value="admin">admin</Option>
                      <Option value="operator1">operator1</Option>
                      <Option value="service1">service1</Option>
                    </Select>
                    <Select
                      placeholder="操作类型"
                      style={{ width: 150 }}
                      allowClear
                      onChange={(value) => setLogFilters(prev => ({ ...prev, type: value }))}
                    >
                      <Option value="登录">登录</Option>
                      <Option value="商品">商品</Option>
                      <Option value="订单">订单</Option>
                      <Option value="系统">系统</Option>
                      <Option value="营销">营销</Option>
                    </Select>
                    <RangePicker
                      placeholder={['开始日期', '结束日期']}
                      onChange={(dates) => setLogFilters(prev => ({ ...prev, dateRange: dates }))}
                    />
                    <Button 
                      type="primary" 
                      icon={<SearchOutlined />}
                      style={{ backgroundColor: '#165DFF' }}
                    >
                      搜索
                    </Button>
                    <Button icon={<SyncOutlined />}>刷新</Button>
                  </Space>
                </div>

                <Table
                  columns={logColumns}
                  dataSource={mockLogs}
                  rowKey="id"
                  pagination={{
                    total: 100,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                  }}
                />
              </Card>
            </div>
          </TabPane>

          {/* 消息通知 */}
          <TabPane 
            tab={
              <span>
                <BellOutlined />
                消息通知
              </span>
            } 
            key="notifications"
          >
            <div className="tab-content">
              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    title="通知设置" 
                    bordered={false}
                    className="section-card"
                  >
                    <List
                      dataSource={notificationSettings}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Switch
                              checked={item.enabled}
                              onChange={() => toggleNotification(item.id)}
                              style={{ backgroundColor: item.enabled ? '#165DFF' : undefined }}
                            />
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                icon={<NotificationOutlined />} 
                                style={{ backgroundColor: item.enabled ? '#165DFF' : '#d9d9d9' }}
                              />
                            }
                            title={item.type}
                            description={
                              <Space>
                                {item.channels.map((channel, index) => (
                                  <Tag key={index} color="blue">{channel}</Tag>
                                ))}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    <Divider />
                    <div style={{ textAlign: 'center' }}>
                      <Button 
                        type="primary" 
                        icon={<SettingOutlined />}
                        style={{ backgroundColor: '#165DFF' }}
                      >
                        通知渠道配置
                      </Button>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card 
                    title="通知记录" 
                    bordered={false}
                    className="section-card"
                    extra={
                      <Button type="link">全部标记已读</Button>
                    }
                  >
                    <List
                      dataSource={notificationRecords}
                      renderItem={item => (
                        <List.Item
                          style={{ 
                            backgroundColor: item.read ? 'transparent' : '#f6ffed',
                            padding: '12px 16px',
                            borderRadius: 8,
                            marginBottom: 8,
                            border: '1px solid',
                            borderColor: item.read ? '#f0f0f0' : '#b7eb8f'
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <Badge dot={!item.read}>
                                <Avatar 
                                  icon={<BellOutlined />} 
                                  style={{ backgroundColor: item.read ? '#d9d9d9' : '#165DFF' }}
                                />
                              </Badge>
                            }
                            title={
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: item.read ? 400 : 600 }}>{item.title}</span>
                                <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                              </div>
                            }
                            description={item.content}
                          />
                        </List.Item>
                      )}
                    />
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                      <Button type="link">查看全部通知</Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 角色编辑弹窗 */}
      <Modal
        title="编辑角色"
        open={!!editingRole}
        onCancel={() => setEditingRole(null)}
        footer={[
          <Button key="cancel" onClick={() => setEditingRole(null)}>取消</Button>,
          <Button 
            key="submit" 
            type="primary" 
            style={{ backgroundColor: '#165DFF' }}
            onClick={() => {
              message.success('角色更新成功');
              setEditingRole(null);
            }}
          >
            保存
          </Button>,
        ]}
      >
        {editingRole && (
          <Form layout="vertical">
            <Form.Item label="角色名称">
              <Input defaultValue={editingRole.name} />
            </Form.Item>
            <Form.Item label="角色描述">
              <Input.TextArea defaultValue={editingRole.description} rows={3} />
            </Form.Item>
            <Form.Item label="权限分配">
              <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: 8 }}>
                <div style={{ marginBottom: 12 }}>
                  <Switch defaultChecked={editingRole.permissions.includes('all')} />
                  <span style={{ marginLeft: 8 }}>全部权限</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Switch defaultChecked={editingRole.permissions.includes('product')} />
                  <span style={{ marginLeft: 8 }}>商品管理</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Switch defaultChecked={editingRole.permissions.includes('order')} />
                  <span style={{ marginLeft: 8 }}>订单管理</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Switch defaultChecked={editingRole.permissions.includes('marketing')} />
                  <span style={{ marginLeft: 8 }}>营销管理</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Switch defaultChecked={editingRole.permissions.includes('finance')} />
                  <span style={{ marginLeft: 8 }}>财务管理</span>
                </div>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}