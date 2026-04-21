import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Grid,
  Typography,
  Space,
  Tag,
  List,
  Avatar,
  Input,
  Button,
  Tabs,
  Progress,
  Divider,
  Badge,
  Tooltip,
  Message,
} from '@arco-design/web-react';
import {
  IconMessage,
  IconRobot,
  IconSwap,
  IconClockCircle,
  IconSend,
  IconSafe,
  IconThunderbolt,
  IconExclamationCircle,
  IconUser,
  IconStorage,
  IconApps,
  IconIdcard,
  IconFile,
} from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Title, Text, Paragraph } = Typography;
const TabPane = Tabs.TabPane;

// ─── Mock Data ───────────────────────────────────────────────────────────────

const statsData = [
  {
    title: '今日消息总数',
    value: 3842,
    icon: <IconMessage style={{ fontSize: 24, color: '#4080FF' }} />,
    color: '#4080FF',
    gradient: ['#4080FF', '#6EAAFF'],
  },
  {
    title: '自动回复率',
    value: 78.5,
    icon: <IconRobot style={{ fontSize: 24, color: '#00B42A' }} />,
    color: '#00B42A',
    gradient: ['#00B42A', '#23C343'],
    isPercent: true,
  },
  {
    title: '转人工数',
    value: 156,
    icon: <IconSwap style={{ fontSize: 24, color: '#FF7D00' }} />,
    color: '#FF7D00',
    gradient: ['#FF7D00', '#FFB366'],
  },
  {
    title: '平均响应时间',
    value: 12.3,
    icon: <IconClockCircle style={{ fontSize: 24, color: '#F53F3F' }} />,
    color: '#F53F3F',
    gradient: ['#F53F3F', '#FF7A7A'],
    unit: '秒',
  },
];

const riskConfig = {
  low: { color: 'green', label: '低风险' },
  medium: { color: 'orange', label: '中风险' },
  high: { color: 'red', label: '高风险' },
};

