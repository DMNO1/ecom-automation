#!/bin/bash
# 拼多多客服自动化服务启动脚本

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
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 未安装"
        exit 1
    fi
    print_info "Python3 检查通过"
}

# 检查虚拟环境
check_venv() {
    if [ ! -d "venv" ]; then
        print_warn "虚拟环境不存在，正在创建..."
        python3 -m venv venv
        print_info "虚拟环境创建成功"
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    print_info "虚拟环境已激活"
}

# 安装依赖
install_dependencies() {
    print_info "检查并安装依赖..."
    pip install -r requirements.txt
    print_info "依赖安装完成"
}

# 检查环境变量
check_env() {
    if [ ! -f ".env" ]; then
        print_warn ".env 文件不存在，使用 .env.example 创建"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_info "已创建 .env 文件，请编辑填入实际配置"
            print_warn "服务可能无法正常运行，请先配置 .env 文件"
        else
            print_error ".env.example 文件不存在"
            exit 1
        fi
    else
        print_info ".env 文件检查通过"
    fi
}

# 安装Playwright浏览器
install_playwright() {
    print_info "安装Playwright浏览器..."
    playwright install chromium
    print_info "Playwright浏览器安装完成"
}

# 启动服务
start_service() {
    print_info "启动拼多多客服自动化服务..."
    
    # 检查是否指定了端口
    PORT=${1:-8000}
    
    # 启动服务
    uvicorn main:app --host 0.0.0.0 --port $PORT --reload
}

# 显示帮助
show_help() {
    echo "拼多多客服自动化服务启动脚本"
    echo ""
    echo "用法:"
    echo "  ./start.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --install    安装依赖和Playwright浏览器"
    echo "  --port PORT  指定端口 (默认: 8000)"
    echo "  --help       显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh                  # 使用默认配置启动"
    echo "  ./start.sh --port 8080      # 使用8080端口启动"
    echo "  ./start.sh --install        # 安装依赖并启动"
}

# 主函数
main() {
    # 解析参数
    INSTALL=false
    PORT=8000
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                INSTALL=true
                shift
                ;;
            --port)
                PORT="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境
    check_python
    check_venv
    
    if [ "$INSTALL" = true ]; then
        install_dependencies
        install_playwright
    fi
    
    check_env
    
    # 启动服务
    start_service $PORT
}

# 运行主函数
main "$@"
