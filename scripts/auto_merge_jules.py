#!/usr/bin/env python3
"""
Jules 自动合并脚本 - 每5分钟运行
功能：检查Jules会话中已完成的任务，自动拉取并合并到本地仓库
"""

import os
import re
import subprocess
import sys
from datetime import datetime

# 配置
PROJECT_DIR = os.path.expanduser("~/ecom-automation")
RECORD_FILE = os.path.expanduser("~/.jules_merged_sessions.txt")

def load_merged_sessions():
    """加载已合并的会话ID记录"""
    if os.path.exists(RECORD_FILE):
        with open(RECORD_FILE, 'r') as f:
            return set(line.strip() for line in f if line.strip())
    return set()

def save_merged_session(session_id):
    """保存已合并的会话ID"""
    with open(RECORD_FILE, 'a') as f:
        f.write(f"{session_id}\n")

def get_jules_sessions():
    """获取所有Jules会话列表"""
    try:
        result = subprocess.run(
            ["jules", "remote", "list", "--session"],
            capture_output=True,
            text=True,
            timeout=30,
            stdin=subprocess.DEVNULL  # 避免TTY错误
        )
        if result.returncode != 0:
            print(f"[{datetime.now()}] ❌ 获取会话列表失败: {result.stderr}")
            return []
        return result.stdout.strip().split('\n')
    except Exception as e:
        print(f"[{datetime.now()}] ❌ 执行jules命令异常: {e}")
        return []

def parse_sessions(lines):
    """解析会话列表，提取ID和状态"""
    sessions = []
    # 跳过表头，从第二行开始（第一行可能是表头分隔行）
    for line in lines[2:] if len(lines) > 2 else lines:
        line = line.rstrip()
        if not line or not line[0].isdigit():
            continue
        # 提取会话ID（行首的数字）
        match = re.match(r'^(\d+)', line)
        if match:
            session_id = match.group(1)
            # 提取状态（行尾的单词）
            parts = re.split(r'\s{2,}', line.strip())
            status = parts[-1] if parts else "Unknown"
            sessions.append((session_id, status))
    return sessions

def merge_completed_sessions():
    """主函数：合并已完成的会话"""
    print(f"\n[{datetime.now()}] 🔄 开始检查Jules会话...")

    os.chdir(PROJECT_DIR)

    merged_sessions = load_merged_sessions()
    sessions = get_jules_sessions()

    if not sessions:
        print(f"[{datetime.now()}] ⚠️  未获取到会话数据")
        return

    completed_sessions = [
        (sid, status) for sid, status in parse_sessions(sessions)
        if status == "Completed"
    ]

    if not completed_sessions:
        print(f"[{datetime.now()}] ✅ 没有需要合并的已完成任务")
        return

    new_sessions = [(sid, status) for sid, status in completed_sessions if sid not in merged_sessions]

    if not new_sessions:
        print(f"[{datetime.now()}] ✅ 所有已完成的任务已合并过，无新任务")
        return

    print(f"[{datetime.now()}] 📋 发现 {len(new_sessions)} 个新完成的会话需要合并")

    for session_id, status in new_sessions:
        print(f"[{datetime.now()}] ⏳ 正在合并会话 {session_id}...")
        try:
            result = subprocess.run(
                ["jules", "remote", "pull", "--session", session_id, "--apply"],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=PROJECT_DIR,
                stdin=subprocess.DEVNULL  # 避免TTY错误
            )
            if result.returncode == 0:
                print(f"[{datetime.now()}] ✅ 会话 {session_id} 合并成功")
                save_merged_session(session_id)
                # 合并成功后，检查是否有未暂存的更改
                git_status = subprocess.run(
                    ["git", "status", "--short"],
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_DIR
                )
                if git_status.stdout.strip():
                    changed_files = git_status.stdout.strip().split('\n')
                    print(f"[{datetime.now()}] 📝 有 {len(changed_files)} 个文件被修改:")
                    for f in changed_files[:10]:  # 最多显示10个
                        print(f"   {f}")
            else:
                print(f"[{datetime.now()}] ❌ 会话 {session_id} 合并失败: {result.stderr}")
        except subprocess.TimeoutExpired:
            print(f"[{datetime.now()}] ⏰ 会话 {session_id} 拉取超时")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ 合并会话 {session_id} 时异常: {e}")

    print(f"[{datetime.now()}] 🎉 合并流程完成")

if __name__ == "__main__":
    merge_completed_sessions()