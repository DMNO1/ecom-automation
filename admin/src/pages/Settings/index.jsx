/**
 * 系统设置
 * 店铺信息 + 平台配置 + 通知设置 + AI配置
 */
import React, { useState } from 'react';
import { DEFAULT_SETTINGS, PLATFORMS } from '../../utils/mock';

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: 'general', label: '基础设置', icon: '⚙️' },
    { key: 'platforms', label: '平台配置', icon: '🔗' },
    { key: 'notifications', label: '通知设置', icon: '🔔' },
    { key: 'ai', label: 'AI 配置', icon: '🤖' },
  ];

  // Switch 组件
  const Switch = ({ checked, onChange }) => (
    <div className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} />
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">系统设置</h2>
        <p className="page-desc">管理店铺信息、平台对接、通知和AI配置</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--spacing-lg)' }}>
        {/* 左侧导航 */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body" style={{ padding: 'var(--spacing-sm)' }}>
            {tabs.map(tab => (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: activeTab === tab.key ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-2)',
                  fontWeight: activeTab === tab.key ? 500 : 400,
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="card">
          <div className="card-body">
            {/* 基础设置 */}
            {activeTab === 'general' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>基础设置</h3>
                <div className="form-group">
                  <label className="form-label">店铺名称</label>
                  <input
                    className="form-input"
                    value={settings.general.shopName}
                    onChange={e => updateSetting('general', 'shopName', e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">联系电话</label>
                    <input
                      className="form-input"
                      value={settings.general.contactPhone}
                      onChange={e => updateSetting('general', 'contactPhone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">联系邮箱</label>
                    <input
                      className="form-input"
                      value={settings.general.contactEmail}
                      onChange={e => updateSetting('general', 'contactEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">自动回复</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Switch
                      checked={settings.general.autoReply}
                      onChange={v => updateSetting('general', 'autoReply', v)}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                      开启后自动回复客户常见问题
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">系统语言</label>
                  <select
                    className="form-input"
                    value={settings.general.language}
                    onChange={e => updateSetting('general', 'language', e.target.value)}
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* 平台配置 */}
            {activeTab === 'platforms' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>平台配置</h3>
                {PLATFORMS.map(plat => {
                  const config = settings.platforms[plat.key] || {};
                  return (
                    <div key={plat.key} style={{
                      padding: 20,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{plat.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{plat.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              {config.enabled ? '已启用' : '未启用'}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={config.enabled}
                          onChange={v => updateSetting('platforms', plat.key, { ...config, enabled: v })}
                        />
                      </div>
                      {config.enabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 13 }}>App ID</label>
                            <input
                              className="form-input"
                              placeholder="输入应用ID"
                              value={config.appId || ''}
                              onChange={e => updateSetting('platforms', plat.key, { ...config, appId: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: 13 }}>同步间隔</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                className="form-input"
                                type="number"
                                min={5}
                                value={config.syncInterval || 15}
                                onChange={e => updateSetting('platforms', plat.key, { ...config, syncInterval: +e.target.value })}
                                style={{ width: 80 }}
                              />
                              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>分钟</span>
                              <Switch
                                checked={config.autoSync}
                                onChange={v => updateSetting('platforms', plat.key, { ...config, autoSync: v })}
                              />
                              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>自动同步</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 通知设置 */}
            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>通知设置</h3>
                {[
                  { key: 'orderAlert', label: '新订单提醒', desc: '收到新订单时通知' },
                  { key: 'refundAlert', label: '退款申请提醒', desc: '客户发起退款时通知' },
                  { key: 'stockAlert', label: '库存预警提醒', desc: '库存低于安全阈值时通知' },
                  { key: 'competitorAlert', label: '竞品价格变动提醒', desc: '竞品价格发生较大变动时通知' },
                  { key: 'dailyReport', label: '每日数据报告', desc: '每天推送运营数据汇总' },
                ].map(item => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.desc}</div>
                    </div>
                    <Switch
                      checked={settings.notifications[item.key]}
                      onChange={v => updateSetting('notifications', item.key, v)}
                    />
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <div className="form-group">
                    <label className="form-label">通知渠道</label>
                    <select
                      className="form-input"
                      value={settings.notifications.alertChannel}
                      onChange={e => updateSetting('notifications', 'alertChannel', e.target.value)}
                    >
                      <option value="feishu">飞书</option>
                      <option value="wechat">微信</option>
                      <option value="email">邮件</option>
                      <option value="sms">短信</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* AI 配置 */}
            {activeTab === 'ai' && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>AI 配置</h3>
                {[
                  { key: 'autoCustomerService', label: 'AI自动客服', desc: '自动回复客户常见问题' },
                  { key: 'autoProductDescription', label: 'AI商品描述', desc: '自动生成商品标题和详情' },
                  { key: 'autoPricing', label: 'AI智能定价', desc: '根据竞品数据自动调整价格' },
                ].map(item => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.desc}</div>
                    </div>
                    <Switch
                      checked={settings.ai[item.key]}
                      onChange={v => updateSetting('ai', item.key, v)}
                    />
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  <div className="form-group">
                    <label className="form-label">AI 模型</label>
                    <select
                      className="form-input"
                      value={settings.ai.model}
                      onChange={e => updateSetting('ai', 'model', e.target.value)}
                    >
                      <option value="gpt-4">GPT-4 (推荐)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3">Claude 3</option>
                      <option value="qwen">通义千问</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      置信度阈值: {(settings.ai.confidenceThreshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={settings.ai.confidenceThreshold * 100}
                      onChange={e => updateSetting('ai', 'confidenceThreshold', e.target.value / 100)}
                      style={{ width: '100%' }}
                    />
                    <div className="form-hint">低于此置信度时，AI会转人工处理</div>
                  </div>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? '✅ 已保存' : '💾 保存设置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
