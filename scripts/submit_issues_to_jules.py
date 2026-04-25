#!/usr/bin/env python3
import os, json, subprocess, sys, glob, datetime
from collections import defaultdict

PROJECT_DIR = os.path.expanduser("~/ecom-automation")
REPORTS_DIR = os.path.join(PROJECT_DIR, "test-reports")
RECORD_FILE = os.path.expanduser("~/.jules_issues_submitted.txt")  # 记录已提交的报告文件，避免重复

def load_submitted_reports():
    if os.path.exists(RECORD_FILE):
        with open(RECORD_FILE) as f:
            return set(line.strip() for line in f if line.strip())
    return set()

def save_submitted_report(filepath):
    with open(RECORD_FILE, 'a') as f:
        f.write(filepath + '\n')

def get_recent_reports(hours=24):
    cutoff = datetime.datetime.now() - datetime.timedelta(hours=hours)
    reports = []
    pattern = os.path.join(REPORTS_DIR, "test_report_*.json")
    for filepath in glob.glob(pattern):
        mtime = os.path.getmtime(filepath)
        file_mtime = datetime.datetime.fromtimestamp(mtime)
        if file_mtime >= cutoff:
            reports.append(filepath)
    reports.sort(key=os.path.getmtime, reverse=True)
    return reports

def parse_report(filepath):
    issues = []
    try:
        with open(filepath) as f:
            data = json.load(f)
        tests = data.get("tests", {})
        for suite_name, suite in tests.items():
            status = suite.get("status", "PASS")
            if status == "PASS":
                continue
            details = suite.get("details", [])
            message = suite.get("message", "")
            if details:
                for d in details:
                    if isinstance(d, list):
                        for sub in d:
                            issues.append((suite_name, str(sub)))
                    else:
                        issues.append((suite_name, str(d)))
            elif message:
                issues.append((suite_name, message))
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
    return issues

def main():
    print(f"[{datetime.datetime.now()}] 🔍 开始收集问题...")
    os.chdir(PROJECT_DIR)
    reports = get_recent_reports(hours=24)  # 最近24小时
    if not reports:
        print("未找到近期报告，跳过提交")
        return

    # 检查哪些报告已经提交过
    submitted = load_submitted_reports()
    new_reports = [r for r in reports if r not in submitted]
    if not new_reports:
        print("所有近期报告均已提交过，跳过")
        return

    all_issues = []
    for r in new_reports:
        all_issues.extend(parse_report(r))

    # 去重
    seen = set()
    unique_issues = []
    for suite, detail in all_issues:
        key = f"{suite}|{detail}"
        if key not in seen:
            seen.add(key)
            unique_issues.append((suite, detail))

    total = len(unique_issues)
    if total == 0:
        print("新报告中没有发现问题，跳过提交")
        # 仍标记为已提交，避免下次再处理
        for r in new_reports:
            save_submitted_report(r)
        return

    # 生成描述
    lines = []
    lines.append("## 📋 需要处理的问题汇总")
    lines.append(f"- 总问题数: {total}")
    lines.append("- 问题分布:")
    by_suite = defaultdict(int)
    for suite, _ in unique_issues:
        by_suite[suite] += 1
    for suite, count in sorted(by_suite.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"  - {suite}: {count}")

    lines.append("\n## 🔍 详细问题列表（前20个）")
    for i, (suite, detail) in enumerate(unique_issues[:20], 1):
        lines.append(f"{i}. [{suite}] {detail}")
    if total > 20:
        lines.append(f"... 以及另外 {total-20} 个问题，详见 test-reports/ 目录的最新 JSON 文件。")

    lines.append("\n来源: test-reports/ 目录下最近24小时的测试报告")
    lines.append("请分析并生成修复方案。")

    description = "\n".join(lines)

    print(f"准备提交 {total} 个问题给 Jules (来自 {len(new_reports)} 个新报告)...")
    print("提交描述:")
    print(description)

    # 调用 jules remote new
    try:
        result = subprocess.run(
            ["jules", "remote", "new", "--repo", "DMNO1/ecom-automation", "--session", description],
            capture_output=True,
            text=True,
            timeout=120,
            stdin=subprocess.DEVNULL
        )
        if result.returncode == 0:
            print(f"[{datetime.datetime.now()}] ✅ 成功提交Jules任务")
            # 记录已提交的报告
            for r in new_reports:
                save_submitted_report(r)
        else:
            print(f"[{datetime.datetime.now()}] ❌ 提交失败: {result.stderr}")
    except Exception as e:
        print(f"[{datetime.datetime.now()}] ❌ 提交异常: {e}")

if __name__ == "__main__":
    main()