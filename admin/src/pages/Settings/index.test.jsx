import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from './index';
import { DEFAULT_SETTINGS } from '../../utils/mock';

describe('Settings Component', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();

    // Mock global window objects
    global.window.alert = vi.fn();
    global.window.open = vi.fn();
    global.fetch = vi.fn();
  });

  it('renders the Settings component with correct header', () => {
    render(<Settings />);
    expect(screen.getByText('系统设置')).toBeInTheDocument();
    expect(screen.getByText('管理店铺信息、平台对接、通知和AI配置')).toBeInTheDocument();
  });

  it('displays the general settings tab by default', () => {
    render(<Settings />);
    // Check that "基础设置" title inside the content area is visible
    const generalTitles = screen.getAllByText('基础设置');
    expect(generalTitles.length).toBeGreaterThan(0);

    // Check for some general settings fields using the input associated values because labels don't have htmlFor
    expect(screen.getByDisplayValue('我的电商店铺')).toBeInTheDocument();
    expect(screen.getByDisplayValue('400-000-0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('support@example.com')).toBeInTheDocument();
  });

  it('allows switching tabs', () => {
    render(<Settings />);

    // Switch to Platforms tab
    fireEvent.click(screen.getByText('平台配置'));
    expect(screen.getByText('平台配置', { selector: 'h3' })).toBeInTheDocument();

    // Switch to Douyin tab
    fireEvent.click(screen.getByText('抖音对接'));
    expect(screen.getByText('🎵 抖音店铺对接', { selector: 'h3' })).toBeInTheDocument();

    // Switch to Notifications tab
    fireEvent.click(screen.getByText('通知设置'));
    expect(screen.getByText('通知设置', { selector: 'h3' })).toBeInTheDocument();

    // Switch to AI tab
    fireEvent.click(screen.getByText('AI 配置'));
    expect(screen.getByText('AI 配置', { selector: 'h3' })).toBeInTheDocument();
  });

  it('updates form inputs correctly', () => {
    render(<Settings />);

    const shopNameInput = screen.getByDisplayValue('我的电商店铺');
    fireEvent.change(shopNameInput, { target: { value: 'New Shop Name' } });
    expect(shopNameInput.value).toBe('New Shop Name');

    const phoneInput = screen.getByDisplayValue('400-000-0000');
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    expect(phoneInput.value).toBe('1234567890');
  });

  it('handles Douyin auth connection successfully', async () => {
    // Mock fetch to return a successful auth URL
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: { auth_url: 'http://auth.url' } })
    });

    render(<Settings />);

    // Navigate to douyin tab
    fireEvent.click(screen.getByText('抖音对接'));

    // Click connect button
    const connectBtn = screen.getByText('🔗 连接抖音店铺');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.window.open).toHaveBeenCalledWith('http://auth.url', '_blank');
    });
  });

  it('handles Douyin auth connection failure (no auth_url)', async () => {
    // Mock fetch to return data without auth_url
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: {} })
    });

    render(<Settings />);

    fireEvent.click(screen.getByText('抖音对接'));
    const connectBtn = screen.getByText('🔗 连接抖音店铺');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.window.alert).toHaveBeenCalledWith('请先启动后端服务 (端口8001) 并配置 DOUYIN_APP_KEY');
    });
  });

  it('handles Douyin auth connection error', async () => {
    // Mock fetch to reject
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Settings />);

    fireEvent.click(screen.getByText('抖音对接'));
    const connectBtn = screen.getByText('🔗 连接抖音店铺');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.window.alert).toHaveBeenCalledWith(
        '无法连接后端服务，请确保 douyin-adapter 服务已启动\n\n启动命令:\ncd ~/ecom-automation/services/douyin-adapter && pip install -r requirements.txt && python main.py'
      );
    });
  });

  it('allows saving settings', async () => {
    vi.useFakeTimers();
    render(<Settings />);

    const saveBtn = screen.getByText('💾 保存设置');
    fireEvent.click(saveBtn);

    // Button text should change to saved
    expect(screen.getByText('✅ 已保存')).toBeInTheDocument();

    // Fast forward timers to check if it reverts back
    // Wrap the timer advancement in act to clear the Warning
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('💾 保存设置')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
