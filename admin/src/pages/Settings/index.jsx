import React, { useState } from 'react';
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Checkbox,
  Progress,
  Card,
  Typography,
  Divider,
  Message,
  Popconfirm,
  Select,
  Descriptions,
  Grid,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconDelete,
  IconEdit,
  IconPlayArrow,
  IconStorage,
  IconCheckCircle,
  IconExclamationCircle,
  IconInfoCircle,
} from '@arco-design/web-react/icon';

const TabPane = Tabs.TabPane;
const FormItem = Form.Item;
const { Title, Text, Paragraph } = Typography;
const { Row, Col } = Grid;

// ===================== MOCK DATA =====================

// 店铺数据
const mockShops = [
  {
    id: 1,
    platform: '抖店',
    name: '潮流服饰旗舰店',
    authStatus: 'active',
    tokenExpire: '2026-07-20 18:00:00',
  },
  {
    id: 2,
    platform: '快手',
    name: '优选好物集合店',
    authStatus: 'active',
    tokenExpire: '2026-06-15 12:30:00',
  },
  {
    id: 3,
    platform: '拼多多',
    name: '特惠家居专营店',
    authStatus: 'expired',
    tokenExpire: '2026-03-01 00:00:00',
  },
  {
    id: 4,
    platform: '抖店',
    name: '数码配件直销店',
    authStatus: 'pending',
    tokenExpire: '-',
  },
  {
    id: 5,
    platform: '闲鱼',
    name: '闲置好物转让铺',
    authStatus: 'active',
    tokenExpire: '2026-12-31 23:59:59',
  },
];

// 定时任务数据
const mockCronJobs = [
  {
    id: 1,
    name: '订单同步',
    frequency: '每5分钟',
    status: 'running',
    lastRun: '2026-04-20 20:18:00',
    nextRun: '2026-04-20 20:23:00',
    enabled: true,
  },
  {
    id: 2,
    name: '库存同步',
    frequency: '每15分钟',
    status: 'running',
    lastRun: '2026-04-20 20:15:00',
    nextRun: '2026-04-20 20:30:00',
    enabled: true,
  },
  {
    id: 3,
    name: '销量报表生成',
    frequency: '每天 08:00',
    status: 'idle',
    lastRun: '2026-04-20 08:00:00',
    nextRun: '2026-04-21 08:00:00',
    enabled: true,
  },
  {
    id: 4,
    name: '竞品价格爬取',
    frequency: '每小时',
    status: 'error',
    lastRun: '2026-04-20 19:00:00',
    nextRun: '2026-04-20 20:00:00',
    enabled: true,
  },
  {
    id: 5,
    name: '客服消息归档',
    frequency: '每天 23:00',
    status: 'idle',
    lastRun: '2026-04-19 23:00:00',
    nextRun: '2026-04-20 23:00:00',
    enabled: false,
  },
  {
    id: 6,
    name: '退款监控',
    frequency: '每10分钟',
    status: 'running',
    lastRun: '2026-04-20 20:10:00',
    nextRun: '2026-04-20 20:20:00',
    enabled: true,
  },
];

// 系统信息
const mockSystemInfo = {
  version: 'v1.4.2',
  buildTime: '2026-04-18 14:32:00',
  uptime: '7天 14小时 32分钟',
  dbStatus: 'healthy',
  dbVersion: 'MySQL 8.0.36',
  dbConnections: 12,
  redisStatus: 'healthy',
  redisVersion: 'Redis 7.2.4',
  redisMemory: '256MB / 1GB',
  diskUsage: 67,
  diskTotal: '500GB',
  diskUsed: '335GB',
  cpuCores: 8,
  cpuUsage: 23,
  memUsage: 58,
  memTotal: '32GB',
};

// 通知事件选项
const notificationEvents = [
  { label: '订单异常', value: 'order_abnormal' },
  { label: '退款激增', value: 'refund_surge' },
  { label: '客服投诉', value: 'cs_complaint' },
  { label: '系统告警', value: 'system_alert' },
  { label: '库存不足', value: 'low_stock' },
  { label: 'Token过期', value: 'token_expired' },
];

// ===================== 状态标签映射 =====================

const authStatusMap = {
  active: { color: 'green', text: '已授权' },
  expired: { color: 'red', text: '已过期' },
  pending: { color: 'orange', text: '待授权' },
};

const jobStatusMap = {
  running: { color: 'green', text: '运行中' },
  idle: { color: 'gray', text: '空闲' },
  error: { color: 'red', text: '异常' },
};

