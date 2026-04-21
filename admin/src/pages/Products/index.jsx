import React, { useState, useMemo } from 'react';
import {
  Card, Button, Select, Input, Grid, Tag, Typography, Space,
  Drawer, Modal, Form, Table, Pagination, Image, Divider,
  Message, Popconfirm, Dropdown, Menu, Upload, Tooltip,
} from '@arco-design/web-react';
import {
  IconPlus, IconSearch, IconEdit, IconDelete, IconEye,
  IconApps, IconList, IconUp, IconDown, IconMore,
  IconStorage, IconShrink, IconSafe, IconStar,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Text, Title } = Typography;
const Option = Select.Option;
const FormItem = Form.Item;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const platforms = ['淘宝', '京东', '拼多多', '抖音', '小红书'];
const categories = ['服装', '数码', '美妆', '食品', '家居', '运动'];

function generateMockProducts() {
  const names = [
    '春季新款轻薄羽绒服', '无线蓝牙降噪耳机', '保湿精华面霜 50ml',
    '有机坚果混合礼盒', '北欧风格台灯', '瑜伽垫加厚防滑',
    '男士商务休闲皮带', '便携式充电宝 20000mAh', '口红哑光持久不脱色',
    '进口咖啡豆 深烘焙', '智能体重秤', '运动速干T恤',
    '机械键盘 青轴RGB', '防晒喷雾 SPF50', '陶瓷马克杯套装',
    '蓝牙音箱 户外防水',
  ];

  return names.map((name, i) => {
    const platform = platforms[i % platforms.length];
    const cost = Math.round((Math.random() * 200 + 30) * 100) / 100;
    const markup = 1.2 + Math.random() * 1.3;
    const price = Math.round(cost * markup * 100) / 100;
    const originalPrice = Math.round(price * (1.1 + Math.random() * 0.4) * 100) / 100;
    const status = ['on_sale', 'draft', 'off_shelf'][i % 3];
    const stock = status === 'draft' ? 0 : Math.floor(Math.random() * 500 + 10);
    const riskScore = Math.round(Math.random() * 100);
    const sales = Math.floor(Math.random() * 2000);
    const category = categories[i % categories.length];

    // price history (30 days)
    const priceHistory = Array.from({ length: 30 }, (_, d) => ({
      day: d + 1,
      price: Math.round((price + (Math.random() - 0.5) * 20) * 100) / 100,
    }));

    // competitor data
    const competitors = platforms
      .filter((p) => p !== platform)
      .slice(0, 3)
      .map((p) => ({
        platform: p,
        price: Math.round((price + (Math.random() - 0.5) * 40) * 100) / 100,
        sales: Math.floor(Math.random() * 3000),
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      }));

    // SKUs
    const skuCount = Math.floor(Math.random() * 3) + 1;
    const colorOpts = ['黑色', '白色', '蓝色', '红色', '灰色'];
    const sizeOpts = ['S', 'M', 'L', 'XL'];
    const skus = Array.from({ length: skuCount }, (_, j) => ({
      id: `SKU-${String(i + 1).padStart(3, '0')}-${j + 1}`,
      spec: `${colorOpts[j % colorOpts.length]} / ${sizeOpts[j % sizeOpts.length]}`,
      price: Math.round((price + (j - 1) * 5) * 100) / 100,
      stock: Math.floor(Math.random() * 100 + 5),
    }));

    const imgIdx = (i % 16) + 1;
    const image = `https://picsum.photos/seed/product${i + 1}/400/400`;

    return {
      id: i + 1,
      name,
      category,
      platform,
      price,
      originalPrice,
      cost,
      grossMargin: Math.round(((price - cost) / price) * 10000) / 100,
      stock,
      status,
      riskScore,
      sales,
      image,
      images: [image, `https://picsum.photos/seed/p${i}b/400/400`, `https://picsum.photos/seed/p${i}c/400/400`],
      description: `高品质${name}，适用于多种场景，深受用户好评。采用优质材料，工艺精湛，品质保证。`,
      skus,
      priceHistory,
      competitors,
      createdAt: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    };
  });
}

