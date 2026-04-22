import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Tabs,
  DatePicker,
  Select,
  Space,
  Button,
  List,
  Avatar,
  Typography,
  Divider,
  Alert,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Descriptions,
  Drawer,
  Tooltip,
  Dropdown,
  Menu,
  Badge,
  Radio,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  AccountBookOutlined,
  WalletOutlined,
  BankOutlined,
  ExportOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  SettingOutlined,
  MoreOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 模拟收支数据
const generateTransactions = (count = 100) => {
  const types = [
    { key: 'income', label: '收入', color: 'green' },
    { key: 'expense', label: '支出', color: 'red' },
  ];
  const sources = [
    '抖音订单', '拼多多订单', '闲鱼订单', '快手订单',
    '提现手续费', '平台服务费', '广告推广费', '物流费用',
    '退款支出', '赔偿支出', '保证金', '其他',
  ];
  const statuses = [
    { key: 'completed', label: '已完成', color: 'success' },
    { key: 'pending', label: '处理中', color: 'processing' },
    { key: 'failed', label: '失败', color: 'error' },
  ];

  const transactions = [];
  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = type.key === 'income'
      ? Math.floor(Math.random() * 5000) + 100
      : Math.floor(Math.random() * 2000) + 50;
    const date = dayjs().subtract(Math.floor(Math.random() * 30), 'day');

    transactions.push({
      id: `TX${String(i).padStart(6, '0')}`,
      date: date.format('YYYY-MM-DD HH:mm:ss'),
      type: type.key,
      typeName: type.label,
      typeColor: type.color,
      amount,
      source,
      status: status.key,
      statusName: status.label,
      statusColor: status.color,
      orderId: type.key === 'income' ? `DD${String(Math.floor(Math.random() * 10000)).padStart(6, '0')}` : null,
      remark: '',
    });
  }
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// 模拟提现记录
const generateWithdrawals = (count = 20) => {
  const statuses = [
    { key: 'pending', label: '待审核', color: 'warning' },
    { key: 'processing', label: '处理中', color: 'processing' },
    { key: 'completed', label: '已完成', color: 'success' },
    { key: 'rejected', label: '已拒绝', color: 'error' },
  ];
  const banks = ['中国银行', '工商银行', '建设银行', '农业银行', '招商银行'];

  const withdrawals = [];
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000;
    const date = dayjs().subtract(Math.floor(Math.random() * 30), 'day');

    withdrawals.push({
      id: `WD${String(i).padStart(6, '0')}`,
      date: date.format('YYYY-MM-DD HH:mm:ss'),
      amount,
      bank: banks[Math.floor(Math.random() * banks.length)],
      cardNo: `**** **** **** ${String(Math.floor(Math.random() * 9000) + 1000)}`,
      status: status.key,
      statusName: status.label,
      statusColor: status.color,
      fee: Math.floor(amount * 0.001),
      arrivalDate: date.add(1, 'day').format('YYYY-MM-DD'),
    });
  }
  return withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// 模拟对账数据
const generateReconciliations = (count = 30) => {
  const platforms = [
    { key: 'douyin', name: '抖音', color: '#165DFF' },
    { key: 'pdd', name: '拼多多', color: '#F53F3F' },
    { xianyu: 'xianyu', name: '闲鱼', color: '#FF7D00' },
    { key: 'kuaishou', name: '快手', color: '#722ED1' },
  ];
  const statuses = [
    { key: 'reconciled', label: '已对账', color: 'success' },
    { key: 'pending', label: '待对账', color: 'warning' },
    { key: 'exception', label: '异常', color: 'error' },
  ];

  const reconciliations = [];
  for (let i = 1; i <= count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const orderCount = Math.floor(Math.random() * 200) + 50;
    const amount = Math.floor(Math.random() * 100000) + 10000;
    const platformAmount = status.key === 'exception'
      ? amount + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 1000)
      : amount;
    const date = dayjs().subtract(Math.floor(Math.random() * 30), 'day');

    reconciliations.push({
      id: `RC${String(i).padStart(6, '0')}`,
      date: date.format('YYYY-MM-DD'),
      platform: platform.key,
      platformName: platform.name,
      platformColor: platform.color,
      orderCount,
      amount,
      platformAmount,
      difference: platformAmount - amount,
      status: status.key,
      statusName: status.label,
      statusColor: status.color,
    });
  }
  return reconciliations.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// 生成趋势数据
const generateTrendData = (days = 30) => {
  const data = [];
  const baseDate = dayjs().subtract(days, 'day');

  for (let i = 0; i < days; i++) {
    const date = baseDate.add(i, 'day').format('MM-DD');
    data.push({
      date,
      income: Math.floor(Math.random() * 50000) + 10000,
      expense: Math.floor(Math.random() * 20000) + 5000,
    });
  }
  return data;
};