const mockConversations = [
  {
    id: 1,
    username: '小明同学',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ming',
    platform: '抖店',
    lastMessage: '请问这个耳机有降噪功能吗？',
    time: '14:32',
    risk: 'low',
    unread: 3,
    orderId: 'DD20240420001',
    orderHistory: [
      { id: 'DD20240420001', product: '无线蓝牙耳机 Pro', amount: 299, status: '已发货', date: '2024-04-18' },
      { id: 'DD20240315008', product: '手机支架', amount: 39, status: '已完成', date: '2024-03-15' },
    ],
    afterSales: [],
    aiSuggestion: '您好，这款耳机支持主动降噪功能，降噪深度可达35dB。在嘈杂环境中也能享受清晰音质。',
    messages: [
      { id: 1, role: 'customer', content: '你好，请问这款无线蓝牙耳机有降噪功能吗？', time: '14:28' },
      { id: 2, role: 'ai', content: '您好！感谢您的咨询。这款无线蓝牙耳机 Pro 支持主动降噪(ANC)功能，降噪深度可达35dB，还支持通透模式切换。', time: '14:28' },
      { id: 3, role: 'customer', content: '续航怎么样？充一次电能用多久？', time: '14:30' },
      { id: 4, role: 'ai', content: '开启降噪模式续航约24小时，关闭降噪可达32小时。充电10分钟可听歌2小时。', time: '14:30' },
      { id: 5, role: 'customer', content: '好的，那可以连接两台设备吗？', time: '14:32' },
    ],
  },
  {
    id: 2,
    username: '爱吃水果的猫',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cat',
    platform: '拼多多',
    lastMessage: '快递三天了还没到，我要退款！',
    time: '14:25',
    risk: 'high',
    unread: 5,
    orderId: 'DD20240419003',
    orderHistory: [
      { id: 'DD20240419003', product: '新西兰进口猕猴桃 6个装', amount: 68, status: '运输中', date: '2024-04-17' },
    ],
    afterSales: [
      { id: 'AS001', type: '物流投诉', status: '处理中', date: '2024-04-20', desc: '客户投诉物流超时' },
    ],
    aiSuggestion: '建议立即安抚客户情绪，查询物流状态。若确认物流异常，可协商补发或退款方案，避免差评。',
    messages: [
      { id: 1, role: 'customer', content: '我的猕猴桃怎么还没到？都三天了', time: '14:20' },
      { id: 2, role: 'ai', content: '非常抱歉给您带来不便！我已为您查询到订单DD20240419003的物流信息，目前包裹在XX转运中心。', time: '14:20' },
      { id: 3, role: 'customer', content: '水果放三天还能吃吗？你们怎么发货的', time: '14:22' },
      { id: 4, role: 'customer', content: '快递三天了还没到，我要退款！', time: '14:25' },
    ],
  },
  {
    id: 3,
    username: '数码达人Leo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    platform: '快手',
    lastMessage: '好的，那就换货吧',
    time: '14:18',
    risk: 'medium',
    unread: 0,
    orderId: 'DD20240418015',
    orderHistory: [
      { id: 'DD20240418015', product: '智能手表 S2', amount: 599, status: '待处理', date: '2024-04-16' },
      { id: 'DD20240322007', product: '充电宝 20000mAh', amount: 129, status: '已完成', date: '2024-03-22' },
    ],
    afterSales: [
      { id: 'AS002', type: '质量问题', status: '处理中', date: '2024-04-19', desc: '屏幕显示异常，要求换货' },
    ],
    aiSuggestion: '客户已同意换货方案，建议尽快安排换货流程，确认收货地址并安排顺丰上门取件。',
    messages: [
      { id: 1, role: 'customer', content: '我收到的手表屏幕有条亮线，能换吗？', time: '14:10' },
      { id: 2, role: 'ai', content: '非常抱歉！收到质量问题的商品确实令人不愉快。我们可以为您安排免费换货，您看可以吗？', time: '14:10' },
      { id: 3, role: 'customer', content: '需要我寄回去吗？邮费谁出？', time: '14:15' },
      { id: 4, role: 'ai', content: '我们会安排顺丰上门取件，邮费由我们承担。您只需将手表和配件打包好即可。', time: '14:15' },
      { id: 5, role: 'customer', content: '好的，那就换货吧', time: '14:18' },
    ],
  },
  {
    id: 4,
    username: '爱买买买的小红',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hong',
    platform: '抖店',
    lastMessage: '尺码偏大还是偏小？',
    time: '14:05',
    risk: 'low',
    unread: 1,
    orderId: 'DD20240420022',
    orderHistory: [
      { id: 'DD20240420022', product: '春季新款连衣裙', amount: 189, status: '待发货', date: '2024-04-20' },
      { id: 'DD20240412009', product: '百搭针织开衫', amount: 159, status: '已完成', date: '2024-04-12' },
    ],
    afterSales: [],
    aiSuggestion: '可以告知该款连衣裙为标准尺码，建议参考商品详情页的尺码表。如果客户拿不准，可建议测量三围后推荐。',
    messages: [
      { id: 1, role: 'customer', content: '我想买这条连衣裙，尺码偏大还是偏小？', time: '14:05' },
    ],
  },
  {
    id: 5,
    username: '闲鱼捡漏王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fisher',
    platform: '闲鱼',
    lastMessage: '能再便宜50吗？',
    time: '13:48',
    risk: 'low',
    unread: 2,
    orderId: 'XY20240420005',
    orderHistory: [],
    afterSales: [],
    aiSuggestion: '闲鱼客户议价为常见行为。若利润空间允许，可适当让利促成交易；建议强调商品品质和售后保障。',
    messages: [
      { id: 1, role: 'customer', content: '这个二手相机还在吗？', time: '13:42' },
      { id: 2, role: 'ai', content: '在的！这台富士XT30成色95新，快门次数不到5000次，附带两支镜头。', time: '13:42' },
      { id: 3, role: 'customer', content: '能再便宜50吗？', time: '13:48' },
    ],
  },
  {
    id: 6,
    username: '音乐发烧友老王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    platform: '快手',
    lastMessage: '谢谢客服！已下单',
    time: '13:30',
    risk: 'low',
    unread: 0,
    orderId: 'DD20240420031',
    orderHistory: [
      { id: 'DD20240420031', product: 'HiFi入耳式耳机', amount: 899, status: '待发货', date: '2024-04-20' },
    ],
    afterSales: [],
    aiSuggestion: '客户已完成购买，可发送感谢消息并告知预计发货时间，提升客户体验。',
    messages: [
      { id: 1, role: 'customer', content: '这款耳机适合听什么类型的音乐？', time: '13:22' },
      { id: 2, role: 'ai', content: '这款耳机采用动铁+动圈双单元设计，三频均衡，特别适合流行、古典和爵士乐。人声表现尤为出色。', time: '13:22' },
      { id: 3, role: 'customer', content: '有保修吗？', time: '13:28' },
      { id: 4, role: 'ai', content: '提供1年质保，非人为损坏免费维修或更换。还支持7天无理由退换。', time: '13:28' },
      { id: 5, role: 'customer', content: '谢谢客服！已下单', time: '13:30' },
    ],
  },
  {
    id: 7,
    username: '宝妈小丽',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    platform: '拼多多',
    lastMessage: '过敏了怎么办？！',
    time: '13:15',
    risk: 'high',
    unread: 4,
    orderId: 'DD20240419042',
    orderHistory: [
      { id: 'DD20240419042', product: '婴儿护肤霜 50g', amount: 49, status: '已签收', date: '2024-04-18' },
    ],
    afterSales: [
      { id: 'AS003', type: '产品安全', status: '紧急处理中', date: '2024-04-20', desc: '客户反馈宝宝使用后出现红疹' },
    ],
    aiSuggestion: '⚠️ 产品安全问题！建议立即转人工处理。安抚客户并建议就医，保留产品批次信息备查。启动退款流程。',
    messages: [
      { id: 1, role: 'customer', content: '我给宝宝用了你们的护肤霜，脸上起红疹了', time: '13:08' },
      { id: 2, role: 'ai', content: '非常抱歉听到这个情况！请问宝宝多大了？之前有对类似产品过敏的经历吗？', time: '13:08' },
      { id: 3, role: 'customer', content: '宝宝8个月，以前没过敏过', time: '13:12' },
      { id: 4, role: 'customer', content: '过敏了怎么办？！', time: '13:15' },
    ],
  },
];

