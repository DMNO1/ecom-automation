import React, { useState, useMemo } from 'react';
import {
  Card, Grid, Typography, Tag, Button, Switch, List, Avatar, Modal, Form,
  Input, Select, Rate, Table, Space, Divider, Tooltip, Message,
} from '@arco-design/web-react';
import {
  IconEye, IconPlus, IconSearch, IconEdit, IconDelete,
  IconArrowRise, IconThunderbolt, IconFire,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Title, Text, Paragraph } = Typography;
const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

/* ─── Mock Data ─────────────────────────────────────────────── */

const mockCompetitors = [
  { id: 1, title: '无线蓝牙耳机 Pro Max', image: 'https://picsum.photos/seed/c1/80/80', currentPrice: 189, originPrice: 259, platform: '京东', enabled: true, rating: 5, link: 'https://jd.com/1001', alias: 'JD-耳机A' },
  { id: 2, title: '智能手表运动版 S3', image: 'https://picsum.photos/seed/c2/80/80', currentPrice: 329, originPrice: 399, platform: '淘宝', enabled: true, rating: 4, link: 'https://taobao.com/2002', alias: 'TB-手表B' },
  { id: 3, title: '便携式充电宝 20000mAh', image: 'https://picsum.photos/seed/c3/80/80', currentPrice: 79, originPrice: 99, platform: '拼多多', enabled: false, rating: 3, link: 'https://pdd.com/3003', alias: 'PDD-充电宝C' },
  { id: 4, title: '降噪头戴式耳机 NC-500', image: 'https://picsum.photos/seed/c4/80/80', currentPrice: 459, originPrice: 599, platform: '京东', enabled: true, rating: 5, link: 'https://jd.com/4004', alias: 'JD-头戴D' },
  { id: 5, title: '迷你蓝牙音箱 Bass+', image: 'https://picsum.photos/seed/c5/80/80', currentPrice: 129, originPrice: 169, platform: '淘宝', enabled: true, rating: 2, link: 'https://taobao.com/5005', alias: 'TB-音箱E' },
];

const generatePriceTrend = (base) => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const fluctuation = (Math.random() - 0.4) * base * 0.15;
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round((base + fluctuation) * 100) / 100,
    });
  }
  return data;
};

const mockChangeLogs = [
  { id: 1, time: '2026-04-20 14:32', type: 'price', content: '价格从 ¥259 降至 ¥189', action: '考虑跟进降价或增加赠品' },
  { id: 2, time: '2026-04-19 10:15', type: 'title', content: '标题增加"2026新款"关键词', action: '评估自身标题SEO优化' },
  { id: 3, time: '2026-04-18 08:44', type: 'image', content: '更换主图为白底场景图', action: '检查自身主图点击率' },
  { id: 4, time: '2026-04-17 16:20', type: 'promo', content: '参加满200-30促销活动', action: '评估是否参与同类活动' },
  { id: 5, time: '2026-04-15 11:00', type: 'price', content: '价格从 ¥289 调至 ¥259', action: '持续关注价格走势' },
  { id: 6, time: '2026-04-13 09:30', type: 'title', content: '标题删除"限量版"字样', action: '无操作' },
  { id: 7, time: '2026-04-10 15:45', type: 'promo', content: '开启限时秒杀 ¥169', action: '考虑设置限时优惠应对' },
];

const typeTagConfig = {
  price: { color: 'blue', label: '价格变动' },
  title: { color: 'orange', label: '标题修改' },
  image: { color: 'purple', label: '主图更换' },
  promo: { color: 'red', label: '促销活动' },
};

const mockKeywords = [
  { text: '音质好', weight: 5 }, { text: '续航长', weight: 4 }, { text: '佩戴舒适', weight: 5 },
  { text: '降噪效果好', weight: 4 }, { text: '外观好看', weight: 3 }, { text: '性价比高', weight: 5 },
  { text: '连接稳定', weight: 3 }, { text: '充电快', weight: 2 }, { text: '轻便', weight: 3 },
  { text: '做工精细', weight: 4 }, { text: '低音强劲', weight: 3 }, { text: '包装精美', weight: 2 },
  { text: '通话清晰', weight: 3 }, { text: '运动适用', weight: 2 }, { text: '蓝牙5.3', weight: 4 },
  { text: '快充', weight: 3 }, { text: '游戏延迟低', weight: 2 }, { text: '折叠便携', weight: 1 },
];

/* ─── Sub-components ────────────────────────────────────────── */