const platformColors = {
  抖店: 'blue',
  快手: 'orange',
  拼多多: 'red',
  闲鱼: 'gold',
};

// ===================== TAB 1: 店铺管理 =====================

function ShopManagement() {
  const [shops, setShops] = useState(mockShops);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleDelete = (id) => {
    setShops(shops.filter((s) => s.id !== id));
    Message.success('店铺已删除');
  };

  const handleReAuth = (record) => {
    Message.info(`正在重新授权【${record.name}】...`);
    setTimeout(() => {
      setShops(
        shops.map((s) =>
          s.id === record.id
            ? { ...s, authStatus: 'active', tokenExpire: '2027-04-20 20:00:00' }
            : s
        )
      );
      Message.success('重新授权成功');
    }, 1500);
  };

  const handleAddShop = () => {
    form.validate().then((values) => {
      const newShop = {
        id: Date.now(),
        platform: values.platform,
        name: values.name,
        authStatus: 'pending',
        tokenExpire: '-',
      };
      setShops([...shops, newShop]);
      setAddModalVisible(false);
      form.resetFields();
      Message.success('店铺添加成功，请完成授权');
    });
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      render: (platform) => (
        <Tag color={platformColors[platform] || 'gray'} bordered>
          {platform}
        </Tag>
      ),
    },
    {
      title: '店铺名',
      dataIndex: 'name',
      render: (text) => <Text bold>{text}</Text>,
    },
    {
      title: '授权状态',
      dataIndex: 'authStatus',
      render: (status) => {
        const config = authStatusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Token过期时间',
      dataIndex: 'tokenExpire',
      render: (text) => (
        <Text style={{ color: text === '-' ? '#86909c' : 'inherit' }}>{text}</Text>
      ),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconRefresh />}
            onClick={() => handleReAuth(record)}
          >
            重新授权
          </Button>
          <Popconfirm
            title="确定删除该店铺？删除后无法恢复"
            onOk={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" status="danger" icon={<IconDelete />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">管理已授权的电商店铺，支持添加、删除和重新授权</Text>
        <Button type="primary" icon={<IconPlus />} onClick={() => setAddModalVisible(true)}>
          添加店铺
        </Button>
      </div>
      <Table
        columns={columns}
        data={shops}
        rowKey="id"
        pagination={false}
        border={{ wrapper: true, cell: true }}
      />
      <Modal
        title="添加店铺"
        visible={addModalVisible}
        onOk={handleAddShop}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        unmountOnExit
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="平台"
            field="platform"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择电商平台">
              <Select.Option value="抖店">抖店</Select.Option>
              <Select.Option value="快手">快手</Select.Option>
              <Select.Option value="拼多多">拼多多</Select.Option>
              <Select.Option value="闲鱼">闲鱼</Select.Option>
            </Select>
          </FormItem>
          <FormItem
            label="店铺名称"
            field="name"
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input placeholder="请输入店铺名称" maxLength={50} showWordLimit />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}

// ===================== TAB 2: 平台配置 =====================

function PlatformConfig() {
  const [douyinForm] = Form.useForm();
  const [kuaishouForm] = Form.useForm();
  const [pddForm] = Form.useForm();
  const [xianyuForm] = Form.useForm();

  const initialValues = {
    douyin: {
      appKey: 'dy_20260420_xxxxx',
      appSecret: '••••••••••••••••',
      callbackUrl: 'https://api.example.com/callback/douyin',
    },
    kuaishou: {
      appKey: 'ks_20260315_yyyyy',
      appSecret: '••••••••••••••••',
      callbackUrl: 'https://api.example.com/callback/kuaishou',
    },
    pdd: {
      clientId: 'pdd_20260201_zzzzz',
      clientSecret: '••••••••••••••••',
      callbackUrl: 'https://api.example.com/callback/pdd',
    },
    xianyu: {
      appKey: 'xy_20260101_wwwww',
      appSecret: '••••••••••••••••',
      callbackUrl: 'https://api.example.com/callback/xianyu',
    },
  };

  const handleSave = (platform, formRef) => {
    formRef.validate().then(() => {
      Message.success(`${platform}配置保存成功`);
    });
  };

  const handleTestConnection = (platform) => {
    Message.loading({ content: `正在测试${platform}连接...`, duration: 1500 });
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        Message.success(`${platform}连接测试成功`);
      } else {
        Message.error(`${platform}连接测试失败，请检查配置`);
      }
    }, 1800);
  };

  const renderPlatformForm = (title, formRef, fields, platformName) => (
    <Card title={title} bordered={false} style={{ marginBottom: 16 }}>
      <Form form={formRef} layout="vertical" initialValues={fields}>
        {Object.entries(fields).map(([key, _]) => {
          const labelMap = {
            appKey: 'App Key',
            appSecret: 'App Secret',
            callbackUrl: '回调 URL',
            clientId: 'Client ID',
            clientSecret: 'Client Secret',
          };
          const isSecret = key.toLowerCase().includes('secret');
          return (
            <FormItem
              key={key}
              label={labelMap[key] || key}
              field={key}
              rules={[
                { required: true, message: `请输入${labelMap[key] || key}` },
              ]}
            >
              {isSecret ? (
                <Input.Password placeholder={`请输入${labelMap[key] || key}`} />
              ) : key === 'callbackUrl' ? (
                <Input placeholder="https://your-domain.com/callback/xxx" />
              ) : (
                <Input placeholder={`请输入${labelMap[key] || key}`} />
              )}
            </FormItem>
          );
        })}
        <FormItem>
          <Space>
            <Button type="primary" onClick={() => handleSave(platformName, formRef)}>
              保存配置
            </Button>
            <Button onClick={() => handleTestConnection(platformName)}>
              测试连接
            </Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  );

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        配置各电商平台的API密钥和回调地址
      </Text>
      {renderPlatformForm('抖店配置', douyinForm, initialValues.douyin, '抖店')}
      {renderPlatformForm('快手配置', kuaishouForm, initialValues.kuaishou, '快手')}
      {renderPlatformForm('拼多多配置', pddForm, initialValues.pdd, '拼多多')}
      {renderPlatformForm('闲鱼配置', xianyuForm, initialValues.xianyu, '闲鱼')}
    </div>
  );
}

