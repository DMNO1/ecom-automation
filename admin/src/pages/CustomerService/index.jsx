/**
 * 客服中心 - 重构版
 * 参考拼多多/淘宝/抖音商家后台风格
 * 主色调：#165DFF + #F2F3F5
 */
import React, { useState, useRef, useEffect } from 'react';
import { generateConversations, PLATFORMS } from '../../utils/mock';

// 状态配置
const STATUS_MAP = {
  waiting: { label: '待回复', color: '#FF7D00', bg: 'rgba(255,125,0,0.1)' },
  processing: { label: '处理中', color: '#165DFF', bg: 'rgba(22,93,255,0.1)' },
  resolved: { label: '已解决', color: '#00B42A', bg: 'rgba(0,180,42,0.1)' },
  ai_handling: { label: 'AI处理', color: '#7B61FF', bg: 'rgba(123,97,255,0.1)' },
};

// 快捷回复模板库
const QUICK_TEMPLATES = {
  greeting: {
    label: '👋 问候',
    icon: 'wave',
    templates: [
      '亲，您好！欢迎光临，请问有什么可以帮您的？😊',
      '亲爱的顾客，感谢您的咨询，有什么需要帮助的吗？',
      'Hi~欢迎来到我们的店铺，请问您想了解什么呢？',
    ]
  },
  shipping: {
    label: '📦 物流',
    icon: 'package',
    templates: [
      '亲，我们默认发顺丰快递，一般1-3天到达，偏远地区3-5天哦~',
      '您的包裹已发出，物流单号稍后发给您，请注意查收~',
      '亲，已为您催促快递，预计今天会更新物流信息~',
    ]
  },
  refund: {
    label: '💰 退换',
    icon: 'refresh',
    templates: [
      '亲，7天无理由退换货，质量问题我们包运费哦~',
      '非常抱歉给您带来不便，已为您申请退款，1-3个工作日到账~',
      '亲，收到货不满意可以退的，您寄回来我们承担运费~',
    ]
  },
  promotion: {
    label: '🎁 促销',
    icon: 'gift',
    templates: [
      '亲，现在店铺有满200减30的活动哦，很划算的！',
      '新客可以领取10元无门槛优惠券，下单立减~',
      '亲，今天下单还有赠品送哦，数量有限先到先得！',
    ]
  },
  quality: {
    label: '🔍 质量',
    icon: 'quality',
    templates: [
      '亲，亲测质量很好呢，销量也超高，好评如潮~',
      '亲，这个是旗舰店正品，有防伪码可以验货哦~',
      '亲，质量问题我们包退包换，放心购买~',
    ]
  },
  closing: {
    label: '👋 结束',
    icon: 'bye',
    templates: [
      '感谢您的咨询，祝您生活愉快！有问题随时找我们哦~😊',
      '好的，已经帮您处理好了，还有其他需要帮助的吗？',
      '感谢您的耐心等待，祝您购物愉快！⭐⭐⭐⭐⭐',
    ]
  },
};

// AI建议回复
const AI_SUGGESTIONS = [
  { text: '亲，非常抱歉给您带来不便，我们马上为您处理~', score: 0.95 },
  { text: '感谢您的耐心等待，已为您催促发货~', score: 0.88 },
  { text: '亲，这个问题我们已经记录，会在24小时内给您答复。', score: 0.82 },
];

// 模拟买家信息
const mockBuyerInfo = {
  level: '⭐⭐⭐',
  orders: 12,
  spent: '¥2,856',
  tags: ['优质买家', '响应快'],
  phone: '138****8888',
  lastOrder: '订单号：PDD082456789',
};

