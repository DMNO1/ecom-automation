import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Tooltip,
  Progress,
  Input,
  Select,
  Message,
  Modal,
  Form,
  InputNumber,
} from '@arco-design/web-react';
import {
  IconStorage,
  IconExclamationCircle,
  IconEmpty,
  IconCommon,
  IconSearch,
  IconPlus,
  IconEdit,
  IconRefresh,
  IconUpload,
  IconDownload,
  IconSettings,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Title, Text } = Typography;
const Option = Select.Option;

// Mock inventory data - items with stock levels
const inventoryData = [
  {
    key: '1',
    sku: 'SKU001',
    name: '无线蓝牙耳机',
    category: '电子产品',
    currentStock: 3,
    reorderLevel: 10,
    unitPrice: 129.00,
    supplier: '深圳科技有限公司',
    lastRestocked: '2024-04-15',
    status: 'low',
  },
  {
    key: '2',
    sku: 'SKU002',
    name: '智能手表',
    category: '电子产品',
    currentStock: 0,
    reorderLevel: 15,
    unitPrice: 399.00,
    supplier: '东莞电子厂',
    lastRestocked: '2024-04-10',
    status: 'out_of_stock',
  },
  {
    key: '3',
    sku: 'SKU003',
    name: '充电宝',
    category: '电子产品',
    currentStock: 8,
    reorderLevel: 20,
    unitPrice: 89.00,
    supplier: '深圳电池厂',
    lastRestocked: '2024-04-18',
    status: 'low',
  },
  {
    key: '4',
    sku: 'SKU004',
    name: '手机壳',
    category: '配件',
    currentStock: 5,
    reorderLevel: 50,
    unitPrice: 29.00,
    supplier: '义乌小商品城',
    lastRestocked: '2024-04-12',
    status: 'low',
  },
  {
    key: '5',
    sku: 'SKU005',
    name: '数据线',
    category: '配件',
    currentStock: 2,
    reorderLevel: 30,
    unitPrice: 19.00,
    supplier: '深圳线材厂',
    lastRestocked: '2024-04-08',
    status: 'low',
  },
  {
    key: '6',
    sku: 'SKU006',
    name: '保温杯',
    category: '生活用品',
    currentStock: 15,
    reorderLevel: 25,
    unitPrice: 79.00,
    supplier: '永康不锈钢制品厂',
    lastRestocked: '2024-04-20',
    status: 'normal',
  },
  {
    key: '7',
    sku: 'SKU007',
    name: '运动鞋',
    category: '服装',
    currentStock: 7,
    reorderLevel: 12,
    unitPrice: 259.00,
    supplier: '晋江鞋厂',
    lastRestocked: '2024-04-16',
    status: 'low',
  },
  {
    key: '8',
    sku: 'SKU008',
    name: '背包',
    category: '箱包',
    currentStock: 9,
    reorderLevel: 15,
    unitPrice: 159.00,
    supplier: '广州箱包厂',
    lastRestocked: '2024-04-14',
    status: 'low',
  },
  {
    key: '9',
    sku: 'SKU009',
    name: '墨镜',
    category: '配饰',
    currentStock: 4,
    reorderLevel: 10,
    unitPrice: 199.00,
    supplier: '温州眼镜厂',
    lastRestocked: '2024-04-11',
    status: 'low',
  },
  {
    key: '10',
    sku: 'SKU010',
    name: '按摩枕',
    category: '健康',
    currentStock: 1,
    reorderLevel: 8,
    unitPrice: 299.00,
    supplier: '佛山家居用品厂',
    lastRestocked: '2024-04-09',
    status: 'low',
  },
  {
    key: '11',
    sku: 'SKU011',
    name: '体重秤',
    category: '健康',
    currentStock: 0,
    reorderLevel: 5,
    unitPrice: 99.00,
    supplier: '深圳电子厂',
    lastRestocked: '2024-04-05',
    status: 'out_of_stock',
  },
  {
    key: '12',
    sku: 'SKU012',
    name: '瑜伽垫',
    category: '运动',
    currentStock: 6,
    reorderLevel: 10,
    unitPrice: 89.00,
    supplier: '义乌体育用品厂',
    lastRestocked: '2024-04-13',
    status: 'low',
  },
  {
    key: '13',
    sku: 'SKU013',
    name: '防晒喷雾',
    category: '美妆',
    currentStock: 12,
    reorderLevel: 30,
    unitPrice: 69.00,
    supplier: '广州化妆品厂',
    lastRestocked: '2024-04-19',
    status: 'normal',
  },
  {
    key: '14',
    sku: 'SKU014',
    name: '护手霜套装',
    category: '美妆',
    currentStock: 18,
    reorderLevel: 20,
    unitPrice: 59.00,
    supplier: '上海日化厂',
    lastRestocked: '2024-04-17',
    status: 'normal',
  },
  {
    key: '15',
    sku: 'SKU015',
    name: '速干运动裤',
    category: '服装',
    currentStock: 3,
    reorderLevel: 15,
    unitPrice: 129.00,
    supplier: '晋江运动服装厂',
    lastRestocked: '2024-04-07',
    status: 'low',
  },
];