export default function Finance() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDrawerVisible, setTransactionDrawerVisible] = useState(false);

  // 筛选条件
  const [transactionFilter, setTransactionFilter] = useState({
    type: 'all',
    status: 'all',
    dateRange: null,
    source: 'all',
  });

  const [form] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTransactions(generateTransactions());
      setWithdrawals(generateWithdrawals());
      setReconciliations(generateReconciliations());
      setTrendData(generateTrendData());
      setLoading(false);
    }, 500);
  }, []);

  // 计算统计数据
  const todayIncome = transactions
    .filter(t => t.type === 'income' && dayjs(t.date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'))
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = transactions
    .filter(t => t.type === 'expense' && dayjs(t.date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingSettlement = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const withdrawableAmount = Math.max(0, 125680 - withdrawals
    .filter(w => w.status !== 'rejected')
    .reduce((sum, w) => sum + w.amount + w.fee, 0));

  // 收支趋势图配置
  const lineConfig = {
    data: trendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    line: {
      lineWidth: 2,
    },
    point: {
      size: 3,
      shape: 'circle',
    },
    color: ['#165DFF', '#F53F3F'],
    legend: {
      position: 'top',
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

  // 收入来源分布图配置
  const pieConfig = {
    data: [
      { type: '抖音订单', value: 35 },
      { type: '拼多多订单', value: 25 },
      { type: '闲鱼订单', value: 20 },
      { type: '快手订单', value: 15 },
      { type: '其他', value: 5 },
    ],
    angleField: 'value',
    colorField: 'type',
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
    color: ['#165DFF', '#F53F3F', '#FF7D00', '#722ED1', '#00B42A'],
  };

  // 收支明细表格列
  const transactionColumns = [
    {
      title: '交易时间',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'type',
      width: 80,
      render: (text, record) => (
        <Tag color={record.typeColor}>{text}</Tag>
      ),
      filters: [
        { text: '收入', value: 'income' },
        { text: '支出', value: 'expense' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val, record) => (
        <Text style={{ color: record.type === 'income' ? '#00B42A' : '#F53F3F' }}>
          {record.type === 'income' ? '+' : '-'}¥{val.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      filters: [
        { text: '抖音订单', value: '抖音订单' },
        { text: '拼多多订单', value: '拼多多订单' },
        { text: '闲鱼订单', value: '闲鱼订单' },
        { text: '快手订单', value: '快手订单' },
        { text: '提现手续费', value: '提现手续费' },
        { text: '平台服务费', value: '平台服务费' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'status',
      width: 100,
      render: (text, record) => (
        <Tag color={record.statusColor}>{text}</Tag>
      ),
      filters: [
        { text: '已完成', value: 'completed' },
        { text: '处理中', value: 'pending' },
        { text: '失败', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => {
          setSelectedTransaction(record);
          setTransactionDrawerVisible(true);
        }}>
          详情
        </Button>
      ),
    },
  ];

  // 提现记录表格列
  const withdrawalColumns = [
    {
      title: '申请时间',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      render: (val) => `¥${val.toLocaleString()}`,
    },
    {
      title: '到账银行',
      dataIndex: 'bank',
      key: 'bank',
      width: 120,
    },
    {
      title: '银行卡号',
      dataIndex: 'cardNo',
      key: 'cardNo',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'status',
      width: 100,
      render: (text, record) => (
        <Tag color={record.statusColor}>{text}</Tag>
      ),
      filters: [
        { text: '待审核', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已完成', value: 'completed' },
        { text: '已拒绝', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '预计到账',
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Dropdown overlay={
          <Menu>
            <Menu.Item key="view" icon={<EyeOutlined />}>查看详情</Menu.Item>
            {record.status === 'pending' && (
              <Menu.Item key="cancel" icon={<CloseCircleOutlined />} style={{ color: '#F53F3F' }}>
                取消申请
              </Menu.Item>
            )}
          </Menu>
        }>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // 对账记录表格列
  const reconciliationColumns = [
    {
      title: '对账日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: '平台',
      dataIndex: 'platformName',
      key: 'platform',
      width: 100,
      render: (text, record) => (
        <Tag color={record.platformColor}>{text}</Tag>
      ),
      filters: [
        { text: '抖音', value: 'douyin' },
        { text: '拼多多', value: 'pdd' },
        { text: '闲鱼', value: 'xianyu' },
        { text: '快手', value: 'kuaishou' },
      ],
      onFilter: (value, record) => record.platform === value,
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      sorter: (a, b) => a.orderCount - b.orderCount,
    },
    {
      title: '系统金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '平台金额',
      dataIndex: 'platformAmount',
      key: 'platformAmount',
      width: 120,
      render: (val) => `¥${val.toLocaleString()}`,
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      width: 120,
      render: (val) => (
        <Text style={{ color: val === 0 ? '#00B42A' : '#F53F3F' }}>
          {val === 0 ? '¥0' : `${val > 0 ? '+' : ''}¥${val.toLocaleString()}`}
        </Text>
      ),
      sorter: (a, b) => a.difference - b.difference,
    },
    {
      title: '状态',
      dataIndex: 'statusName',
      key: 'status',
      width: 100,
      render: (text, record) => (
        <Tag color={record.statusColor}>{text}</Tag>
      ),
      filters: [
        { text: '已对账', value: 'reconciled' },
        { text: '待对账', value: 'pending' },
        { text: '异常', value: 'exception' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">详情</Button>
          {record.status === 'exception' && (
            <Button type="link" size="small" style={{ color: '#FF7D00' }}>处理异常</Button>
          )}
          <Button type="link" size="small" icon={<DownloadOutlined />}>导出</Button>
        </Space>
      ),
    },
  ];

  // 处理提现申请
  const handleWithdraw = (values) => {
    console.log('提现申请:', values);
    message.success('提现申请已提交');
    setWithdrawModalVisible(false);
    form.resetFields();
  };

  // 导出对账单
  const handleExportReconciliation = (platform) => {
    message.success(`正在导出${platform ? platform.platformName : '全部'}对账单...`);
  };

  // 渲染顶部统计卡片
  const renderStatCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="今日收入"
            value={todayIncome}
            precision={2}
            valueStyle={{ color: '#00B42A' }}
            prefix={<ArrowUpOutlined />}
            suffix="元"
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">较昨日</Text>
            <Tag color="green" style={{ marginLeft: 8 }}>
              <ArrowUpOutlined /> 12.5%
            </Tag>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="今日支出"
            value={todayExpense}
            precision={2}
            valueStyle={{ color: '#F53F3F' }}
            prefix={<ArrowDownOutlined />}
            suffix="元"
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">较昨日</Text>
            <Tag color="red" style={{ marginLeft: 8 }}>
              <ArrowDownOutlined /> 3.2%
            </Tag>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="待结算金额"
            value={pendingSettlement}
            precision={2}
            valueStyle={{ color: '#FF7D00' }}
            prefix={<ClockCircleOutlined />}
            suffix="元"
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">预计1-3个工作日到账</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="可提现金额"
            value={withdrawableAmount}
            precision={2}
            valueStyle={{ color: '#165DFF' }}
            prefix={<WalletOutlined />}
            suffix="元"
          />
          <div style={{ marginTop: 8 }}>
            <Button type="link" size="small" onClick={() => setWithdrawModalVisible(true)}>
              立即提现
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  );

  // 渲染收支明细内容
  const renderTransactions = () => (
    <div>
      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="交易类型"
              style={{ width: '100%' }}
              value={transactionFilter.type}
              onChange={(value) => setTransactionFilter({ ...transactionFilter, type: value })}
            >
              <Option value="all">全部类型</Option>
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="交易状态"
              style={{ width: '100%' }}
              value={transactionFilter.status}
              onChange={(value) => setTransactionFilter({ ...transactionFilter, status: value })}
            >
              <Option value="all">全部状态</Option>
              <Option value="completed">已完成</Option>
              <Option value="pending">处理中</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<SyncOutlined />}>重置</Button>
              <Button icon={<ExportOutlined />}>导出</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="收支趋势" loading={loading}>
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="收入来源分布" loading={loading}>
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* 表格 */}
      <Card title="收支明细">
        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            total: transactions.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );

  // 渲染提现管理内容
  const renderWithdrawals = () => (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>可提现金额：</Text>
              <Text style={{ color: '#165DFF', fontSize: 18, fontWeight: 'bold' }}>
                ¥{withdrawableAmount.toLocaleString()}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setWithdrawModalVisible(true)}>
                申请提现
              </Button>
              <Button icon={<SettingOutlined />} onClick={() => setAccountDrawerVisible(true)}>
                提现账户设置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 提现记录 */}
      <Card title="提现记录">
        <Table
          columns={withdrawalColumns}
          dataSource={withdrawals}
          rowKey="id"
          loading={loading}
          pagination={{
            total: withdrawals.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );

  // 渲染对账管理内容
  const renderReconciliations = () => (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Text strong>对账统计：</Text>
              <Tag color="success">已对账: {reconciliations.filter(r => r.status === 'reconciled').length}</Tag>
              <Tag color="warning">待对账: {reconciliations.filter(r => r.status === 'pending').length}</Tag>
              <Tag color="error">异常: {reconciliations.filter(r => r.status === 'exception').length}</Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SyncOutlined />}>开始对账</Button>
              <Button icon={<DownloadOutlined />} onClick={() => handleExportReconciliation(null)}>
                导出全部对账单
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 对账记录 */}
      <Card title="对账记录">
        <Table
          columns={reconciliationColumns}
          dataSource={reconciliations}
          rowKey="id"
          loading={loading}
          pagination={{
            total: reconciliations.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );

  return (
    <div className="finance">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>财务中心</Title>
        <Space>
          <Button icon={<SyncOutlined />} onClick={() => {
            setLoading(true);
            setTimeout(() => {
              setTransactions(generateTransactions());
              setWithdrawals(generateWithdrawals());
              setReconciliations(generateReconciliations());
              setLoading(false);
            }, 500);
          }}>
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      {renderStatCards()}

      {/* 标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="收支明细" key="transactions">
            {renderTransactions()}
          </TabPane>
          <TabPane tab="提现管理" key="withdrawals">
            {renderWithdrawals()}
          </TabPane>
          <TabPane tab="对账管理" key="reconciliations">
            {renderReconciliations()}
          </TabPane>
        </Tabs>
      </Card>

      {/* 提现申请弹窗 */}
      <Modal
        title="申请提现"
        open={withdrawModalVisible}
        onCancel={() => {
          setWithdrawModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleWithdraw}>
          <Alert
            message={`可提现金额：¥${withdrawableAmount.toLocaleString()}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { type: 'number', min: 100, message: '最低提现金额为100元' },
              { type: 'number', max: withdrawableAmount, message: '提现金额不能超过可提现金额' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
              placeholder="请输入提现金额"
            />
          </Form.Item>
          <Form.Item
            name="bank"
            label="到账银行"
            rules={[{ required: true, message: '请选择到账银行' }]}
          >
            <Select placeholder="请选择到账银行">
              <Option value="中国银行">中国银行 (尾号1234)</Option>
              <Option value="工商银行">工商银行 (尾号5678)</Option>
              <Option value="建设银行">建设银行 (尾号9012)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="交易密码"
            rules={[{ required: true, message: '请输入交易密码' }]}
          >
            <Input.Password placeholder="请输入交易密码" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认提现
              </Button>
              <Button onClick={() => {
                setWithdrawModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 提现账户设置抽屉 */}
      <Drawer
        title="提现账户设置"
        width={500}
        open={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
      >
        <Alert
          message="账户安全提示"
          description="为了您的资金安全，请确保绑定的银行卡信息准确无误。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Card title="已绑定银行卡" style={{ marginBottom: 16 }}>
          <List
            itemLayout="horizontal"
            dataSource={[
              { bank: '中国银行', cardNo: '**** **** **** 1234', name: '张三', isDefault: true },
              { bank: '工商银行', cardNo: '**** **** **** 5678', name: '张三', isDefault: false },
            ]}
            renderItem={(item) => (
              <List.Item
                actions={[
                  item.isDefault ? (
                    <Tag color="blue">默认</Tag>
                  ) : (
                    <Button type="link" size="small">设为默认</Button>
                  ),
                  <Button type="link" size="small" style={{ color: '#F53F3F' }}>解绑</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<BankOutlined />} style={{ backgroundColor: '#165DFF' }} />}
                  title={item.bank}
                  description={item.cardNo}
                />
              </List.Item>
            )}
          />
          <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 16 }}>
            添加银行卡
          </Button>
        </Card>
        <Card title="交易密码设置">
          <Paragraph type="secondary">
            交易密码用于提现等敏感操作，请定期更换以保证账户安全。
          </Paragraph>
          <Button type="primary">修改交易密码</Button>
        </Card>
      </Drawer>

      {/* 交易详情抽屉 */}
      <Drawer
        title="交易详情"
        width={500}
        open={transactionDrawerVisible}
        onClose={() => setTransactionDrawerVisible(false)}
      >
        {selectedTransaction && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="交易编号">{selectedTransaction.id}</Descriptions.Item>
            <Descriptions.Item label="交易时间">{selectedTransaction.date}</Descriptions.Item>
            <Descriptions.Item label="交易类型">
              <Tag color={selectedTransaction.typeColor}>{selectedTransaction.typeName}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="交易金额">
              <Text style={{ color: selectedTransaction.type === 'income' ? '#00B42A' : '#F53F3F', fontSize: 18, fontWeight: 'bold' }}>
                {selectedTransaction.type === 'income' ? '+' : '-'}¥{selectedTransaction.amount.toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="交易来源">{selectedTransaction.source}</Descriptions.Item>
            <Descriptions.Item label="交易状态">
              <Tag color={selectedTransaction.statusColor}>{selectedTransaction.statusName}</Tag>
            </Descriptions.Item>
            {selectedTransaction.orderId && (
              <Descriptions.Item label="关联订单">
                <Button type="link" size="small">{selectedTransaction.orderId}</Button>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="备注">-</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}