export default function CustomerService() {
  const [conversations] = useState(() => generateConversations(15));
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState({});
  const [filter, setFilter] = useState('all');
  const [aiAssist, setAiAssist] = useState(true);
  const [rightPanel, setRightPanel] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId);
  const activeMessages = messages[activeId] || activeConv?.messages || [];

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  // 筛选会话
  const filtered = conversations.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !searchKeyword || 
      c.customer.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchFilter && matchSearch;
  });

  // 发送消息
  const handleSend = () => {
    if (!inputMsg.trim() || !activeId) return;
    const newMsg = { role: 'agent', content: inputMsg.trim(), time: new Date().toISOString() };
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || activeConv?.messages || []), newMsg]
    }));
    setInputMsg('');

    if (aiAssist) {
      setTimeout(() => {
        const replies = ['好的，明白了', '谢谢！', '还有其他问题吗', '收到了'];
        const reply = { role: 'customer', content: replies[Math.floor(Math.random() * replies.length)], time: new Date().toISOString() };
        setMessages(prev => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), reply]
        }));
      }, 1500);
    }
  };

  // 快捷语选择
  const handleTemplateSelect = (template) => {
    setInputMsg(template);
  };

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦', color: '#8c8c8c' };

  // 获取统计
  const stats = {
    total: conversations.length,
    waiting: conversations.filter(c => c.status === 'waiting').length,
    processing: conversations.filter(c => c.status === 'processing').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="cs-container">
      {/* 顶部标题栏 */}
      <div className="cs-header">
        <div className="cs-header-left">
          <h2 className="cs-title">客服中心</h2>
          <div className="cs-stats">
            <span className="cs-stat">
              <span className="cs-stat-num">{stats.total}</span> 全部
            </span>
            <span className="cs-stat waiting">
              <span className="cs-stat-num">{stats.waiting}</span> 待回复
            </span>
            <span className="cs-stat processing">
              <span className="cs-stat-num">{stats.processing}</span> 处理中
            </span>
          </div>
        </div>
        <div className="cs-header-right">
          <div className="cs-ai-toggle" onClick={() => setAiAssist(!aiAssist)}>
            <span className={`cs-ai-dot ${aiAssist ? 'active' : ''}`}></span>
            <span>AI辅助</span>
            <span className="cs-ai-badge">Beta</span>
          </div>
          <button className="cs-btn-icon" onClick={() => setRightPanel(!rightPanel)} title="买家信息">
            👤
          </button>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="cs-main">
        {/* 左侧会话列表 */}
        <div className="cs-sidebar">
          {/* 搜索框 */}
          <div className="cs-search">
            <span className="cs-search-icon">🔍</span>
            <input
              type="text"
              className="cs-search-input"
              placeholder="搜索买家/订单号..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <span className="cs-search-clear" onClick={() => setSearchKeyword('')}>✕</span>
            )}
          </div>

          {/* 状态筛选 */}
          <div className="cs-filter-tabs">
            <button className={`cs-filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              全部
            </button>
            <button className={`cs-filter-tab ${filter === 'waiting' ? 'active' : ''}`} onClick={() => setFilter('waiting')}>
              待回复 {stats.waiting > 0 && <span className="cs-tab-badge">{stats.waiting}</span>}
            </button>
            <button className={`cs-filter-tab ${filter === 'processing' ? 'active' : ''}`} onClick={() => setFilter('processing')}>
              处理中
            </button>
            <button className={`cs-filter-tab ${filter === 'resolved' ? 'active' : ''}`} onClick={() => setFilter('resolved')}>
              已解决
            </button>
          </div>

          {/* 会话列表 */}
          <div className="cs-conversation-list">
            {filtered.map(conv => {
              const plat = getPlatformInfo(conv.platform);
              const st = STATUS_MAP[conv.status];
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  className={`cs-conversation-item ${isActive ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}`}
                  onClick={() => setActiveId(conv.id)}
                >
                  <div className="cs-conv-avatar" style={{ background: plat.color + '20' }}>
                    {plat.icon}
                  </div>
                  <div className="cs-conv-content">
                    <div className="cs-conv-header">
                      <span className="cs-conv-name">{conv.customer}</span>
                      <span className="cs-conv-time">{conv.updatedAt?.slice(11, 16)}</span>
                    </div>
                    <div className="cs-conv-preview">{conv.lastMessage}</div>
                    <div className="cs-conv-footer">
                      <span className="cs-conv-status" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                      {conv.unread > 0 && <span className="cs-conv-unread">{conv.unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="cs-empty">暂无会话</div>
            )}
          </div>
        </div>

        {/* 中间聊天区 */}
        <div className="cs-chat-area">
          {activeConv ? (
            <>
              {/* 聊天头部 */}
              <div className="cs-chat-header">
                <div className="cs-chat-header-left">
                  <span className="cs-chat-name">{activeConv.customer}</span>
                  <span className="cs-chat-platform" style={{ 
                    color: getPlatformInfo(activeConv.platform).color,
                    background: getPlatformInfo(activeConv.platform).color + '15'
                  }}>
                    {getPlatformInfo(activeConv.platform).icon} {getPlatformInfo(activeConv.platform).name}
                  </span>
                </div>
                <div className="cs-chat-header-right">
                  <button className="cs-btn-default">📋 查看订单</button>
                  <button className="cs-btn-default">👤 买家信息</button>
                  <button className="cs-btn-primary">✅ 标记已解决</button>
                </div>
              </div>

              {/* 消息区 */}
              <div className="cs-messages">
                {/* 日期分隔线 */}
                <div className="cs-date-divider">
                  <span>今天 {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                </div>

                {activeMessages.map((msg, i) => (
                  <div key={i} className={`cs-message-row ${msg.role}`}>
                    <div className={`cs-bubble ${msg.role}`}>
                      <div className="cs-bubble-content">{msg.content}</div>
                      <div className="cs-bubble-time">
                        {new Date(msg.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 快捷回复区 */}
              <div className="cs-quick-reply">
                <div className="cs-quick-tabs">
                  {Object.entries(QUICK_TEMPLATES).map(([key, group]) => (
                    <button
                      key={key}
                      className={`cs-quick-tab ${activeTemplate === key ? 'active' : ''}`}
                      onClick={() => setActiveTemplate(activeTemplate === key ? null : key)}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
                {activeTemplate && (
                  <div className="cs-quick-panel">
                    {QUICK_TEMPLATES[activeTemplate].templates.map((t, i) => (
                      <div
                        key={i}
                        className="cs-quick-item"
                        onClick={() => handleTemplateSelect(t)}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 输入区 */}
              <div className="cs-input-area">
                <div className="cs-input-toolbar">
                  <button className="cs-tool-btn" title="表情">😊</button>
                  <button className="cs-tool-btn" title="图片">🖼️</button>
                  <button className="cs-tool-btn" title="订单">📋</button>
                  <button className="cs-tool-btn" title="快捷语">💬</button>
                </div>
                <textarea
                  className="cs-input"
                  placeholder="输入消息... (Enter发送，Ctrl+Enter换行)"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.ctrlKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={3}
                />
                <div className="cs-input-footer">
                  <span className="cs-input-hint">Enter 发送 | Ctrl+Enter 换行</span>
                  <button className="cs-btn-send" onClick={handleSend} disabled={!inputMsg.trim()}>
                    发送 ➤
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="cs-chat-empty">
              <div className="cs-chat-empty-icon">💬</div>
              <div className="cs-chat-empty-text">选择一个会话开始聊天</div>
            </div>
          )}
        </div>

        {/* 右侧买家信息面板 */}
        {rightPanel && (
          <div className="cs-buyer-panel">
            {activeConv ? (
              <>
                {/* 买家基本信息 */}
                <div className="cs-buyer-card">
                  <div className="cs-buyer-avatar">👤</div>
                  <div className="cs-buyer-name">{activeConv.customer}</div>
                  <div className="cs-buyer-level">{mockBuyerInfo.level}</div>
                  <div className="cs-buyer-stats">
                    <div className="cs-buyer-stat">
                      <div className="cs-buyer-stat-num">{mockBuyerInfo.orders}</div>
                      <div className="cs-buyer-stat-label">订单数</div>
                    </div>
                    <div className="cs-buyer-stat">
                      <div className="cs-buyer-stat-num">{mockBuyerInfo.spent}</div>
                      <div className="cs-buyer-stat-label">消费金额</div>
                    </div>
                  </div>
                </div>

                {/* 买家标签 */}
                <div className="cs-buyer-section">
                  <div className="cs-buyer-section-title">🏷️ 买家标签</div>
                  <div className="cs-buyer-tags">
                    {mockBuyerInfo.tags.map((tag, i) => (
                      <span key={i} className="cs-buyer-tag">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* 联系信息 */}
                <div className="cs-buyer-section">
                  <div className="cs-buyer-section-title">📞 联系信息</div>
                  <div className="cs-buyer-info-item">
                    <span className="cs-buyer-info-label">手机</span>
                    <span className="cs-buyer-info-value">{mockBuyerInfo.phone}</span>
                  </div>
                </div>

                {/* 最近订单 */}
                <div className="cs-buyer-section">
                  <div className="cs-buyer-section-title">📦 最近订单</div>
                  <div className="cs-buyer-order">
                    <div className="cs-buyer-order-id">{mockBuyerInfo.lastOrder}</div>
                    <div className="cs-buyer-order-status">已发货</div>
                  </div>
                </div>

                {/* AI推荐 */}
                {aiAssist && (
                  <div className="cs-buyer-section">
                    <div className="cs-buyer-section-title">🤖 AI推荐回复</div>
                    <div className="cs-ai-suggestions">
                      {AI_SUGGESTIONS.map((s, i) => (
                        <div key={i} className="cs-ai-suggestion">
                          <div className="cs-ai-suggestion-text">{s.text}</div>
                          <div className="cs-ai-suggestion-score">
                            <div className="cs-ai-score-bar" style={{ width: `${s.score * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="cs-buyer-actions">
                  <button className="cs-btn-block">📋 创建工单</button>
                  <button className="cs-btn-block secondary">🔄 转接客服</button>
                </div>
              </>
            ) : (
              <div className="cs-buyer-empty">选择会话查看详情</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}