// Get statistics
const getStats = () => {
  const totalSkus = inventoryData.length;
  const lowStock = inventoryData.filter(item => item.status === 'low').length;
  const outOfStock = inventoryData.filter(item => item.status === 'out_of_stock').length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
  const totalUnits = inventoryData.reduce((sum, item) => sum + item.currentStock, 0);
  
  return { totalSkus, lowStock, outOfStock, totalValue, totalUnits };
};

// Get status tag color
const getStatusColor = (status) => {
  const colors = {
    'low': 'orange',
    'out_of_stock': 'red',
    'normal': 'green',
  };
  return colors[status] || 'gray';
};

// Get status text
const getStatusText = (status) => {
  const texts = {
    'low': '低库存',
    'out_of_stock': '缺货',
    'normal': '正常',
  };
  return texts[status] || status;
};

export default function Inventory() {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [form] = Form.useForm();
  const [message, setMessage] = useMessage();
  
  const stats = getStats();

  // Filter inventory data
  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle restock
  const handleRestock = (record) => {
    setCurrentItem(record);
    form.setFieldsValue({
      sku: record.sku,
      name: record.name,
      currentStock: record.currentStock,
      restockQuantity: record.reorderLevel - record.currentStock,
    });
    setRestockModalVisible(true);
  };

  // Handle restock confirm
  const handleRestockConfirm = () => {
    form.validate().then(values => {
      // In a real app, this would call an API
      message.success(`已提交补货申请: ${values.name} +${values.restockQuantity}件`);
      setRestockModalVisible(false);
      form.resetFields();
    });
  };

  // Table columns
  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 100,
      render: (value) => (
        <Text copyable={{ text: value }} style={{ fontFamily: 'monospace' }}>
          {value}
        </Text>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (value) => <Tag color="blue" bordered>{value}</Tag>,
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      width: 100,
      render: (value, record) => {
        const percentage = (value / record.reorderLevel) * 100;
        const strokeColor = value === 0 ? '#F53F3F' : percentage < 50 ? '#FF7D00' : '#00B42A';
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: strokeColor, fontWeight: 500, minWidth: 30 }}>{value}</Text>
            <Progress
              percent={Math.min(percentage, 100)}
              size="small"
              showText={false}
              strokeColor={strokeColor}
              style={{ width: 60 }}
            />
          </div>
        );
      },
    },
    {
      title: '补货点',
      dataIndex: 'reorderLevel',
      width: 80,
      render: (value) => <Text style={{ color: '#86909C' }}>{value}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (value) => (
        <Tag color={getStatusColor(value)} bordered>
          {getStatusText(value)}
        </Tag>
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 100,
      render: (value) => <Text style={{ color: '#F53F3F' }}>¥{value.toFixed(2)}</Text>,
    },
    {
      title: '库存价值',
      dataIndex: 'currentStock',
      width: 100,
      render: (value, record) => (
        <Text style={{ fontWeight: 500 }}>
          ¥{(value * record.unitPrice).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      width: 150,
      ellipsis: true,
    },
    {
      title: '最后补货',
      dataIndex: 'lastRestocked',
      width: 110,
      render: (value) => <Text style={{ color: '#86909C' }}>{value}</Text>,
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip content="补货">
            <Button
              type="text"
              size="small"
              icon={<IconUpload />}
              onClick={() => handleRestock(record)}
              style={{ color: '#4080FF' }}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              style={{ color: '#86909C' }}
            />
          </Tooltip>
          <Tooltip content="详情">
            <Button
              type="text"
              size="small"
              icon={<IconCommon />}
              style={{ color: '#86909C' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Statistics cards data
  const statisticsData = [
    {
      title: '总SKU数',
      value: stats.totalSkus,
      prefix: <IconStorage style={{ fontSize: 24, color: '#4080FF' }} />,
      color: '#4080FF',
      gradientColor: ['#4080FF', '#6EAAFF'],
    },
    {
      title: '低库存商品',
      value: stats.lowStock,
      prefix: <IconExclamationCircle style={{ fontSize: 24, color: '#FF7D00' }} />,
      color: '#FF7D00',
      gradientColor: ['#FF7D00', '#FFB366'],
    },
    {
      title: '缺货商品',
      value: stats.outOfStock,
      prefix: <IconEmpty style={{ fontSize: 24, color: '#F53F3F' }} />,
      color: '#F53F3F',
      gradientColor: ['#F53F3F', '#FF7A7A'],
    },
    {
      title: '库存总价值',
      value: stats.totalValue,
      prefix: <IconCommon style={{ fontSize: 24, color: '#00B42A' }} />,
      suffix: '元',
      color: '#00B42A',
      gradientColor: ['#00B42A', '#23C343'],
    },
  ];

  // Categories for filter
  const categories = ['电子产品', '配件', '生活用品', '服装', '箱包', '配饰', '健康', '运动', '美妆'];

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#12131a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title heading={4} style={{ color: '#fff', margin: 0 }}>
          库存管理
        </Title>
        <Space>
          <Button type="primary" icon={<IconPlus />} style={{ background: '#4080FF' }}>
            新增商品
          </Button>
          <Button icon={<IconDownload />} style={{ color: '#86909C', borderColor: '#303650' }}>
            导出数据
          </Button>
        </Space>
      </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                      {item.title.includes('价值') 
                        ? `¥${item.value.toLocaleString()}`
                        : item.value.toLocaleString()}
                    </Text>
                    {item.suffix && (
                      <Text style={{ color: '#86909C', fontSize: 14 }}>{item.suffix}</Text>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {item.prefix}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card
          style={{
            background: 'linear-gradient(135deg, #3D2E1E 0%, #4A3520 100%)',
            borderRadius: 12,
            border: 'none',
            boxShadow: '0 4px 20px rgba(255, 125, 0, 0.1)',
            marginBottom: 24,
          }}
          bodyStyle={{ padding: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#FF7D0015',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconExclamationCircle style={{ fontSize: 20, color: '#FF7D00' }} />
            </div>
            <div>
              <Text style={{ color: '#FF7D00', fontWeight: 500 }}>
                库存预警
              </Text>
              <Text style={{ color: '#FFB366', fontSize: 13, display: 'block' }}>
                有 {stats.lowStock} 件商品库存低于补货点，{stats.outOfStock} 件商品已缺货，建议及时补货。
              </Text>
            </div>
            <Button
              type="outline"
              size="small"
              style={{ marginLeft: 'auto', borderColor: '#FF7D00', color: '#FF7D00' }}
              onClick={() => setStatusFilter('low')}
            >
              查看低库存商品
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <Card
        style={{
          background: '#1E2030',
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[16, 16]} align="center">
          <Col span={6}>
            <Input
              placeholder="搜索SKU或商品名称"
              prefix={<IconSearch style={{ color: '#86909C' }} />}
              value={searchText}
              onChange={setSearchText}
              style={{ background: '#262A3E', border: 'none' }}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="商品分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ background: '#262A3E', width: '100%' }}
              bordered={false}
            >
              <Option value="all">全部分类</Option>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="库存状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ background: '#262A3E', width: '100%' }}
              bordered={false}
            >
              <Option value="all">全部状态</Option>
              <Option value="low">低库存</Option>
              <Option value="out_of_stock">缺货</Option>
              <Option value="normal">正常</Option>
            </Select>
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<IconRefresh />} style={{ color: '#86909C', borderColor: '#303650' }}>
                刷新
              </Button>
              <Button icon={<IconSettings />} style={{ color: '#86909C', borderColor: '#303650' }}>
                设置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Inventory Table */}
      <Card
        style={{
          background: '#1E2030',
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          data={filteredData}
          pagination={{
            pageSize: 10,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true,
            pageSizeOptions: [10, 20, 50],
            style: { padding: '16px 24px' },
          }}
          scroll={{ x: 1500 }}
          border={false}
          rowClassName={(record) => {
            if (record.status === 'out_of_stock') return 'inventory-row-critical';
            if (record.status === 'low') return 'inventory-row-warning';
            return '';
          }}
          style={{ background: 'transparent' }}
        />
      </Card>

      {/* Restock Modal */}
      <Modal
        title="补货申请"
        visible={restockModalVisible}
        onOk={handleRestockConfirm}
        onCancel={() => {
          setRestockModalVisible(false);
          form.resetFields();
        }}
        autoFocus={false}
        focusLock={true}
        style={{ width: 500 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="SKU" field="sku">
            <Input disabled style={{ background: '#262A3E', border: 'none' }} />
          </Form.Item>
          <Form.Item label="商品名称" field="name">
            <Input disabled style={{ background: '#262A3E', border: 'none' }} />
          </Form.Item>
          <Form.Item label="当前库存" field="currentStock">
            <InputNumber disabled style={{ background: '#262A3E', border: 'none', width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="补货数量"
            field="restockQuantity"
            rules={[{ required: true, message: '请输入补货数量' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入补货数量"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Custom CSS for row highlighting */}
      <style>{`
        .inventory-row-warning {
          background-color: rgba(255, 125, 0, 0.05) !important;
        }
        .inventory-row-critical {
          background-color: rgba(245, 63, 63, 0.05) !important;
        }
        .arco-table-th {
          background: rgba(30, 32, 48, 0.8) !important;
          color: #86909C !important;
          border-bottom: 1px solid #303650 !important;
        }
        .arco-table-td {
          border-bottom: 1px solid #303650 !important;
          color: #fff !important;
        }
        .arco-table-tr:hover .arco-table-td {
          background-color: rgba(64, 128, 255, 0.05) !important;
        }
      `}</style>
    </div>
  );
}