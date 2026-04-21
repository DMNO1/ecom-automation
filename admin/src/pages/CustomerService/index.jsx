/**
 * 客服中心
 * 对话列表 + 实时聊天 + AI辅助
 */
import React, { useState, useRef, useEffect } from 'react';
import { generateConversations, PLATFORMS } from '../../utils/mock';

const STATUS_MAP = {
  waiting: { label: '待回复', color: '#FF7D00' },
  processing: { label: '处理中', color: '#165DFF' },
  resolved: { label: '已解决', color: '#00B42A' },
  ai_handling: { label: 'AI处理中', color: '#7B61FF' },
};

// 快捷回复模板库
const QUICK_TEMPLATES = {
  greeting: {
    label: '👋 问候',
    templates: [
      '亲，您好！欢迎光临，请问有什么可以帮您的？😊',
      '亲爱的顾客，感谢您的咨询，有什么需要帮助的吗？',
      'Hi~欢迎来到我们的店铺，请问您想了解什么呢？',
    ]
  },
  shipping: {
    label: '📦 物流',
    templates: [
      '亲，我们默认发顺丰快递，一般1-3天到达，偏远地区3-5天哦~',
      '您的包裹已发出，物流单号稍后发给您，请注意查收~',
      '亲，已为您催促快递，预计今天会更新物流信息~',
    ]
  },
  refund: {
    label: '💰 退换',
    templates: [
      '亲，7天无理由退换货，质量问题我们包运费哦~',
      '非常抱歉给您带来不便，已为您申请退款，1-3个工作日到账~',
      '亲，收到货不满意可以退的，您寄回来我们承担运费~',
    ]
  },
  promotion: {
    label: '🎁 促销',
    templates: [
      '亲，现在店铺有满200减30的活动哦，很划算的！',
      '新客可以领取10元无门槛优惠券，下单立减~',
      '亲，今天下单还有赠品送哦，数量有限先到先得！',
    ]
  },
  closing: {
    label: '👋 结束',
    templates: [
      '感谢您的咨询，祝您生活愉快！有问题随时找我们哦~😊',
      '好的，已经帮您处理好了，还有其他需要帮助的吗？',
      '感谢您的耐心等待，祝您购物愉快！⭐⭐⭐⭐⭐',
    ]
  },
};

export default function CustomerService() {
  const [conversations] = useState(() => generateConversations(12));
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState({});
  const [filter, setFilter] = useState('all');
  const [aiAssist, setAiAssist] = useState(true);
  const messagesEndRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId);
  const activeMessages = messages[activeId] || activeConv?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const filtered = filter === 'all'
    ? conversations
    : conversations.filter(c => c.status === filter);

  const handleSend = () => {
    if (!inputMsg.trim() || !activeId) return;
    const newMsg = { role: 'agent', content: inputMsg.trim(), time: new Date().toISOString() };
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || activeConv?.messages || []), newMsg]
    }));
    setInputMsg('');

    // 模拟客户回复
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

  const getPlatformInfo = (key) => PLATFORMS.find(p => p.key === key) || { name: key, icon: '📦' };

  // AI 建议回复
  const aiSuggestions = [
    '亲，非常抱歉给您带来不便，我们马上为您处理~',
    '感谢您的耐心等待，已为您催促发货~',
    '亲，这个问题我们已经记录，会在24小时内给您答复。',
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title">客服中心</h2>
            <p className="page-desc">多平台客户消息统一管理，AI智能辅助回复</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              className={`switch ${aiAssist ? 'on' : ''}`}
              onClick={() => setAiAssist(!aiAssist)}
            />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>AI辅助</span>
            <span style={{
              background: '#F2E8FF',
              color: '#7B61FF',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
            }}>Beta</span>
          </div>
        </div>
      </div>

      <div className="chat-layout card" style={{ overflow: 'hidden' }}>
        {/* 左侧对话列表 */}
        <div className="chat-list">
          {/* 筛选 */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <select
              className="filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: '100%', minWidth: 'auto' }}
            >
              <option value="all">全部会话 ({conversations.length})</option>
              <option value="waiting">待回复 ({conversations.filter(c => c.status === 'waiting').length})</option>
              <option value="processing">处理中 ({conversations.filter(c => c.status === 'processing').length})</option>
              <option value="ai_handling">AI处理中 ({conversations.filter(c => c.status === 'ai_handling').length})</option>
              <option value="resolved">已解决 ({conversations.filter(c => c.status === 'resolved').length})</option>
            </select>
          </div>
          {/* 会话列表 */}
          {filtered.map(conv => {
            const plat = getPlatformInfo(conv.platform);
            const st = STATUS_MAP[conv.status];
            return (
              <div
                key={conv.id}
                className={`chat-item ${conv.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(conv.id)}
              >
                <div className="chat-avatar" style={{
                  background: plat.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  {plat.icon}
                </div>
                <div className="chat-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="chat-name">{conv.customer}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{conv.updatedAt?.slice(11, 16)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="chat-preview">{conv.lastMessage}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="tag" style={{
                        background: st.color + '15',
                        color: st.color,
                        fontSize: 10,
                        padding: '0 4px',
                        lineHeight: '16px'
                      }}>{st.label}</span>
                      {conv.unread > 0 && <span className="chat-unread">{conv.unread}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧聊天窗口 */}
        <div className="chat-window">
          {activeConv ? (
            <>
              {/* 聊天头部 */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 600, marginRight: 8 }}>{activeConv.customer}</span>
                  <span className="tag" style={{ background: getPlatformInfo(activeConv.platform).color + '15', color: getPlatformInfo(activeConv.platform).color }}>
                    {getPlatformInfo(activeConv.platform).icon} {getPlatformInfo(activeConv.platform).name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-default btn-sm">📋 工单</button>
                  <button className="btn btn-default btn-sm">✅ 标记已解决</button>
                </div>
              </div>

              {/* 消息区 */}
              <div className="chat-messages">
                {activeMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div className="chat-bubble">{msg.content}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 快捷回复模板 */}
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid var(--border)',
                background: '#FAFBFC',
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>⚡ 快捷回复：</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(QUICK_TEMPLATES).map(([key, group]) => (
                    <div key={key} style={{ position: 'relative' }} className="template-group">
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}
                        onClick={(e) => {
                          // Toggle dropdown
                          const el = e.currentTarget.nextElementSibling;
                          document.querySelectorAll('.template-dropdown').forEach(d => d.style.display = 'none');
                          el.style.display = el.style.display === 'block' ? 'none' : 'block';
                        }}
                      >{group.label}</button>
                      <div className="template-dropdown" style={{
                        display: 'none', position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
                        background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 8, zIndex: 100,
                        minWidth: 280, maxHeight: 200, overflowY: 'auto',
                      }}>
                        {group.templates.map((t, i) => (
                          <div key={i} style={{
                            padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                            color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 2,
                          }}
                            onMouseEnter={e => e.target.style.background = 'var(--bg-2)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                            onClick={() => { setInputMsg(t); document.querySelectorAll('.template-dropdown').forEach(d => d.style.display = 'none'); }}
                          >{t}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 输入区 */}
              <div className="chat-input-area">
                <input
                  className="chat-input"
                  placeholder="输入消息... (Enter发送)"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button className="btn btn-primary" onClick={handleSend}>发送</button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">选择一个会话开始聊天</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
