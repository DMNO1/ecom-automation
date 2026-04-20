#!/bin/bash
# Hermes总控服务启动脚本

set -e

# 默认配置
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-"8080"}
WORKERS=${WORKERS:-"4"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

echo "启动Hermes总控服务..."
echo "主机: $HOST"
echo "端口: $PORT"
echo "工作进程: $WORKERS"
echo "日志级别: $LOG_LEVEL"

# 检查Python环境
if ! command -v python &> /dev/null; then
    echo "错误: 未找到Python"
    exit 1
fi

# 检查依赖
echo "检查依赖..."
python -c "import fastapi, uvicorn" || {
    echo "错误: 缺少依赖，请运行: pip install -r requirements.txt"
    exit 1
}

# 启动服务
exec uvicorn main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL"