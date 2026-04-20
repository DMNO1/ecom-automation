#!/bin/bash

# 抖店Adapter服务启动脚本

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "警告: 未找到.env文件，请复制.env.example为.env并配置相关参数"
    cp .env.example .env
fi

# 启动服务
echo "启动抖店Adapter服务..."
python3 main.py