// ===================== TAB 3: 通知设置 =====================

function NotificationSettings() {
  const [form] = Form.useForm();

  const initialNotification = {
    wechatWebhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc-123',
    feishuWebhook:
      'https://open.feishu.cn/open-apis/bot/v2/hook/xxxx-yyyy',
    telegramBotToken: '',
    telegramChatId: '',
    emailSmtp: 'smtp.example.com',
    emailPort: '465',
    emailUser: 'alert@example.com',
    emailPassword: '',
    emailRecipients: 'admin@example.com, ops@example.com',
    events: ['order_abnormal', 'refund_surge', 'system_alert'],
  };

  const handleSave = () => {
    form.validate().then((values) => {
      console.log('通知配置：', values);
      Message.success('通知设置保存成功');
    });
  };

  const handleTestNotification = (type) => {
    Message.loading({ content: `正在发送${type}测试通知...`, duration: 1200 });
    setTimeout(() => {
      Message.success(`${type}测试通知发送成功`);
    }, 1500);
  };

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        配置消息通知渠道，当系统触发告警事件时自动推送
      </Text>
      <Form form={form} layout="vertical" initialValues={initialNotification}>
        <Card title="企业微信" bordered={false} style={{ marginBottom: 16 }}>
          <FormItem
            label="Webhook URL"
            field="wechatWebhook"
            rules={[
              { required: true, message: '请输入企业微信Webhook URL' },
              {
                match: /^https?:\/\/.+/,
                message: '请输入有效的URL',
              },
            ]}
          >
            <Input placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx" />
          </FormItem>
          <FormItem>
            <Button onClick={() => handleTestNotification('企业微信')}>发送测试消息</Button>
          </FormItem>
        </Card>

        <Card title="飞书" bordered={false} style={{ marginBottom: 16 }}>
          <FormItem
            label="Webhook URL"
            field="feishuWebhook"
            rules={[{ required: true, message: '请输入飞书Webhook URL' }]}
          >
            <Input placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx" />
          </FormItem>
          <FormItem>
            <Button onClick={() => handleTestNotification('飞书')}>发送测试消息</Button>
          </FormItem>
        </Card>

        <Card title="Telegram" bordered={false} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                label="Bot Token"
                field="telegramBotToken"
                rules={[{ required: true, message: '请输入Bot Token' }]}
              >
                <Input.Password placeholder="123456:ABC-DEF..." />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label="Chat ID"
                field="telegramChatId"
                rules={[{ required: true, message: '请输入Chat ID' }]}
              >
                <Input placeholder="-100xxxxxxxxxx" />
              </FormItem>
            </Col>
          </Row>
          <FormItem>
            <Button onClick={() => handleTestNotification('Telegram')}>发送测试消息</Button>
          </FormItem>
        </Card>

        <Card title="邮件通知" bordered={false} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                label="SMTP 服务器"
                field="emailSmtp"
                rules={[{ required: true, message: '请输入SMTP服务器' }]}
              >
                <Input placeholder="smtp.example.com" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label="端口"
                field="emailPort"
                rules={[{ required: true, message: '请输入端口号' }]}
              >
                <Input placeholder="465" />
              </FormItem>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                label="发件邮箱"
                field="emailUser"
                rules={[
                  { required: true, message: '请输入发件邮箱' },
                  { type: 'email', message: '邮箱格式不正确' },
                ]}
              >
                <Input placeholder="alert@example.com" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                label="邮箱密码"
                field="emailPassword"
                rules={[{ required: true, message: '请输入邮箱密码' }]}
              >
                <Input.Password placeholder="请输入邮箱密码或授权码" />
              </FormItem>
            </Col>
          </Row>
          <FormItem
            label="收件人"
            field="emailRecipients"
            rules={[{ required: true, message: '请输入收件人邮箱' }]}
            extra="多个邮箱用逗号分隔"
          >
            <Input placeholder="admin@example.com, ops@example.com" />
          </FormItem>
          <FormItem>
            <Button onClick={() => handleTestNotification('邮件')}>发送测试邮件</Button>
          </FormItem>
        </Card>

        <Card title="通知事件" bordered={false} style={{ marginBottom: 16 }}>
          <FormItem
            label="选择需要接收通知的事件类型"
            field="events"
            rules={[
              {
                type: 'array',
                minLength: 1,
                message: '请至少选择一个通知事件',
              },
            ]}
          >
            <Checkbox.Group options={notificationEvents} />
          </FormItem>
        </Card>

        <FormItem>
          <Button type="primary" size="large" onClick={handleSave}>
            保存通知设置
          </Button>
        </FormItem>
      </Form>
    </div>
  );
}

