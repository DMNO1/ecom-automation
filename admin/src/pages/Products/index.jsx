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
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src={record.image}
            width={60}
            height={60}
            style={{ borderRadius: 4, objectFit: 'cover', marginRight: 12 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {text}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              SKU: {record.sku}
            </div>
            <Tag color={record.platformColor} style={{ marginTop: 4, fontSize: 12 }}>
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
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      sorter: (a, b) => a.price - b.price,
      render: (val) => <Text strong>¥{val.toFixed(2)}</Text>,
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (val) => <Text type="secondary">¥{val.toFixed(2)}</Text>,
    },
    {
      title: '利润率',
      dataIndex: 'margin',
      key: 'margin',
      width: 100,
      sorter: (a, b) => parseFloat(a.margin) - parseFloat(b.margin),
      render: (val) => (
        <Tag color={parseFloat(val) > 40 ? 'green' : parseFloat(val) > 20 ? 'blue' : 'orange'}>
          {val}%
        </Tag>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      sorter: (a, b) => a.stock - b.stock,
      render: (val) => (
        <span style={{ color: val === 0 ? '#F53F3F' : val < 20 ? '#FF7D00' : '#00B42A', fontWeight: 500 }}>
          {val}
          {val === 0 && <Tag color="red" style={{ marginLeft: 4 }}>缺货</Tag>}
          {val > 0 && val < 20 && <Tag color="orange" style={{ marginLeft: 4 }}>预警</Tag>}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
      sorter: (a, b) => a.sales - b.sales,
    },
    {
      title: '状态',
      dataIndex: 'statusLabel',
      key: 'status',
      width: 80,
      render: (text, record) => (
        <Tag color={record.statusColor}>{text}</Tag>
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
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'copy', icon: <CopyOutlined />, label: '复制商品' },
                { key: 'qrcode', icon: <QrcodeOutlined />, label: '生成二维码' },
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
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <div className="products-page">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="在售商品"
              value={stats.active}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#165DFF' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              总计 {stats.total} 个商品
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="库存预警"
              value={stats.lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#FF7D00' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              缺货 {stats.outOfStock} 个
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="今日销量"
              value={stats.todaySales}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#00B42A' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              较昨日 +12.5%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="库存总值"
              value={stats.totalValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ED1' }}
              formatter={(val) => `¥${Number(val).toLocaleString()}`}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              平均利润率 35.2%
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
                placeholder="搜索商品名称/SKU"
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
                placeholder="分类"
                style={{ width: 120 }}
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
                style={{ width: 100 }}
                value={filters.status}
                onChange={(val) => handleFilter({ status: val })}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">在售</Option>
                <Option value="draft">草稿</Option>
                <Option value="out_of_stock">缺货</Option>
                <Option value="disabled">已下架</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ImportOutlined />}>导入</Button>
              <Button icon={<ExportOutlined />}>导出</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setCurrentProduct(null);
                form.resetFields();
                setModalVisible(true);
              }}>
                添加商品
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 商品表格 */}
      <Card bordered={false}>
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
              已选择 <Text strong>{selectedRowKeys.length}</Text> 个商品
            </span>
            <Space>
              <Button size="small" onClick={() => handleBatchAction('disable')}>
                批量下架
              </Button>
              <Button size="small" danger onClick={() => handleBatchAction('delete')}>
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
          pagination={{
            total: filteredProducts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 商品详情抽屉 */}
      <Drawer
        title="商品详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerVisible(false);
              if (currentProduct) handleEdit(currentProduct);
            }}>
              编辑
            </Button>
            <Button type="primary" onClick={() => setDrawerVisible(false)}>
              关闭
            </Button>
          </Space>
        }
      >
        {currentProduct && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Image
                src={currentProduct.image}
                width={200}
                height={200}
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
            </div>
            <Title level={5}>{currentProduct.name}</Title>
            <div style={{ marginBottom: 16 }}>
              <Tag color={currentProduct.platformColor}>{currentProduct.platformName}</Tag>
              <Tag>{currentProduct.category}</Tag>
              <Tag color={currentProduct.statusColor}>{currentProduct.statusLabel}</Tag>
            </div>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">SKU</Text>
                <div>{currentProduct.sku}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">售价</Text>
                <div style={{ fontWeight: 500, color: '#165DFF' }}>¥{currentProduct.price.toFixed(2)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">成本</Text>
                <div>¥{currentProduct.cost.toFixed(2)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">利润率</Text>
                <div style={{ color: parseFloat(currentProduct.margin) > 40 ? '#00B42A' : '#FF7D00' }}>
                  {currentProduct.margin}%
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">库存</Text>
                <div style={{ color: currentProduct.stock < 20 ? '#FF7D00' : '#00B42A' }}>
                  {currentProduct.stock}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">销量</Text>
                <div>{currentProduct.sales}</div>
              </Col>
              <Col span={24}>
                <Text type="secondary">创建时间</Text>
                <div>{new Date(currentProduct.createdAt).toLocaleString()}</div>
              </Col>
              <Col span={24}>
                <Text type="secondary">更新时间</Text>
                <div>{new Date(currentProduct.updatedAt).toLocaleString()}</div>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>

      {/* 添加/编辑商品弹窗 */}
      <Modal
        title={currentProduct ? '编辑商品' : '添加商品'}
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
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input placeholder="请输入SKU" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
                <Select placeholder="请选择平台">
                  <Option value="douyin">抖音</Option>
                  <Option value="pdd">拼多多</Option>
                  <Option value="xianyu">闲鱼</Option>
                  <Option value="kuaishou">快手</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择分类">
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
                  style={{ width: '100%' }}
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
                  style={{ width: '100%' }}
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
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入库存"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="商品描述">
            <TextArea rows={4} placeholder="请输入商品描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;