#!/bin/bash
# RAG知识库服务启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Python环境
check_python() {
    if ! command -v python &> /dev/null; then
        print_error "Python is not installed or not in PATH"
        exit 1
    fi
    
    python_version=$(python --version 2>&1)
    print_info "Python version: $python_version"
}

# 检查依赖
check_dependencies() {
    print_info "Checking dependencies..."
    
    # 检查关键包
    python -c "import fastapi, uvicorn, pydantic" 2>/dev/null
    if [ $? -ne 0 ]; then
        print_warn "Some dependencies are missing. Installing..."
        pip install -r requirements.txt
    else
        print_info "All dependencies are installed"
    fi
}

# 创建必要的目录
create_dirs() {
    print_info "Creating necessary directories..."
    
    mkdir -p data
    mkdir -p indexes
    mkdir -p logs
    
    print_info "Directories created"
}

# 启动服务
start_service() {
    print_info "Starting RAG Knowledge Base Service..."
    
    # 设置环境变量
    export RAG_SERVICE_HOST=${RAG_SERVICE_HOST:-"0.0.0.0"}
    export RAG_SERVICE_PORT=${RAG_SERVICE_PORT:-"8001"}
    export RAG_SERVICE_RELOAD=${RAG_SERVICE_RELOAD:-"false"}
    
    # 启动服务
    python main.py
}

# 主函数
main() {
    print_info "RAG Knowledge Base Service Startup Script"
    print_info "========================================"
    
    # 检查Python环境
    check_python
    
    # 检查依赖
    check_dependencies
    
    # 创建目录
    create_dirs
    
    # 启动服务
    start_service
}

# 捕获中断信号
trap 'print_info "Service stopped"; exit 0' INT

# 执行主函数
main