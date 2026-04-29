import React, { useState, useRef } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  Drawer,
  Form,
  InputNumber,
  Upload,
  Image,
  Tooltip,
  Badge,
  Divider,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ShoppingOutlined,
  WarningOutlined,
  RiseOutlined,
  DollarOutlined,
  UploadOutlined,
  SyncOutlined,
  CopyOutlined,
  QrcodeOutlined,
  AppstoreOutlined,
  FireOutlined,
  InboxOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

// 抖音店铺后台风格 - 样式常量
const styles = {
  page: {
    background: '#F2F3F5',
    minHeight: '100vh',
    padding: 0,
  },
  statCard: (gradient) => ({
    borderRadius: 8,
    border: 'none',
    background: gradient,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative',
  }),
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  statSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 8,
  },
  card: {
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  filterCard: {
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  tableCard: {
    borderRadius: 8,
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  productImage: {
    borderRadius: 6,
    objectFit: 'cover',
    border: '1px solid #f0f0f0',
  },
  batchBar: {
    marginBottom: 16,
    padding: '12px 16px',
    background: '#E6F7FF',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #91D5FF',
  },
};

// 模拟商品数据
const generateProducts = (count = 50) => {
  const platforms = [
    { key: 'douyin', name: '抖音', color: '#165DFF' },
    { key: 'pdd', name: '拼多多', color: '#F53F3F' },
    { key: 'xianyu', name: '闲鱼', color: '#FF7D00' },
    { key: 'kuaishou', name: '快手', color: '#722ED1' },
  ];
  const categories = ['数码配件', '家居日用', '服饰鞋包', '美妆个护', '食品生鲜', '办公用品'];
  const statusOptions = [
    { key: 'active', label: '在售', color: 'green' },
    { key: 'draft', label: '草稿', color: 'default' },
    { key: 'out_of_stock', label: '缺货', color: 'red' },
    { key: 'disabled', label: '已下架', color: 'default' },
  ];

  const products = [];
  for (let i = 1; i <= count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const price = Math.floor(Math.random() * 500) + 10;
    const cost = Math.floor(price * (0.3 + Math.random() * 0.4));
    const stock = Math.floor(Math.random() * 200);
    const sales = Math.floor(Math.random() * 1000);

    products.push({
      id: `SP${String(i).padStart(6, '0')}`,
      name: `${category}商品${i}`,
      sku: `SKU${String(i).padStart(4, '0')}`,
      platform: platform.key,
      platformName: platform.name,
      platformColor: platform.color,
      category,
      price,
      cost,
      profit: price - cost,
      margin: ((price - cost) / price * 100).toFixed(1),
      stock,
      sales,
      status: status.key,
      statusLabel: status.label,
      statusColor: status.color,
      image: `https://picsum.photos/seed/${i}/80/80`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return products;
};

// 统计卡片组件 - 渐变背景 + hover效果
const StatCard = ({ title, value, prefix, gradient, subText, formatter }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...styles.statCard(gradient),
        ...(hovered ? styles.statCardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ padding: 20 }}>
        <div style={styles.statTitle}>{title}</div>
        <div style={{ ...styles.statNumber, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          {prefix && <span style={{ fontSize: 20, opacity: 0.9 }}>{prefix}</span>}
          {formatter ? formatter(value) : value}
        </div>
        {subText && <div style={styles.statSub}>{subText}</div>}
      </div>
      {/* 装饰圆形 */}
      <div style={{
        position: 'absolute',
        right: -20,
        top: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      <div style={{
        position: 'absolute',
        right: 10,
        bottom: -30,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState(() => generateProducts(50));
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filterVisible, setFilterVisible] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 统计数据
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock < 20).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    todaySales: Math.floor(Math.random() * 100),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };

  // 筛选
  const [filters, setFilters] = useState({
    keyword: '',
    platform: 'all',
    category: 'all',
    status: 'all',
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
      category: 'all',
      status: 'all',
    });
  };

  // 过滤商品
  const filteredProducts = products.filter((product) => {
    if (filters.keyword && !product.name.toLowerCase().includes(filters.keyword.toLowerCase()) && !product.sku.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    if (filters.platform !== 'all' && product.platform !== filters.platform) {
      return false;
    }
    if (filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'all' && product.status !== filters.status) {
      return false;
    }
    return true;
  });

  // 查看商品详情
  const handleView = (product) => {
    setCurrentProduct(product);
    setDrawerVisible(true);
  };

  // 编辑商品
  const handleEdit = (product) => {
    setCurrentProduct(product);
    form.setFieldsValue({
      name: product.name,
      sku: product.sku,
      category: product.category,
      platform: product.platform,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
    });
    setModalVisible(true);
  };

  // 删除商品
  const handleDelete = (product) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商品"${product.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setProducts(products.filter(p => p.id !== product.id));
        message.success('删除成功');
      },
    });
  };

  // 批量操作
  const handleBatchAction = (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    Modal.confirm({
      title: `确认${action === 'delete' ? '删除' : '下架'}`,
      content: `确定要${action === 'delete' ? '删除' : '下架'}选中的 ${selectedRowKeys.length} 个商品吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        if (action === 'delete') {
          setProducts(products.filter(p => !selectedRowKeys.includes(p.id)));
        } else {
          setProducts(products.map(p => 
            selectedRowKeys.includes(p.id) ? { ...p, status: 'disabled', statusLabel: '已下架', statusColor: 'default' } : p
          ));
        }
        setSelectedRowKeys([]);
        message.success(`${action === 'delete' ? '删除' : '下架'}成功`);
      },
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '商品信息',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 6,
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid #f0f0f0',
          }}>
            <Image
              src={record.image}
              width={56}
              height={56}
              style={{ objectFit: 'cover', display: 'block' }}
              preview={false}
              fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMjgiIHk9IjMyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYmJiIiBmb250LXNpemU9IjEyIj7lm77niYw8L3RleHQ+PC9zdmc+"
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 500,
              fontSize: 13,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#1D2129',
            }}>
              {text}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              SKU: {record.sku}
            </div>
            <Tag
              color={record.platformColor}
              style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px', borderRadius: 4 }}
            >
              {record.platformName}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => (
        <Tag style={{ borderRadius: 4, background: '#F2F3F5', border: 'none', color: '#4E5969' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      sorter: (a, b) => a.price - b.price,
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#165DFF', fontSize: 13 }}>
          ¥{val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (val) => <Text type="secondary" style={{ fontSize: 13 }}>¥{val.toFixed(2)}</Text>,
    },
    {
      title: '利润率',
      dataIndex: 'margin',
      key: 'margin',
      width: 90,
      sorter: (a, b) => parseFloat(a.margin) - parseFloat(b.margin),
      render: (val) => {
        const v = parseFloat(val);
        const color = v > 40 ? '#00B42A' : v > 20 ? '#165DFF' : '#FF7D00';
        const bg = v > 40 ? '#E8FFEA' : v > 20 ? '#E8F3FF' : '#FFF7E8';
        return (
          <Tag style={{ borderRadius: 4, background: bg, border: 'none', color, fontWeight: 500 }}>
            {val}%
          </Tag>
        );
      },
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      sorter: (a, b) => a.stock - b.stock,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            color: val === 0 ? '#F53F3F' : val < 20 ? '#FF7D00' : '#00B42A',
            fontWeight: 600,
            fontSize: 13,
          }}>
            {val}
          </span>
          {val === 0 && (
            <Tag style={{ borderRadius: 4, background: '#FFECE8', border: 'none', color: '#F53F3F', fontSize: 11, lineHeight: '18px', padding: '0 5px' }}>
              缺货
            </Tag>
          )}
          {val > 0 && val < 20 && (
            <Tag style={{ borderRadius: 4, background: '#FFF7E8', border: 'none', color: '#FF7D00', fontSize: 11, lineHeight: '18px', padding: '0 5px' }}>
              预警
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
      sorter: (a, b) => a.sales - b.sales,
      render: (val) => (
        <span style={{ fontWeight: 500, color: '#1D2129' }}>{val}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      key: 'status',
      width: 80,
      render: (text, record) => {
        const colorMap = {
          active: { color: '#00B42A', bg: '#E8FFEA' },
          draft: { color: '#86909C', bg: '#F2F3F5' },
          out_of_stock: { color: '#F53F3F', bg: '#FFECE8' },
          disabled: { color: '#86909C', bg: '#F2F3F5' },
        };
        const c = colorMap[record.status] || colorMap.draft;
        return (
          <Tag style={{ borderRadius: 4, background: c.bg, border: 'none', color: c.color, fontWeight: 500 }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              style={{ color: '#165DFF' }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: '#165DFF' }}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'copy', icon: <CopyOutlined />, label: '复制商品' },
                { key: 'qrcode', icon: <QrcodeOutlined />, label: '生成二维码' },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'delete') handleDelete(record);
                else if (key === 'copy') message.success('商品已复制');
                else if (key === 'qrcode') message.success('二维码已生成');
              },
            }}
            placement="bottomRight"
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div style={styles.page}>
      {/* 统计卡片 - 渐变背景 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="在售商品"
            value={stats.active}
            prefix={<ShoppingOutlined />}
            gradient="linear-gradient(135deg, #165DFF 0%, #4080FF 100%)"
            subText={`总计 ${stats.total} 个商品`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="库存预警"
            value={stats.lowStock}
            prefix={<WarningOutlined />}
            gradient="linear-gradient(135deg, #FF7D00 0%, #FFB74D 100%)"
            subText={`缺货 ${stats.outOfStock} 个`}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="今日销量"
            value={stats.todaySales}
            prefix={<FireOutlined />}
            gradient="linear-gradient(135deg, #00B42A 0%, #52C41A 100%)"
            subText="较昨日 +12.5%"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="库存总值"
            value={stats.totalValue}
            prefix={<DollarOutlined />}
            gradient="linear-gradient(135deg, #722ED1 0%, #B37FEB 100%)"
            subText="平均利润率 35.2%"
            formatter={(val) => `¥${Number(val).toLocaleString()}`}
          />
        </Col>
      </Row>

      {/* 筛选区域 */}
      <div style={styles.filterCard}>
        <div style={{ padding: '16px 20px' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col flex="auto">
              <Space size={12} wrap>
                <Input
                  placeholder="搜索商品名称/SKU"
                  prefix={<SearchOutlined style={{ color: '#c9cdd4' }} />}
                  style={{ width: 240, borderRadius: 6 }}
                  value={filters.keyword}
                  onChange={(e) => handleFilter({ keyword: e.target.value })}
                  allowClear
                />
                <Select
                  placeholder="平台"
                  style={{ width: 120, borderRadius: 6 }}
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
                  placeholder="分类"
                  style={{ width: 120, borderRadius: 6 }}
                  value={filters.category}
                  onChange={(val) => handleFilter({ category: val })}
                >
                  <Option value="all">全部分类</Option>
                  <Option value="数码配件">数码配件</Option>
                  <Option value="家居日用">家居日用</Option>
                  <Option value="服饰鞋包">服饰鞋包</Option>
                  <Option value="美妆个护">美妆个护</Option>
                  <Option value="食品生鲜">食品生鲜</Option>
                  <Option value="办公用品">办公用品</Option>
                </Select>
                <Select
                  placeholder="状态"
                  style={{ width: 100, borderRadius: 6 }}
                  value={filters.status}
                  onChange={(val) => handleFilter({ status: val })}
                >
                  <Option value="all">全部状态</Option>
                  <Option value="active">在售</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="out_of_stock">缺货</Option>
                  <Option value="disabled">已下架</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ borderRadius: 6 }}>
                  重置
                </Button>
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <Button icon={<ImportOutlined />} style={{ borderRadius: 6 }}>导入</Button>
                <Button icon={<ExportOutlined />} style={{ borderRadius: 6 }}>导出</Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ borderRadius: 6, background: '#165DFF', boxShadow: '0 2px 0 rgba(22,93,255,0.1)' }}
                  onClick={() => {
                    setCurrentProduct(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  添加商品
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      {/* 商品表格 */}
      <div style={styles.tableCard}>
        <div style={{ padding: '16px 20px 20px' }}>
          {/* 批量操作栏 */}
          {selectedRowKeys.length > 0 && (
            <div style={styles.batchBar}>
              <span style={{ fontSize: 13, color: '#1D2129' }}>
                已选择 <Text strong style={{ color: '#165DFF' }}>{selectedRowKeys.length}</Text> 个商品
              </span>
              <Space size={8}>
                <Button size="small" style={{ borderRadius: 4 }} onClick={() => handleBatchAction('disable')}>
                  批量下架
                </Button>
                <Button size="small" danger style={{ borderRadius: 4 }} onClick={() => handleBatchAction('delete')}>
                  批量删除
                </Button>
                <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
                  取消选择
                </Button>
              </Space>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            rowSelection={rowSelection}
            loading={loading}
            size="middle"
            pagination={{
              total: filteredProducts.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => <span style={{ color: '#86909C' }}>共 {total} 条数据</span>,
              style: { marginTop: 16 },
            }}
            scroll={{ x: 1200 }}
            style={{ marginTop: selectedRowKeys.length > 0 ? 0 : 0 }}
            rowClassName={(_, index) => index % 2 === 1 ? 'products-table-row-striped' : ''}
          />
        </div>
      </div>

      {/* 注入斑马纹样式 */}
      <style>{`
        .products-page .ant-table {
          border-radius: 8px;
          overflow: hidden;
        }
        .products-page .ant-table-thead > tr > th {
          background: #F7F8FA !important;
          font-weight: 600 !important;
          color: #1D2129 !important;
          font-size: 13px !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid #E5E6EB !important;
        }
        .products-page .ant-table-tbody > tr > td {
          padding: 10px 16px !important;
          font-size: 13px !important;
          color: #4E5969 !important;
          border-bottom: 1px solid #F2F3F5 !important;
        }
        .products-table-row-striped > td {
          background: #FAFBFC !important;
        }
        .products-page .ant-table-tbody > tr:hover > td {
          background: #F2F3FF !important;
        }
        .products-page .ant-table-cell-row-hover {
          background: #F2F3FF !important;
        }
        .products-page .ant-pagination .ant-pagination-item-active {
          border-color: #165DFF !important;
        }
        .products-page .ant-pagination .ant-pagination-item-active a {
          color: #165DFF !important;
        }
      `}</style>

      {/* 商品详情抽屉 */}
      <Drawer
        title={
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1D2129' }}>商品详情</span>
        }
        width={560}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        styles={{ header: { borderBottom: '1px solid #F2F3F5', padding: '16px 20px' }, body: { padding: 20 } }}
        extra={
          <Space size={8}>
            <Button onClick={() => {
              setDrawerVisible(false);
              if (currentProduct) handleEdit(currentProduct);
            }} style={{ borderRadius: 6 }}>
              编辑
            </Button>
            <Button type="primary" onClick={() => setDrawerVisible(false)} style={{ borderRadius: 6 }}>
              关闭
            </Button>
          </Space>
        }
      >
        {currentProduct && (
          <div>
            {/* 商品图片 */}
            <div style={{
              textAlign: 'center',
              marginBottom: 24,
              padding: 20,
              background: '#F7F8FA',
              borderRadius: 8,
            }}>
              <Image
                src={currentProduct.image}
                width={180}
                height={180}
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
            </div>

            {/* 商品名称和标签 */}
            <Title level={5} style={{ marginBottom: 12, color: '#1D2129' }}>
              {currentProduct.name}
            </Title>
            <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={currentProduct.platformColor} style={{ borderRadius: 4 }}>{currentProduct.platformName}</Tag>
              <Tag style={{ borderRadius: 4, background: '#F2F3F5', border: 'none', color: '#4E5969' }}>{currentProduct.category}</Tag>
              <Tag color={currentProduct.statusColor} style={{ borderRadius: 4 }}>{currentProduct.statusLabel}</Tag>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* 商品信息网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 20,
            }}>
              {[
                { label: 'SKU', value: currentProduct.sku, color: '#1D2129' },
                { label: '售价', value: `¥${currentProduct.price.toFixed(2)}`, color: '#165DFF', fontWeight: 600 },
                { label: '成本', value: `¥${currentProduct.cost.toFixed(2)}`, color: '#4E5969' },
                { label: '利润率', value: `${currentProduct.margin}%`, color: parseFloat(currentProduct.margin) > 40 ? '#00B42A' : '#FF7D00', fontWeight: 600 },
                { label: '库存', value: currentProduct.stock, color: currentProduct.stock < 20 ? '#FF7D00' : '#00B42A', fontWeight: 600 },
                { label: '销量', value: currentProduct.sales, color: '#1D2129' },
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  background: '#F7F8FA',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: item.color, fontWeight: item.fontWeight || 400 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* 时间信息 */}
            <div style={{
              padding: '12px 16px',
              background: '#F7F8FA',
              borderRadius: 8,
            }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 4 }}>创建时间</div>
                  <div style={{ fontSize: 13, color: '#4E5969' }}>{new Date(currentProduct.createdAt).toLocaleString()}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 4 }}>更新时间</div>
                  <div style={{ fontSize: 13, color: '#4E5969' }}>{new Date(currentProduct.updatedAt).toLocaleString()}</div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>

      {/* 添加/编辑商品弹窗 */}
      <Modal
        title={
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1D2129' }}>
            {currentProduct ? '编辑商品' : '添加商品'}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => {
          form.validateFields().then(values => {
            if (currentProduct) {
              setProducts(products.map(p => 
                p.id === currentProduct.id ? { ...p, ...values } : p
              ));
              message.success('更新成功');
            } else {
              const newProduct = {
                id: `SP${String(products.length + 1).padStart(6, '0')}`,
                ...values,
                profit: values.price - values.cost,
                margin: ((values.price - values.cost) / values.price * 100).toFixed(1),
                sales: 0,
                status: 'active',
                statusLabel: '在售',
                statusColor: 'green',
                image: `https://picsum.photos/seed/${Date.now()}/80/80`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setProducts([newProduct, ...products]);
              message.success('添加成功');
            }
            setModalVisible(false);
          });
        }}
        width={600}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ style: { background: '#165DFF', borderRadius: 6 } }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
                <Input placeholder="请输入商品名称" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input placeholder="请输入SKU" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
                <Select placeholder="请选择平台" style={{ borderRadius: 6 }}>
                  <Option value="douyin">抖音</Option>
                  <Option value="pdd">拼多多</Option>
                  <Option value="xianyu">闲鱼</Option>
                  <Option value="kuaishou">快手</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择分类" style={{ borderRadius: 6 }}>
                  <Option value="数码配件">数码配件</Option>
                  <Option value="家居日用">家居日用</Option>
                  <Option value="服饰鞋包">服饰鞋包</Option>
                  <Option value="美妆个护">美妆个护</Option>
                  <Option value="食品生鲜">食品生鲜</Option>
                  <Option value="办公用品">办公用品</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="售价" rules={[{ required: true, message: '请输入售价' }]}>
                <InputNumber
                  style={{ width: '100%', borderRadius: 6 }}
                  min={0}
                  precision={2}
                  prefix="¥"
                  placeholder="请输入售价"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cost" label="成本" rules={[{ required: true, message: '请输入成本' }]}>
                <InputNumber
                  style={{ width: '100%', borderRadius: 6 }}
                  min={0}
                  precision={2}
                  prefix="¥"
                  placeholder="请输入成本"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label="库存" rules={[{ required: true, message: '请输入库存' }]}>
                <InputNumber
                  style={{ width: '100%', borderRadius: 6 }}
                  min={0}
                  placeholder="请输入库存"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="商品描述">
            <TextArea rows={4} placeholder="请输入商品描述" style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