const platformTabs = [
  { key: 'all', label: '全部' },
  { key: '抖店', label: '抖店' },
  { key: '快手', label: '快手' },
  { key: '拼多多', label: '拼多多' },
  { key: '闲鱼', label: '闲鱼' },
];

const quickReplies = [
  '您好，有什么可以帮您的？',
  '非常抱歉给您带来不便！',
  '已为您安排处理，请耐心等待~',
  '感谢您的理解与支持！',
  '已为您申请退款，预计1-3个工作日到账。',
];

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color, gradient, isPercent, unit }) {
  return (
    <Card
      style={{
        background: `linear-gradient(135deg, #1E2030 0%, #262A3E 100%)`,
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text style={{ color: '#86909C', fontSize: 13 }}>{title}</Text>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {isPercent ? (
              <>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {value}
                </Text>
                <Text style={{ color: '#86909C', fontSize: 14 }}>%</Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Text>
                {unit && <Text style={{ color: '#86909C', fontSize: 14 }}>{unit}</Text>}
              </>
            )}
          </div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      {isPercent && (
        <div style={{ marginTop: 12 }}>
          <Progress
            percent={value}
            color={color}
            size="small"
            showText={false}
            strokeWidth={4}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </Card>
  );
}

function MessageBubble({ message }) {
  const isCustomer = message.role === 'customer';
  const isAI = message.role === 'ai';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isCustomer ? 'flex-start' : 'flex-end',
        marginBottom: 16,
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      {isCustomer && (
        <Avatar size={32} style={{ backgroundColor: '#4080FF', flexShrink: 0 }}>
          <IconUser />
        </Avatar>
      )}
      <div style={{ maxWidth: '70%' }}>
        {isAI && (
          <Text style={{ color: '#4080FF', fontSize: 11, marginBottom: 4, display: 'block', textAlign: 'right' }}>
            🤖 AI自动回复
          </Text>
        )}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isCustomer ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
            background: isCustomer ? '#2A2D3E' : '#4080FF',
            color: '#fff',
            fontSize: 14,
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
        <Text style={{ color: '#4E5969', fontSize: 11, marginTop: 4, display: 'block', textAlign: isCustomer ? 'left' : 'right' }}>
          {message.time}
        </Text>
      </div>
      {!isCustomer && (
        <Avatar size={32} style={{ backgroundColor: isAI ? '#00B42A' : '#722ED1', flexShrink: 0 }}>
          {isAI ? <IconRobot /> : <IconUser />}
        </Avatar>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CustomerService() {
  const [activePlatform, setActivePlatform] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(selectedConversation.messages);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages);
    }
  }, [selectedConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = activePlatform === 'all'
    ? mockConversations
    : mockConversations.filter(c => c.platform === activePlatform);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMsg = {
      id: Date.now(),
      role: 'agent',
      content: inputValue,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleQuickReply = (text) => {
    setInputValue(text);
  };

  const riskTag = (risk) => {
    const cfg = riskConfig[risk];
    return <Tag color={cfg.color} size="small">{cfg.label}</Tag>;
  };

  const platformTag = (platform) => {
    const colors = { 抖店: 'blue', 快手: 'orange', 拼多多: 'red', 闲鱼: 'green' };
    return <Tag color={colors[platform] || 'gray'} size="small">{platform}</Tag>;
  };

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: '#171924' }}>
      {/* ── Stats Row ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statsData.map((item, idx) => (
          <Col span={6} key={idx}>
            <StatCard {...item} />
          </Col>
        ))}
      </Row>

      {/* ── Main Area ── */}
      <Row gutter={[16, 16]}>
        {/* Left: Conversation List (40%) */}
        <Col span={10}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              height: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column',
            }}
            bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Platform Tabs */}
            <div style={{ padding: '12px 16px 0', borderBottom: '1px solid #303650' }}>
              <Tabs
                activeTab={activePlatform}
                onChange={setActivePlatform}
                type="rounded"
                size="small"
              >
                {platformTabs.map(tab => (
                  <TabPane key={tab.key} title={tab.label} />
                ))}
              </Tabs>
            </div>

            {/* Message List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    background: selectedConversation?.id === conv.id ? '#2A2D42' : 'transparent',
                    borderLeft: selectedConversation?.id === conv.id ? '3px solid #4080FF' : '3px solid transparent',
                    transition: 'all 0.2s',
                    borderBottom: '1px solid #252840',
                  }}
                  onMouseEnter={e => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = '#232638'; }}
                  onMouseLeave={e => { if (selectedConversation?.id !== conv.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Badge count={conv.unread} dot={false} maxCount={99} offset={[-2, 2]}>
                    <Avatar size={42} style={{ backgroundColor: '#4080FF' }}>
                      <img src={conv.avatar} alt={conv.username} style={{ width: 42, height: 42 }} onError={e => { e.target.style.display = 'none'; }} />
                    </Avatar>
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Space size={6}>
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: conv.unread > 0 ? 600 : 400,
                          }}
                        >
                          {conv.username}
                        </Text>
                        {platformTag(conv.platform)}
                      </Space>
                      <Text style={{ color: '#4E5969', fontSize: 12 }}>{conv.time}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text
                        style={{
                          color: conv.unread > 0 ? '#C9CDD4' : '#4E5969',
                          fontSize: 13,
                          fontWeight: conv.unread > 0 ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        {conv.lastMessage}
                      </Text>
                      {riskTag(conv.risk)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right: Chat Detail + Sidebar (60%) */}
        <Col span={14}>
          <Row gutter={[16, 16]}>
            {/* Chat Panel */}
            <Col span={16}>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  height: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                {/* User Info Bar */}
                <div
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #303650',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Space size={12}>
                    <Avatar size={36} style={{ backgroundColor: '#4080FF' }}>
                      <img
                        src={selectedConversation?.avatar}
                        alt=""
                        style={{ width: 36, height: 36 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </Avatar>
                    <div>
                      <Space size={8}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>
                          {selectedConversation?.username}
                        </Text>
                        {platformTag(selectedConversation?.platform)}
                        {riskTag(selectedConversation?.risk)}
                      </Space>
                      <div style={{ marginTop: 2 }}>
                        <Text style={{ color: '#4E5969', fontSize: 12 }}>
                          订单号: {selectedConversation?.orderId}
                        </Text>
                      </div>
                    </div>
                  </Space>
                  <Space>
                    <Tooltip content="转人工客服">
                      <Button
                        type="outline"
                        size="small"
                        icon={<IconSwap />}
                        style={{ borderColor: '#FF7D00', color: '#FF7D00' }}
                      >
                        转人工
                      </Button>
                    </Tooltip>
                  </Space>
                </div>

                {/* Chat Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 20px',
                    background: '#1A1C2A',
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Tag color="gray" size="small">—— 今天 ——</Tag>
                  </div>
                  {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #303650',
                    background: '#1E2030',
                  }}
                >
                  <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {quickReplies.map((text, idx) => (
                      <Tag
                        key={idx}
                        color="arcoblue"
                        size="small"
                        style={{ cursor: 'pointer', borderRadius: 12 }}
                        onClick={() => handleQuickReply(text)}
                      >
                        {text.length > 15 ? text.slice(0, 15) + '...' : text}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                      placeholder="输入消息..."
                      value={inputValue}
                      onChange={setInputValue}
                      onPressEnter={handleSend}
                      style={{ flex: 1, background: '#252840', borderColor: '#303650' }}
                    />
                    <Button
                      type="primary"
                      icon={<IconSend />}
                      onClick={handleSend}
                      style={{ background: '#4080FF', borderRadius: 8 }}
                    >
                      发送
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Sidebar */}
            <Col span={8}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {/* Customer History Orders */}
                <Card
                  title={
                    <Space>
                      <IconStorage style={{ color: '#4080FF', fontSize: 16 }} />
                      <Text style={{ color: '#fff', fontSize: 14 }}>历史订单</Text>
                    </Space>
                  }
                  style={{
                    background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                  headerStyle={{ borderBottom: '1px solid #303650' }}
                  bodyStyle={{ padding: '12px 16px', maxHeight: 200, overflowY: 'auto' }}
                >
                  {selectedConversation?.orderHistory?.length > 0 ? (
                    selectedConversation.orderHistory.map(order => (
                      <div
                        key={order.id}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid #252840',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{order.product}</Text>
                          <Tag
                            color={order.status === '已完成' ? 'green' : order.status === '运输中' ? 'orange' : 'blue'}
                            size="small"
                          >
                            {order.status}
                          </Tag>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#4E5969', fontSize: 12 }}>{order.id}</Text>
                          <Text style={{ color: '#FF7D00', fontSize: 13, fontWeight: 500 }}>¥{order.amount}</Text>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Text style={{ color: '#4E5969', fontSize: 13 }}>暂无订单记录</Text>
                  )}
                </Card>

                {/* After-sales Records */}
                <Card
                  title={
                    <Space>
                      <IconSafe style={{ color: '#FF7D00', fontSize: 16 }} />
                      <Text style={{ color: '#fff', fontSize: 14 }}>售后记录</Text>
                    </Space>
                  }
                  style={{
                    background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                  headerStyle={{ borderBottom: '1px solid #303650' }}
                  bodyStyle={{ padding: '12px 16px', maxHeight: 160, overflowY: 'auto' }}
                >
                  {selectedConversation?.afterSales?.length > 0 ? (
                    selectedConversation.afterSales.map(record => (
                      <div
                        key={record.id}
                        style={{
                          padding: '8px 0',
                          borderBottom: '1px solid #252840',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Space size={6}>
                            <Tag color="orange" size="small">{record.type}</Tag>
                            <Tag
                              color={record.status === '处理中' ? 'blue' : record.status.includes('紧急') ? 'red' : 'green'}
                              size="small"
                            >
                              {record.status}
                            </Tag>
                          </Space>
                          <Text style={{ color: '#4E5969', fontSize: 12 }}>{record.date}</Text>
                        </div>
                        <Text style={{ color: '#C9CDD4', fontSize: 12 }}>{record.desc}</Text>
                      </div>
                    ))
                  ) : (
                    <Text style={{ color: '#4E5969', fontSize: 13 }}>暂无售后记录</Text>
                  )}
                </Card>

                {/* AI Suggestions */}
                <Card
                  title={
                    <Space>
                      <IconThunderbolt style={{ color: '#00B42A', fontSize: 16 }} />
                      <Text style={{ color: '#fff', fontSize: 14 }}>AI 建议回复</Text>
                    </Space>
                  }
                  style={{
                    background: 'linear-gradient(135deg, #1E2030 0%, #262A3E 100%)',
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                  headerStyle={{ borderBottom: '1px solid #303650' }}
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <div
                    style={{
                      background: '#252840',
                      borderRadius: 8,
                      padding: '12px 14px',
                      borderLeft: '3px solid #00B42A',
                    }}
                  >
                    <Paragraph
                      style={{
                        color: '#C9CDD4',
                        fontSize: 13,
                        lineHeight: 1.7,
                        marginBottom: 0,
                      }}
                    >
                      {selectedConversation?.aiSuggestion}
                    </Paragraph>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    style={{ marginTop: 8, color: '#4080FF' }}
                    onClick={() => {
                      if (selectedConversation?.aiSuggestion) {
                        setInputValue(selectedConversation.aiSuggestion);
                      }
                    }}
                  >
                    使用此建议 →
                  </Button>
                </Card>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