// ===================== TAB 4: 定时任务 =====================

function CronJobManagement() {
  const [jobs, setJobs] = useState(mockCronJobs);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [editForm] = Form.useForm();

  const handleToggle = (id, enabled) => {
    setJobs(
      jobs.map((j) =>
        j.id === id
          ? { ...j, enabled, status: enabled ? 'running' : 'idle' }
          : j
      )
    );
    Message.success(enabled ? '任务已启用' : '任务已禁用');
  };

  const handleExecute = (record) => {
    Message.loading({ content: `正在执行【${record.name}】...`, duration: 2000 });
    setTimeout(() => {
      setJobs(
        jobs.map((j) =>
          j.id === record.id
            ? {
                ...j,
                lastRun: new Date().toLocaleString('zh-CN', { hour12: false }),
                status: 'running',
              }
            : j
        )
      );
      Message.success(`【${record.name}】执行完成`);
    }, 2500);
  };

  const handleEdit = (record) => {
    setCurrentJob(record);
    editForm.setFieldsValue({
      name: record.name,
      frequency: record.frequency,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    editForm.validate().then((values) => {
      setJobs(
        jobs.map((j) =>
          j.id === currentJob.id ? { ...j, ...values } : j
        )
      );
      setEditModalVisible(false);
      Message.success('任务更新成功');
    });
  };

  const columns = [
    {
      title: '任务名',
      dataIndex: 'name',
      render: (text) => <Text bold>{text}</Text>,
    },
    {
      title: '频率',
      dataIndex: 'frequency',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const config = jobStatusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '上次执行',
      dataIndex: 'lastRun',
      render: (text) => (
        <Text style={{ fontSize: 12, color: '#4e5969' }}>{text}</Text>
      ),
    },
    {
      title: '下次执行',
      dataIndex: 'nextRun',
      render: (text) => (
        <Text style={{ fontSize: 12, color: '#4e5969' }}>{text}</Text>
      ),
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Switch
            checked={record.enabled}
            checkedText="启用"
            uncheckedText="禁用"
            size="small"
            onChange={(val) => handleToggle(record.id, val)}
          />
          <Button
            type="text"
            size="small"
            icon={<IconPlayArrow />}
            onClick={() => handleExecute(record)}
            disabled={!record.enabled}
          >
            立即执行
          </Button>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">管理系统定时任务，支持启用/禁用、立即执行和编辑</Text>
      </div>
      <Table
        columns={columns}
        data={jobs}
        rowKey="id"
        pagination={false}
        border={{ wrapper: true, cell: true }}
      />
      <Modal
        title="编辑定时任务"
        visible={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        unmountOnExit
      >
        <Form form={editForm} layout="vertical">
          <FormItem
            label="任务名称"
            field="name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </FormItem>
          <FormItem
            label="执行频率"
            field="frequency"
            rules={[{ required: true, message: '请输入执行频率' }]}
          >
            <Select placeholder="请选择执行频率">
              <Select.Option value="每1分钟">每1分钟</Select.Option>
              <Select.Option value="每5分钟">每5分钟</Select.Option>
              <Select.Option value="每10分钟">每10分钟</Select.Option>
              <Select.Option value="每15分钟">每15分钟</Select.Option>
              <Select.Option value="每30分钟">每30分钟</Select.Option>
              <Select.Option value="每小时">每小时</Select.Option>
              <Select.Option value="每天 08:00">每天 08:00</Select.Option>
              <Select.Option value="每天 12:00">每天 12:00</Select.Option>
              <Select.Option value="每天 23:00">每天 23:00</Select.Option>
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}

// ===================== TAB 5: 系统信息 =====================

function SystemInfo() {
  const info = mockSystemInfo;

  const statusIcon = (status) => {
    if (status === 'healthy') {
      return <IconCheckCircle style={{ color: '#00b42a', marginRight: 4 }} />;
    }
    return <IconExclamationCircle style={{ color: '#f53f3f', marginRight: 4 }} />;
  };

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        查看系统运行状态和资源使用情况
      </Text>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="基本概况" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions
              column={1}
              data={[
                { label: '版本号', value: info.version },
                { label: '构建时间', value: info.buildTime },
                { label: '运行时间', value: info.uptime },
                { label: 'CPU 核数', value: `${info.cpuCores} 核` },
              ]}
              labelStyle={{ fontWeight: 500 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="资源使用" bordered={false} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>CPU 使用率</Text>
                <Text bold>{info.cpuUsage}%</Text>
              </div>
              <Progress
                percent={info.cpuUsage}
                color={info.cpuUsage > 80 ? '#f53f3f' : info.cpuUsage > 60 ? '#ff7d00' : '#00b42a'}
                size="small"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>内存使用率 ({info.memTotal})</Text>
                <Text bold>{info.memUsage}%</Text>
              </div>
              <Progress
                percent={info.memUsage}
                color={info.memUsage > 80 ? '#f53f3f' : info.memUsage > 60 ? '#ff7d00' : '#00b42a'}
                size="small"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>磁盘使用 ({info.diskUsed} / {info.diskTotal})</Text>
                <Text bold>{info.diskUsage}%</Text>
              </div>
              <Progress
                percent={info.diskUsage}
                color={info.diskUsage > 80 ? '#f53f3f' : info.diskUsage > 60 ? '#ff7d00' : '#00b42a'}
                size="small"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="数据库状态" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions
              column={1}
              data={[
                {
                  label: '状态',
                  value: (
                    <span>
                      {statusIcon(info.dbStatus)}
                      <Tag color="green">正常</Tag>
                    </span>
                  ),
                },
                { label: '版本', value: info.dbVersion },
                { label: '活跃连接数', value: `${info.dbConnections}` },
              ]}
              labelStyle={{ fontWeight: 500 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Redis 状态" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions
              column={1}
              data={[
                {
                  label: '状态',
                  value: (
                    <span>
                      {statusIcon(info.redisStatus)}
                      <Tag color="green">正常</Tag>
                    </span>
                  ),
                },
                { label: '版本', value: info.redisVersion },
                { label: '内存使用', value: info.redisMemory },
              ]}
              labelStyle={{ fontWeight: 500 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ===================== 主页面 =====================

export default function Settings() {
  return (
    <div>
      <Title heading={4} style={{ marginBottom: 20 }}>
        系统设置
      </Title>
      <Card bordered={false}>
        <Tabs defaultActiveTab="1" type="rounded">
          <TabPane key="1" title="店铺管理">
            <ShopManagement />
          </TabPane>
          <TabPane key="2" title="平台配置">
            <PlatformConfig />
          </TabPane>
          <TabPane key="3" title="通知设置">
            <NotificationSettings />
          </TabPane>
          <TabPane key="4" title="定时任务">
            <CronJobManagement />
          </TabPane>
          <TabPane key="5" title="系统信息">
            <SystemInfo />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