function MiniPriceChart({ data, color = '#4080FF' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.price));
  const min = Math.min(...data.map(d => d.price));
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.price - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const gradId = `priceGrad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function KeywordCloud({ keywords }) {
  const maxW = Math.max(...keywords.map(k => k.weight));
  const minSize = 12, maxSize = 28;
  const colors = ['#4080FF', '#00B42A', '#FF7D00', '#F53F3F', '#722ED1', '#165DFF', '#0FC6C2', '#FFB800'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 0' }}>
      {keywords.map((kw, i) => {
        const size = minSize + ((kw.weight / maxW) * (maxSize - minSize));
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              color: colors[i % colors.length],
              fontWeight: kw.weight >= 4 ? 600 : 400,
              cursor: 'default',
              lineHeight: 1.6,
            }}
          >
            {kw.text}
          </span>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, icon, color, gradientColor }) {
  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Space direction="vertical" size={4}>
        <Text style={{ color: '#86909C', fontSize: 13 }}>{title}</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {React.cloneElement(icon, { style: { fontSize: 22, color } })}
          </div>
          <Text style={{
            fontSize: 28, fontWeight: 600,
            background: `linear-gradient(90deg, ${gradientColor[0]}, ${gradientColor[1]})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {value}
          </Text>
        </div>
      </Space>
    </Card>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function Competitors() {
  const [selectedId, setSelectedId] = useState(1);
  const [competitors, setCompetitors] = useState(mockCompetitors);
  const [addVisible, setAddVisible] = useState(false);
  const [form] = Form.useForm();

  const selected = useMemo(() => competitors.find(c => c.id === selectedId), [competitors, selectedId]);
  const priceTrend = useMemo(() => selected ? generatePriceTrend(selected.currentPrice) : [], [selectedId]);

  const monitoredCount = competitors.filter(c => c.enabled).length;
  const todayChanges = 3;
  const promoAlerts = 2;

  const handleToggle = (id, val) => {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, enabled: val } : c));
  };

  const handleAdd = () => {
    form.validate().then(values => {
      const newItem = {
        id: Date.now(),
        title: values.alias || '新竞品',
        image: `https://picsum.photos/seed/${Date.now()}/80/80`,
        currentPrice: 0,
        originPrice: 0,
        platform: values.platform,
        enabled: true,
        rating: values.rating || 3,
        link: values.link,
        alias: values.alias,
      };
      setCompetitors(prev => [newItem, ...prev]);
      setAddVisible(false);
      form.resetFields();
      Message.success('竞品添加成功');
    });
  };

  const changeLogColumns = [
    { title: '时间', dataIndex: 'time', width: 160,
      render: (v) => <Text style={{ color: '#86909C', fontSize: 13 }}>{v}</Text> },
    { title: '变化类型', dataIndex: 'type', width: 110,
      render: (v) => {
        const cfg = typeTagConfig[v];
        return <Tag color={cfg.color} size="small">{cfg.label}</Tag>;
      }},
    { title: '变化内容', dataIndex: 'content',
      render: (v) => <Text style={{ color: '#fff' }}>{v}</Text> },
    { title: '建议动作', dataIndex: 'action',
      render: (v) => <Text style={{ color: '#FFB800' }}>{v}</Text> },
  ];

  /* ─── Styles ─── */
  const darkCard = {
    background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
    borderRadius: 12, border: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  };
  const headerStyle = { borderBottom: '1px solid #303650' };
  const bodyStyle = { padding: 20 };
  const scrollbarStyle = { overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' };

  return (
    <div style={{ padding: 24, background: '#171924', minHeight: '100vh' }}>
      {/* ── Top Stats ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <StatCard
            title="监控商品数"
            value={monitoredCount}
            icon={<IconEye />}
            color="#4080FF"
            gradientColor={['#4080FF', '#6EAAFF']}
          />
        </Col>
        <Col span={8}>
          <StatCard
            title="今日价格变化"
            value={todayChanges}
            icon={<IconArrowRise />}
            color="#FF7D00"
            gradientColor={['#FF7D00', '#FFB366']}
          />
        </Col>
        <Col span={8}>
          <StatCard
            title="活动预警数"
            value={promoAlerts}
            icon={<IconThunderbolt />}
            color="#F53F3F"
            gradientColor={['#F53F3F', '#FF7A7A']}
          />
        </Col>
      </Row>

      {/* ── Main Split ── */}
      <Row gutter={16}>
        {/* Left Panel */}
        <Col span={7}>
          <Card
            style={darkCard}
            headerStyle={headerStyle}
            bodyStyle={{ ...bodyStyle, padding: 0 }}
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff', fontWeight: 600 }}>竞品列表</Text>
                <Button type="primary" size="small" icon={<IconPlus />} onClick={() => setAddVisible(true)}>
                  添加竞品
                </Button>
              </Space>
            }
          >
            <div style={scrollbarStyle}>
              <List
                dataSource={competitors}
                render={(item) => (
                  <List.Item
                    key={item.id}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: item.id === selectedId ? 'rgba(64,128,255,0.12)' : 'transparent',
                      borderLeft: item.id === selectedId ? '3px solid #4080FF' : '3px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedId(item.id)}
                    action={[
                      <Switch
                        key="switch"
                        size="small"
                        checked={item.enabled}
                        onChange={(val) => handleToggle(item.id, val)}
                        onClick={(val, e) => e.stopPropagation()}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar shape="square" size={48} style={{ borderRadius: 8 }}>
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Avatar>}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: '#fff', fontSize: 13, flex: 1 }} ellipsis>{item.title}</Text>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={2} style={{ marginTop: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: '#F53F3F', fontSize: 15, fontWeight: 600 }}>¥{item.currentPrice}</Text>
                            <Text delete style={{ color: '#86909C', fontSize: 12 }}>¥{item.originPrice}</Text>
                          </div>
                          <Rate value={item.rating} count={5} disabled allowHalf
                            character={<span style={{ fontSize: 10 }}>★</span>}
                            style={{ fontSize: 10 }}
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* Right Panel */}
        <Col span={17}>
          {selected ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* Basic Info */}
              <Card style={darkCard} headerStyle={headerStyle} bodyStyle={bodyStyle} title="基本信息">
                <Row gutter={16} align="center">
                  <Col span={4}>
                    <Avatar shape="square" size={80} style={{ borderRadius: 10 }}>
                      <img src={selected.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Avatar>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={6}>
                      <Title heading={5} style={{ color: '#fff', margin: 0 }}>{selected.title}</Title>
                      <Space>
                        <Tag color="arcoblue">{selected.platform}</Tag>
                        <Tag color="gray">{selected.alias}</Tag>
                        <Rate value={selected.rating} count={5} disabled allowHalf
                          character={<span style={{ fontSize: 12 }}>★</span>}
                        />
                      </Space>
                      <Text style={{ color: '#86909C', fontSize: 12, wordBreak: 'break-all' }}>{selected.link}</Text>
                    </Space>
                  </Col>
                  <Col span={8}>
                    <Space direction="vertical" size={4} style={{ textAlign: 'right', width: '100%' }}>
                      <Text style={{ color: '#86909C', fontSize: 13 }}>当前价格</Text>
                      <Text style={{ fontSize: 32, fontWeight: 700, color: '#F53F3F' }}>¥{selected.currentPrice}</Text>
                      <Text delete style={{ color: '#86909C' }}>¥{selected.originPrice}</Text>
                      <Tag color={selected.enabled ? 'green' : 'gray'}>
                        {selected.enabled ? '监控中' : '已暂停'}
                      </Tag>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* Price Trend */}
              <Card style={darkCard} headerStyle={headerStyle} bodyStyle={bodyStyle}
                title={<span style={{ color: '#fff' }}>价格趋势 <Text style={{ color: '#86909C', fontSize: 12 }}>（近30天）</Text></span>}>
                <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 8 }}>
                  <Text style={{ color: '#F53F3F', fontWeight: 600, fontSize: 16 }}>
                    ¥{priceTrend[priceTrend.length - 1]?.price}
                  </Text>
                  <Text style={{ color: '#86909C', fontSize: 12, marginLeft: 8 }}>
                    最高 ¥{Math.max(...priceTrend.map(d => d.price))} / 最低 ¥{Math.min(...priceTrend.map(d => d.price))}
                  </Text>
                </div>
                <div style={{ height: 220, position: 'relative' }}>
                  <MiniPriceChart data={priceTrend} color="#4080FF" />
                  {/* X-axis labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    {[0, 7, 14, 21, 29].map(i => (
                      <Text key={i} style={{ color: '#86909C', fontSize: 11 }}>{priceTrend[i]?.date}</Text>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Image Comparison */}
              <Card style={darkCard} headerStyle={headerStyle} bodyStyle={bodyStyle}
                title={<span style={{ color: '#fff' }}>主图对比</span>}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Text style={{ color: '#86909C', fontSize: 12, display: 'block', marginBottom: 8 }}>当前主图</Text>
                    <div style={{
                      background: '#1E2030', borderRadius: 10, padding: 12,
                      border: '1px solid #303650', textAlign: 'center',
                    }}>
                      <img src={selected.image} alt="current" style={{ maxWidth: '100%', height: 180, objectFit: 'contain', borderRadius: 6 }} />
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: '#86909C', fontSize: 12, display: 'block', marginBottom: 8 }}>历史主图（4月18日前）</Text>
                    <div style={{
                      background: '#1E2030', borderRadius: 10, padding: 12,
                      border: '1px solid #303650', textAlign: 'center',
                    }}>
                      <img src={`https://picsum.photos/seed/${selected.id}hist/300/300`} alt="history"
                        style={{ maxWidth: '100%', height: 180, objectFit: 'contain', borderRadius: 6, filter: 'sepia(0.3)' }} />
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Change Logs */}
              <Card style={darkCard} headerStyle={headerStyle} bodyStyle={{ ...bodyStyle, padding: 0 }}
                title={<span style={{ color: '#fff' }}>变化日志</span>}>
                <Table
                  columns={changeLogColumns}
                  data={mockChangeLogs}
                  pagination={false}
                  borderCell={false}
                  size="small"
                  rowKey="id"
                  style={{ background: 'transparent' }}
                  rowClassName={() => 'dark-row'}
                />
              </Card>

              {/* Keyword Cloud */}
              <Card style={darkCard} headerStyle={headerStyle} bodyStyle={bodyStyle}
                title={<span style={{ color: '#fff' }}>评论关键词云</span>}>
                <KeywordCloud keywords={mockKeywords} />
              </Card>
            </Space>
          ) : (
            <Card style={darkCard} bodyStyle={{ textAlign: 'center', padding: 80 }}>
              <Text style={{ color: '#86909C', fontSize: 16 }}>请选择左侧竞品查看详情</Text>
            </Card>
          )}
        </Col>
      </Row>

      {/* ── Add Modal ── */}
      <Modal
        title="添加竞品"
        visible={addVisible}
        onOk={handleAdd}
        onCancel={() => { setAddVisible(false); form.resetFields(); }}
        okText="确认添加"
        cancelText="取消"
        style={{ width: 520 }}
        unmountOnExit
      >
        <Form form={form} layout="vertical" style={{ padding: '12px 0' }}>
          <FormItem label="平台" field="platform" rules={[{ required: true, message: '请选择平台' }]}
            initialValue="京东">
            <Select placeholder="选择平台">
              <Option value="京东">京东</Option>
              <Option value="淘宝">淘宝</Option>
              <Option value="拼多多">拼多多</Option>
              <Option value="抖音">抖音</Option>
              <Option value="亚马逊">亚马逊</Option>
            </Select>
          </FormItem>
          <FormItem label="商品链接" field="link" rules={[{ required: true, message: '请输入商品链接' }]}>
            <Input placeholder="粘贴商品URL" prefix={<IconSearch />} />
          </FormItem>
          <FormItem label="别名" field="alias" rules={[{ required: true, message: '请输入别名' }]}>
            <Input placeholder="便于识别的简称，如：JD-耳机A" />
          </FormItem>
          <FormItem label="监控等级" field="rating" initialValue={3}>
            <Rate count={5} allowHalf character={<span style={{ fontSize: 18 }}>★</span>} />
          </FormItem>
          <FormItem label="监控频率" field="frequency" initialValue="1h">
            <Select placeholder="选择监控频率">
              <Option value="30m">每30分钟</Option>
              <Option value="1h">每1小时</Option>
              <Option value="6h">每6小时</Option>
              <Option value="12h">每12小时</Option>
              <Option value="24h">每天</Option>
            </Select>
          </FormItem>
        </Form>
      </Modal>

      {/* Dark theme overrides */}
      <style>{`
        .arco-table-th {
          background: rgba(30, 32, 48, 0.8) !important;
          color: #86909C !important;
          border-bottom: 1px solid #303650 !important;
        }
        .arco-table-td {
          border-bottom: 1px solid #303650 !important;
          color: #fff !important;
        }
        .dark-row:hover .arco-table-td {
          background: rgba(64, 128, 255, 0.06) !important;
        }
        .arco-modal {
          background: #1E2030 !important;
        }
        .arco-modal-title, .arco-modal-close-icon {
          color: #fff !important;
        }
        .arco-modal-body {
          background: #1E2030 !important;
          color: #fff !important;
        }
        .arco-modal-footer {
          border-top: 1px solid #303650 !important;
          background: #1E2030 !important;
        }
        .arco-form-item-label {
          color: #C9CDD4 !important;
        }
        .arco-input-wrapper, .arco-select-view-single, .arco-textarea-wrapper {
          background: #171924 !important;
          border-color: #303650 !important;
        }
        .arco-input, .arco-select-view-input, .arco-textarea {
          color: #fff !important;
        }
        .arco-list-item:hover {
          background: rgba(64, 128, 255, 0.08) !important;
        }
        .arco-rate-star {
          color: #FFB800;
        }
      `}</style>
    </div>
  );
}