const mockProducts = generateMockProducts();

// ─── SVG Mini Price Chart ─────────────────────────────────────────────────────

function MiniPriceChart({ data, width = 280, height = 120 }) {
  if (!data || data.length === 0) return null;
  const prices = data.map((d) => d.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;
  const padX = 30;
  const padY = 16;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * plotW;
    const y = padY + plotH - ((d.price - min) / range) * plotH;
    return { x, y, price: d.price, day: d.day };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${padY + plotH} L${points[0].x},${padY + plotH} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4080FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4080FF" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padY + plotH * (1 - pct);
        const val = min + range * pct;
        return (
          <g key={pct}>
            <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#303650" strokeWidth="0.5" />
            <text x={padX - 4} y={y + 4} textAnchor="end" fill="#86909C" fontSize="9">
              {val.toFixed(0)}
            </text>
          </g>
        );
      })}
      {/* area fill */}
      <path d={areaD} fill="url(#priceGrad)" />
      {/* line */}
      <path d={pathD} fill="none" stroke="#4080FF" strokeWidth="2" strokeLinejoin="round" />
      {/* dots on hover could go here */}
      {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#4080FF" stroke="#1E2030" strokeWidth="1.5" />
      ))}
      {/* x-axis labels */}
      <text x={padX} y={height - 2} fill="#86909C" fontSize="9">第1天</text>
      <text x={padX + plotW} y={height - 2} textAnchor="end" fill="#86909C" fontSize="9">第30天</text>
    </svg>
  );
}

// ─── Risk Score Badge ─────────────────────────────────────────────────────────

function RiskBadge({ score }) {
  let color, bg;
  if (score <= 30) { color = '#00B42A'; bg = 'rgba(0,180,42,0.12)'; }
  else if (score <= 70) { color = '#FF7D00'; bg = 'rgba(255,125,0,0.12)'; }
  else { color = '#F53F3F'; bg = 'rgba(245,63,63,0.12)'; }

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 2,
      background: bg, color, borderRadius: 8,
      padding: '2px 8px', fontSize: 11, fontWeight: 600,
      backdropFilter: 'blur(4px)', border: `1px solid ${color}33`,
    }}>
      风险 {score}
    </div>
  );
}

// ─── Status Tag Helper ────────────────────────────────────────────────────────

function StatusTag({ status }) {
  const map = {
    on_sale: { label: '在售', color: '#00B42A', bg: 'rgba(0,180,42,0.1)' },
    draft: { label: '草稿', color: '#86909C', bg: 'rgba(134,144,156,0.1)' },
    off_shelf: { label: '已下架', color: '#F53F3F', bg: 'rgba(245,63,63,0.1)' },
  };
  const s = map[status] || map.draft;
  return <Tag color={s.color} style={{ background: s.bg, border: 'none', borderRadius: 4 }}>{s.label}</Tag>;
}

