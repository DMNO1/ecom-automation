import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space, Tabs, Modal, Form, Input,
  Select, DatePicker, Drawer, Descriptions, Badge, Alert, Progress, Tooltip, InputNumber,
  Divider, Typography, List, Avatar, message
} from 'antd';
import {
  TeamOutlined, ShoppingCartOutlined, InboxOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  FileTextOutlined, HistoryOutlined, SyncOutlined, ArrowUpOutlined, ArrowDownOutlined,
  PhoneOutlined, UserOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 模拟供应商数据
const generateSupplierData = () => [
  {
    key: '1',
    id: 'SUP001',
    name: '深圳华强北电子科技有限公司',
    contact: '张经理',
    phone: '13800138001',
    email: 'zhang@hqbeijing.com',
    address: '广东省深圳市福田区华强北路1002号',
    productCount: 45,
    totalPurchase: 1250000,
    status: 'active',
    createTime: '2024-01-15',
    lastPurchase: '2026-04-20',
    rating: 4.8,
    category: '电子产品'
  },
  {
    key: '2',
    id: 'SUP002',
    name: '广州白云区服饰厂',
    contact: '李总',
    phone: '13900139002',
    email: 'li@gzclothing.com',
    address: '广东省广州市白云区石井镇工业区',
    productCount: 120,
    totalPurchase: 890000,
    status: 'active',
    createTime: '2024-02-20',
    lastPurchase: '2026-04-18',
    rating: 4.5,
    category: '服装鞋帽'
  },
  {
    key: '3',
    id: 'SUP003',
    name: '义乌小商品批发中心',
    contact: '王老板',
    phone: '13700137003',
    email: 'wang@yiwu.com',
    address: '浙江省义乌市福田市场一区',
    productCount: 580,
    totalPurchase: 2100000,
    status: 'active',
    createTime: '2023-11-10',
    lastPurchase: '2026-04-22',
    rating: 4.9,
    category: '日用百货'
  },
  {
    key: '4',
    id: 'SUP004',
    name: '福建安溪茶业有限公司',
    contact: '林经理',
    phone: '13600136004',
    email: 'lin@fujianTea.com',
    address: '福建省泉州市安溪县感德镇',
    productCount: 28,
    totalPurchase: 560000,
    status: 'inactive',
    createTime: '2024-03-05',
    lastPurchase: '2026-03-15',
    rating: 4.2,
    category: '食品饮料'
  },
  {
    key: '5',
    id: 'SUP005',
    name: '上海美妆供应链有限公司',
    contact: '赵女士',
    phone: '13500135005',
    email: 'zhao@shbeauty.com',
    address: '上海市浦东新区张江高科技园区',
    productCount: 65,
    totalPurchase: 780000,
    status: 'active',
    createTime: '2024-04-12',
    lastPurchase: '2026-04-21',
    rating: 4.6,
    category: '美妆个护'
  }
];

// 模拟采购单数据
const generatePurchaseData = () => [
  {
    key: '1',
    id: 'PO20260422001',
    supplierId: 'SUP001',
    supplierName: '深圳华强北电子科技有限公司',
    productCount: 5,
    totalAmount: 45000,
    status: 'pending',
    createTime: '2026-04-22 10:30',
    expectedDate: '2026-04-29',
    paymentStatus: 'unpaid',
    remark: '蓝牙耳机、充电宝等'
  },
  {
    key: '2',
    id: 'PO20260421002',
    supplierId: 'SUP002',
    supplierName: '广州白云区服饰厂',
    productCount: 200,
    totalAmount: 32000,
    status: 'shipped',
    createTime: '2026-04-21 14:15',
    expectedDate: '2026-04-25',
    paymentStatus: 'partial',
    trackingNo: 'SF1234567890',
    remark: '夏季T恤、短裤'
  },
  {
    key: '3',
    id: 'PO20260420003',
    supplierId: 'SUP003',
    supplierName: '义乌小商品批发中心',
    productCount: 1500,
    totalAmount: 18500,
    status: 'received',
    createTime: '2026-04-20 09:00',
    expectedDate: '2026-04-23',
    paymentStatus: 'paid',
    remark: '手机壳、数据线、手机支架'
  },
  {
    key: '4',
    id: 'PO20260419004',
    supplierId: 'SUP005',
    supplierName: '上海美妆供应链有限公司',
    productCount: 30,
    totalAmount: 28000,
    status: 'cancelled',
    createTime: '2026-04-19 16:45',
    expectedDate: '2026-04-26',
    paymentStatus: 'refunded',
    remark: '面膜、洗面奶'
  },
  {
    key: '5',
    id: 'PO20260418005',
    supplierId: 'SUP001',
    supplierName: '深圳华强北电子科技有限公司',
    productCount: 3,
    totalAmount: 15000,
    status: 'received',
    createTime: '2026-04-18 11:20',
    expectedDate: '2026-04-22',
    paymentStatus: 'paid',
    remark: '智能手表、运动手环'
  }
];

// 模拟库存数据
const generateInventoryData = () => [
  {
    key: '1',
    productId: 'SKU001',
    productName: '蓝牙耳机A1',
    category: '电子产品',
    warehouse: '深圳主仓',
    stock: 156,
    warningValue: 50,
    status: 'normal',
    lastIn: '2026-04-20',
    lastOut: '2026-04-22',
    dailySales: 12
  },
  {
    key: '2',
    productId: 'SKU002',
    productName: '智能手表S2',
    category: '电子产品',
    warehouse: '深圳主仓',
    stock: 8,
    warningValue: 20,
    status: 'warning',
    lastIn: '2026-04-18',
    lastOut: '2026-04-22',
    dailySales: 5
  },
  {
    key: '3',
    productId: 'SKU003',
    productName: '夏季男士T恤',
    category: '服装鞋帽',
    warehouse: '广州分仓',
    stock: 520,
    warningValue: 100,
    status: 'normal',
    lastIn: '2026-04-21',
    lastOut: '2026-04-22',
    dailySales: 35
  },
  {
    key: '4',
    productId: 'SKU004',
    productName: '手机壳透明款',
    category: '手机配件',
    warehouse: '深圳主仓',
    stock: 15,
    warningValue: 100,
    status: 'warning',
    lastIn: '2026-04-15',
    lastOut: '2026-04-22',
    dailySales: 20
  },
  {
    key: '5',
    productId: 'SKU005',
    productName: '补水面膜',
    category: '美妆个护',
    warehouse: '上海分仓',
    stock: 890,
    warningValue: 200,
    status: 'normal',
    lastIn: '2026-04-19',
    lastOut: '2026-04-22',
    dailySales: 45
  }
];

// 模拟出入库记录
const generateStockRecords = () => [
  { key: '1', type: 'in', productId: 'SKU001', productName: '蓝牙耳机A1', quantity: 100, time: '2026-04-20 14:30', operator: '系统自动', reference: 'PO20260418005' },
  { key: '2', type: 'out', productId: 'SKU001', productName: '蓝牙耳机A1', quantity: 5, time: '2026-04-22 09:15', operator: '订单发货', reference: 'ORD20260422001' },
  { key: '3', type: 'in', productId: 'SKU003', productName: '夏季男士T恤', quantity: 200, time: '2026-04-21 16:00', operator: '系统自动', reference: 'PO20260421002' },
  { key: '4', type: 'out', productId: 'SKU004', productName: '手机壳透明款', quantity: 10, time: '2026-04-22 10:00', operator: '订单发货', reference: 'ORD20260422002' },
  { key: '5', type: 'in', productId: 'SKU005', productName: '补水面膜', quantity: 500, time: '2026-04-19 11:00', operator: '系统自动', reference: 'PO20260417003' },
  { key: '6', type: 'out', productId: 'SKU002', productName: '智能手表S2', quantity: 3, time: '2026-04-22 08:30', operator: '订单发货', reference: 'ORD20260422003' },
  { key: '7', type: 'out', productId: 'SKU005', productName: '补水面膜', quantity: 15, time: '2026-04-22 11:45', operator: '订单发货', reference: 'ORD20260422004' }
];

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [supplierData, setSupplierData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [stockRecords, setStockRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  const [form] = Form.useForm();
  const [purchaseForm] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSupplierData(generateSupplierData());
      setPurchaseData(generatePurchaseData());
      setInventoryData(generateInventoryData());
      setStockRecords(generateStockRecords());
      setLoading(false);
    }, 500);
  }, []);

  // 统计数据
  const supplierCount = supplierData.length;
  const activePurchaseCount = purchaseData.filter(p => ['pending', 'shipped'].includes(p.status)).length;
  const pendingReceiveCount = purchaseData.filter(p => p.status === 'shipped').length;
  const warningInventoryCount = inventoryData.filter(i => i.status === 'warning').length;

  // 状态映射
  const statusMap = {
    active: { color: 'green', text: '合作中' },
    inactive: { color: 'default', text: '已停用' },
    pending: { color: 'orange', text: '待确认' },
    shipped: { color: 'blue', text: '已发货' },
    received: { color: 'green', text: '已入库' },
    cancelled: { color: 'red', text: '已取消' },
    unpaid: { color: 'red', text: '未付款' },
    partial: { color: 'orange', text: '部分付款' },
    paid: { color: 'green', text: '已付款' },
    refunded: { color: 'default', text: '已退款' },
    normal: { color: 'green', text: '正常' },
    warning: { color: 'red', text: '预警' }
  };

  // 供应商表格列
  const supplierColumns = [
    {
      title: '供应商编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      width: 100
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '合作商品数',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 100,
      sorter: (a, b) => a.productCount - b.productCount
    },
    {
      title: '采购总额',
      dataIndex: 'totalPurchase',
      key: 'totalPurchase',
      width: 120,
      render: (val) => `¥${val.toLocaleString()}`,
      sorter: (a, b) => a.totalPurchase - b.totalPurchase
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={statusMap[status].text} />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewSupplier(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSupplier(record)}>
            编辑
          </Button>
        </Space>
      )
    }
  ];

  // 采购单表格列
  const purchaseColumns = [
    {
      title: '采购单号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (text) => <Text strong copyable>{text}</Text>
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ellipsis: true
    },
    {
      title: '商品数量',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 100,
      render: (val) => `${val}件`,
      sorter: (a, b) => a.productCount - b.productCount
    },
    {
      title: '采购金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (val) => <Text strong>¥{val.toLocaleString()}</Text>,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      )
    },
    {
      title: '付款状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      )
    },
    {
      title: '预计到货',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 110
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewPurchase(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 库存表格列
  const inventoryColumns = [
    {
      title: '商品编号',
      dataIndex: 'productId',
      key: 'productId',
      width: 100
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '仓库',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 100
    },
    {
      title: '库存量',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock, record) => (
        <Text type={stock <= record.warningValue ? 'danger' : undefined} strong>
          {stock}
        </Text>
      ),
      sorter: (a, b) => a.stock - b.stock
    },
    {
      title: '预警值',
      dataIndex: 'warningValue',
      key: 'warningValue',
      width: 80
    },
    {
      title: '日均销量',
      dataIndex: 'dailySales',
      key: 'dailySales',
      width: 100,
      render: (val) => `${val}件/天`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Badge status={statusMap[status].color} text={statusMap[status].text} />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<HistoryOutlined />}>
            记录
          </Button>
          <Button type="link" size="small">
            调整
          </Button>
        </Space>
      )
    }
  ];

  // 出入库记录列
  const recordColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'in' ? 'green' : 'blue'}>
          {type === 'in' ? '入库' : '出库'}
        </Tag>
      )
    },
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty, record) => (
        <Text type={record.type === 'in' ? 'success' : 'warning'}>
          {record.type === 'in' ? '+' : '-'}{qty}
        </Text>
      )
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
      width: 100
    },
    {
      title: '关联单号',
      dataIndex: 'reference',
      key: 'reference',
      width: 160,
      render: (text) => <Text copyable>{text}</Text>
    }
  ];

  // 处理函数
  const handleViewSupplier = (record) => {
    setEditingSupplier(record);
    setDrawerVisible(true);
  };

  const handleEditSupplier = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setSupplierModalVisible(true);
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    form.resetFields();
    setSupplierModalVisible(true);
  };

  const handleSupplierSubmit = () => {
    form.validateFields().then(values => {
      if (editingSupplier) {
        message.success('供应商信息已更新');
      } else {
        message.success('供应商添加成功');
      }
      setSupplierModalVisible(false);
    });
  };

  const handleViewPurchase = (record) => {
    setSelectedPurchase(record);
    Modal.info({
      title: '采购单详情',
      width: 600,
      content: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="采购单号">{record.id}</Descriptions.Item>
          <Descriptions.Item label="供应商">{record.supplierName}</Descriptions.Item>
          <Descriptions.Item label="商品数量">{record.productCount}件</Descriptions.Item>
          <Descriptions.Item label="采购金额">¥{record.totalAmount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={statusMap[record.status].color}>{statusMap[record.status].text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="付款状态">
            <Tag color={statusMap[record.paymentStatus].color}>{statusMap[record.paymentStatus].text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{record.createTime}</Descriptions.Item>
          <Descriptions.Item label="预计到货">{record.expectedDate}</Descriptions.Item>
          {record.trackingNo && <Descriptions.Item label="物流单号">{record.trackingNo}</Descriptions.Item>}
          <Descriptions.Item label="备注">{record.remark}</Descriptions.Item>
        </Descriptions>
      )
    });
  };

  const handleCreatePurchase = () => {
    purchaseForm.resetFields();
    setPurchaseModalVisible(true);
  };

  const handlePurchaseSubmit = () => {
    purchaseForm.validateFields().then(values => {
      message.success('采购单创建成功');
      setPurchaseModalVisible(false);
    });
  };

  const tabItems = [
    {
      key: 'suppliers',
      label: (
        <span>
          <TeamOutlined />
          供应商管理
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="搜索供应商名称、联系人"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
              />
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部状态</Option>
                <Option value="active">合作中</Option>
                <Option value="inactive">已停用</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部分类</Option>
                <Option value="electronics">电子产品</Option>
                <Option value="clothing">服装鞋帽</Option>
                <Option value="daily">日用百货</Option>
                <Option value="food">食品饮料</Option>
                <Option value="beauty">美妆个护</Option>
              </Select>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSupplier}>
              添加供应商
            </Button>
          </div>
          <Table
            columns={supplierColumns}
            dataSource={supplierData}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </div>
      )
    },
    {
      key: 'purchases',
      label: (
        <span>
          <ShoppingCartOutlined />
          采购管理
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="搜索采购单号"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
              />
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部状态</Option>
                <Option value="pending">待确认</Option>
                <Option value="shipped">已发货</Option>
                <Option value="received">已入库</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              <RangePicker style={{ width: 240 }} />
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePurchase}>
              创建采购单
            </Button>
          </div>
          <Table
            columns={purchaseColumns}
            dataSource={purchaseData}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        </div>
      )
    },
    {
      key: 'inventory',
      label: (
        <span>
          <InboxOutlined />
          库存管理
        </span>
      ),
      children: (
        <div>
          <Alert
            message="库存预警"
            description={`当前有 ${warningInventoryCount} 件商品库存低于预警值，请及时补货！`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary">
                查看预警商品
              </Button>
            }
          />
          <Tabs
            defaultActiveKey="list"
            items={[
              {
                key: 'list',
                label: '库存列表',
                children: (
                  <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                      <Space>
                        <Input
                          placeholder="搜索商品名称、编号"
                          prefix={<SearchOutlined />}
                          style={{ width: 200 }}
                        />
                        <Select defaultValue="all" style={{ width: 120 }}>
                          <Option value="all">全部仓库</Option>
                          <Option value="shenzhen">深圳主仓</Option>
                          <Option value="guangzhou">广州分仓</Option>
                          <Option value="shanghai">上海分仓</Option>
                        </Select>
                        <Select defaultValue="all" style={{ width: 120 }}>
                          <Option value="all">全部状态</Option>
                          <Option value="normal">正常</Option>
                          <Option value="warning">预警</Option>
                        </Select>
                      </Space>
                      <Space>
                        <Button icon={<SyncOutlined />}>同步库存</Button>
                        <Button type="primary">导出报表</Button>
                      </Space>
                    </div>
                    <Table
                      columns={inventoryColumns}
                      dataSource={inventoryData}
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 900 }}
                    />
                  </div>
                )
              },
              {
                key: 'records',
                label: '出入库记录',
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <Select defaultValue="all" style={{ width: 120 }}>
                          <Option value="all">全部类型</Option>
                          <Option value="in">入库</Option>
                          <Option value="out">出库</Option>
                        </Select>
                        <RangePicker style={{ width: 240 }} />
                        <Button type="primary" icon={<SearchOutlined />}>
                          查询
                        </Button>
                      </Space>
                    </div>
                    <Table
                      columns={recordColumns}
                      dataSource={stockRecords}
                      loading={loading}
                      pagination={{ pageSize: 10 }}
                    />
                  </div>
                )
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div className="supply-chain">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>供应链管理</Title>
        <Text type="secondary">管理供应商、采购订单和库存</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="供应商数量"
              value={supplierCount}
              valueStyle={{ color: '#165DFF' }}
              prefix={<TeamOutlined />}
              suffix="家"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">合作中: {supplierData.filter(s => s.status === 'active').length}家</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="采购中订单"
              value={activePurchaseCount}
              valueStyle={{ color: '#FF7D00' }}
              prefix={<ShoppingCartOutlined />}
              suffix="单"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">待确认: {purchaseData.filter(p => p.status === 'pending').length}单</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待入库数量"
              value={pendingReceiveCount}
              valueStyle={{ color: '#00B42A' }}
              prefix={<InboxOutlined />}
              suffix="单"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">已发货待收货</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="库存预警数"
              value={warningInventoryCount}
              valueStyle={{ color: warningInventoryCount > 0 ? '#F53F3F' : '#00B42A' }}
              prefix={<WarningOutlined />}
              suffix="件"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">需要及时补货</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 添加/编辑供应商弹窗 */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '添加供应商'}
        open={supplierModalVisible}
        onOk={handleSupplierSubmit}
        onCancel={() => setSupplierModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="商品分类" rules={[{ required: true, message: '请选择商品分类' }]}>
                <Select placeholder="请选择商品分类">
                  <Option value="电子产品">电子产品</Option>
                  <Option value="服装鞋帽">服装鞋帽</Option>
                  <Option value="日用百货">日用百货</Option>
                  <Option value="食品饮料">食品饮料</Option>
                  <Option value="美妆个护">美妆个护</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="active">合作中</Option>
                  <Option value="inactive">已停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建采购单弹窗 */}
      <Modal
        title="创建采购单"
        open={purchaseModalVisible}
        onOk={handlePurchaseSubmit}
        onCancel={() => setPurchaseModalVisible(false)}
        width={600}
      >
        <Form form={purchaseForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierId" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
                <Select placeholder="请选择供应商">
                  {supplierData.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedDate" label="预计到货日期" rules={[{ required: true, message: '请选择预计到货日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="采购备注">
            <TextArea rows={3} placeholder="请输入采购商品明细和备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 供应商详情抽屉 */}
      <Drawer
        title="供应商详情"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Button type="primary" onClick={() => {
            setDrawerVisible(false);
            handleEditSupplier(editingSupplier);
          }}>
            编辑
          </Button>
        }
      >
        {editingSupplier && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="供应商编号">{editingSupplier.id}</Descriptions.Item>
            <Descriptions.Item label="供应商名称">{editingSupplier.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{editingSupplier.contact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{editingSupplier.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{editingSupplier.email}</Descriptions.Item>
            <Descriptions.Item label="地址">{editingSupplier.address}</Descriptions.Item>
            <Descriptions.Item label="商品分类">{editingSupplier.category}</Descriptions.Item>
            <Descriptions.Item label="合作商品数">{editingSupplier.productCount}件</Descriptions.Item>
            <Descriptions.Item label="采购总额">¥{editingSupplier.totalPurchase.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="评级">
              <Space>
                {editingSupplier.rating}
                <Tag color="gold">★</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={editingSupplier.status === 'active' ? 'success' : 'default'} text={statusMap[editingSupplier.status].text} />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{editingSupplier.createTime}</Descriptions.Item>
            <Descriptions.Item label="最近采购">{editingSupplier.lastPurchase}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}