function PlatformTag({ platform }) {
  const colors = {
    '淘宝': '#FF4400', '京东': '#E2231A', '拼多多': '#E02E24',
    '抖音': '#161823', '小红书': '#FF2442',
  };
  return <Tag color={colors[platform] || '#4080FF'} size="small" style={{ borderRadius: 4 }}>{platform}</Tag>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Products() {
  const [viewMode, setViewMode] = useState('card');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);

  // detail drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // add/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // ─── Filtering ───────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [platformFilter, statusFilter, searchText]);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openDetail = (product) => {
    setCurrentProduct(product);
    setDrawerVisible(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const toggleStatus = (product) => {
    const newStatus = product.status === 'on_sale' ? 'off_shelf' : 'on_sale';
    const idx = mockProducts.findIndex((p) => p.id === product.id);
    if (idx > -1) {
      mockProducts[idx].status = newStatus;
      // force re-render via dummy state update
      setSearchText((s) => s);
      Message.success(newStatus === 'on_sale' ? '已上架' : '已下架');
    }
  };

  const handleDelete = (product) => {
    const idx = mockProducts.findIndex((p) => p.id === product.id);
    if (idx > -1) {
      mockProducts.splice(idx, 1);
      setSearchText((s) => s);
      Message.success('已删除');
    }
  };

  const handleFormSubmit = () => {
    form.validate().then((values) => {
      if (editingProduct) {
        Object.assign(editingProduct, values);
        Message.success('商品已更新');
      } else {
        Message.success('商品已创建');
      }
      setModalVisible(false);
    });
  };

  const batchAction = (action) => {
    Message.info(`批量${action}操作已执行（模拟）`);
  };

  // ─── Card View ───────────────────────────────────────────────────────────

  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {pagedProducts.map((product) => (
        <Col span={6} key={product.id}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            bodyStyle={{ padding: 0 }}
            onClick={() => openDetail(product)}
          >
            <RiskBadge score={product.riskScore} />

            {/* Image */}
            <div style={{ position: 'relative', paddingTop: '100%', background: '#f7f8fa', overflow: 'hidden' }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.3s',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Content */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <PlatformTag platform={product.platform} />
                <StatusTag status={product.status} />
              </div>

              <Text style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8, lineHeight: '20px', height: 40, overflow: 'hidden' }}>
                {product.name}
              </Text>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 20, fontWeight: 700, color: '#F53F3F' }}>
                  ¥{product.price.toFixed(2)}
                </Text>
                <Text delete style={{ fontSize: 12, color: '#86909C' }}>
                  ¥{product.originalPrice.toFixed(2)}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#86909C' }}>
                  <IconStorage style={{ marginRight: 4, fontSize: 12 }} />
                  库存 {product.stock}
                </Text>
                <Text style={{ fontSize: 12, color: '#86909C' }}>销量 {product.sales}</Text>
              </div>

              <Divider style={{ margin: '0 0 10px 0' }} />

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Button type="text" size="mini" icon={<IconEdit />}
                  onClick={() => openEditModal(product)}
                >
                  编辑
                </Button>
                <Button
                  type="text" size="mini"
                  icon={product.status === 'on_sale' ? <IconDown /> : <IconUp />}
                  onClick={() => toggleStatus(product)}
                >
                  {product.status === 'on_sale' ? '下架' : '上架'}
                </Button>
                <Popconfirm
                  title="确定删除该商品？"
                  onOk={() => handleDelete(product)}
                  position="br"
                >
                  <Button type="text" size="mini" status="danger" icon={<IconDelete />}>
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // ─── List View ───────────────────────────────────────────────────────────

  const listColumns = [
    {
      title: '商品',
      dataIndex: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
            background: '#f7f8fa', flexShrink: 0,
          }}>
            <img src={record.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <Text style={{ fontWeight: 500, display: 'block', maxWidth: 240 }} ellipsis>{record.name}</Text>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <PlatformTag platform={record.platform} />
              <StatusTag status={record.status} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      sorter: (a, b) => a.price - b.price,
      render: (val, record) => (
        <div>
          <Text style={{ fontWeight: 600, color: '#F53F3F' }}>¥{val.toFixed(2)}</Text>
          <br />
          <Text delete style={{ fontSize: 12, color: '#86909C' }}>¥{record.originalPrice.toFixed(2)}</Text>
        </div>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (val) => (
        <Text style={{ color: val < 20 ? '#F53F3F' : 'inherit' }}>{val}</Text>
      ),
    },
    {
      title: '毛利',
      dataIndex: 'grossMargin',
      sorter: (a, b) => a.grossMargin - b.grossMargin,
      render: (val) => `${val}%`,
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      sorter: (a, b) => a.riskScore - b.riskScore,
      render: (val) => {
        let color = val <= 30 ? '#00B42A' : val <= 70 ? '#FF7D00' : '#F53F3F';
        return <Tag color={color}>{val}</Tag>;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<IconEye />} onClick={() => openDetail(record)}>详情</Button>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onOk={() => handleDelete(record)}>
            <Button type="text" size="small" status="danger" icon={<IconDelete />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Detail Drawer Content ───────────────────────────────────────────────

  const renderDrawerContent = () => {
    if (!currentProduct) return null;
    const p = currentProduct;

    return (
      <div>
        {/* Images */}
        <Title heading={6} style={{ marginBottom: 12 }}>商品图片</Title>
        <Image.PreviewGroup>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {p.images.map((img, i) => (
              <Image key={i} src={img} width={100} height={100}
                style={{ borderRadius: 8, objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        </Image.PreviewGroup>

        {/* Basic Info */}
        <Title heading={6} style={{ marginBottom: 12 }}>基本信息</Title>
        <Card style={{ borderRadius: 8, marginBottom: 20 }} bodyStyle={{ padding: 16 }}>
          <Row gutter={[0, 8]}>
            <Col span={24}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>商品名称</Text>
              <Text style={{ display: 'block', fontWeight: 500 }}>{p.name}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>分类</Text>
              <Text style={{ display: 'block' }}>{p.category}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>平台</Text>
              <div style={{ marginTop: 2 }}><PlatformTag platform={p.platform} /></div>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>售价</Text>
              <Text style={{ display: 'block', color: '#F53F3F', fontWeight: 600 }}>¥{p.price.toFixed(2)}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>原价</Text>
              <Text style={{ display: 'block' }}>¥{p.originalPrice.toFixed(2)}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>成本价</Text>
              <Text style={{ display: 'block' }}>¥{p.cost.toFixed(2)}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>毛利率</Text>
              <Text style={{ display: 'block', color: '#00B42A', fontWeight: 600 }}>{p.grossMargin}%</Text>
            </Col>
            <Col span={24}>
              <Text style={{ color: '#86909C', fontSize: 12 }}>描述</Text>
              <Text style={{ display: 'block', lineHeight: 1.6 }}>{p.description}</Text>
            </Col>
          </Row>
        </Card>

        {/* SKU Table */}
        <Title heading={6} style={{ marginBottom: 12 }}>SKU 列表</Title>
        <Table
          columns={[
            { title: 'SKU编号', dataIndex: 'id' },
            { title: '规格', dataIndex: 'spec' },
            { title: '价格', dataIndex: 'price', render: (v) => `¥${v.toFixed(2)}` },
            { title: '库存', dataIndex: 'stock' },
          ]}
          data={p.skus}
          pagination={false}
          size="small"
          style={{ marginBottom: 20 }}
          border={false}
        />

        {/* Price History Chart */}
        <Title heading={6} style={{ marginBottom: 12 }}>价格趋势 (近30天)</Title>
        <Card style={{ borderRadius: 8, marginBottom: 20 }} bodyStyle={{ padding: 16 }}>
          <MiniPriceChart data={p.priceHistory} width={420} height={160} />
        </Card>

        {/* Competitors */}
        <Title heading={6} style={{ marginBottom: 12 }}>竞品对比</Title>
        <Table
          columns={[
            { title: '平台', dataIndex: 'platform', render: (v) => <PlatformTag platform={v} /> },
            { title: '价格', dataIndex: 'price', render: (v) => `¥${v.toFixed(2)}` },
            { title: '销量', dataIndex: 'sales' },
            { title: '评分', dataIndex: 'rating', render: (v) => (
              <span>
                <IconStar style={{ color: '#FF7D00', fontSize: 12, marginRight: 2 }} />
                {v}
              </span>
            )},
          ]}
          data={p.competitors}
          pagination={false}
          size="small"
          border={false}
        />
      </div>
    );
  };

  // ─── Add / Edit Modal ────────────────────────────────────────────────────

  const renderFormModal = () => (
    <Modal
      title={editingProduct ? '编辑商品' : '新增商品'}
      visible={modalVisible}
      onOk={handleFormSubmit}
      onCancel={() => setModalVisible(false)}
      style={{ width: 640 }}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <FormItem label="商品标题" field="name" rules={[{ required: true, message: '请输入商品标题' }]}>
          <Input placeholder="请输入商品标题" />
        </FormItem>
        <FormItem label="商品描述" field="description">
          <Input.TextArea placeholder="请输入商品描述" rows={3} />
        </FormItem>
        <Row gutter={16}>
          <Col span={12}>
            <FormItem label="分类" field="category" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类">
                {categories.map((c) => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="平台" field="platform" rules={[{ required: true, message: '请选择平台' }]}>
              <Select placeholder="请选择平台">
                {platforms.map((p) => <Option key={p} value={p}>{p}</Option>)}
              </Select>
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <FormItem label="售价 (¥)" field="price" rules={[{ required: true, message: '请输入售价' }]}>
              <Input placeholder="0.00" type="number" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="原价 (¥)" field="originalPrice">
              <Input placeholder="0.00" type="number" />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="成本价 (¥)" field="cost">
              <Input placeholder="0.00" type="number" />
            </FormItem>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <FormItem label="库存" field="stock" rules={[{ required: true, message: '请输入库存' }]}>
              <Input placeholder="0" type="number" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="毛利自动计算">
              <Input
                disabled
                value={
                  form.getFieldValue('price') && form.getFieldValue('cost')
                    ? `${(((form.getFieldValue('price') - form.getFieldValue('cost')) / form.getFieldValue('price')) * 100).toFixed(2)}%`
                    : '--'
                }
              />
            </FormItem>
          </Col>
        </Row>
        <FormItem label="商品图片">
          <Upload
            listType="picture-card"
            action="/"
            limit={5}
            accept="image/*"
          >
            <div style={{ color: '#86909C', fontSize: 12 }}>
              <IconPlus style={{ fontSize: 20, marginBottom: 4 }} />
              <div>上传图片</div>
            </div>
          </Upload>
        </FormItem>
      </Form>
    </Modal>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Top Action Bar */}
      <Card
        style={{ borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={openAddModal}>
              新增商品
            </Button>
            <Button icon={<IconUp />} onClick={() => batchAction('批量上架')}>
              批量上架
            </Button>
            <Button icon={<IconDown />} onClick={() => batchAction('批量下架')}>
              批量下架
            </Button>
          </Space>

          <Space>
            <Select
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: 120 }}
              placeholder="平台筛选"
            >
              <Option value="all">全部平台</Option>
              {platforms.map((p) => <Option key={p} value={p}>{p}</Option>)}
            </Select>

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              placeholder="状态筛选"
            >
              <Option value="all">全部</Option>
              <Option value="on_sale">在售</Option>
              <Option value="draft">草稿</Option>
              <Option value="off_shelf">已下架</Option>
            </Select>

            <Input
              prefix={<IconSearch />}
              placeholder="搜索商品名称"
              value={searchText}
              onChange={setSearchText}
              style={{ width: 200 }}
              allowClear
            />

            <Button.Group>
              <Button
                type={viewMode === 'card' ? 'primary' : 'secondary'}
                icon={<IconApps />}
                onClick={() => setViewMode('card')}
              />
              <Button
                type={viewMode === 'list' ? 'primary' : 'secondary'}
                icon={<IconList />}
                onClick={() => setViewMode('list')}
              />
            </Button.Group>
          </Space>
        </div>
      </Card>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 60 }}>
          <Text style={{ color: '#86909C', fontSize: 14 }}>暂无符合条件的商品</Text>
        </Card>
      ) : viewMode === 'card' ? (
        renderCardView()
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Table
            columns={listColumns}
            data={pagedProducts}
            pagination={false}
            rowKey="id"
            border={false}
          />
        </Card>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <Pagination
            current={currentPage}
            total={filteredProducts.length}
            pageSize={pageSize}
            onChange={setCurrentPage}
            showTotal={(total) => `共 ${total} 个商品`}
            sizeOptions={[8, 16, 24]}
            showJumper
          />
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title="商品详情"
        visible={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        width={520}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)} style={{ marginRight: 8 }}>关闭</Button>
            <Button type="primary" onClick={() => {
              setDrawerVisible(false);
              openEditModal(currentProduct);
            }}>
              编辑商品
            </Button>
          </div>
        }
      >
        {renderDrawerContent()}
      </Drawer>

      {/* Add / Edit Modal */}
      {renderFormModal()}
    </div>
  );
}
