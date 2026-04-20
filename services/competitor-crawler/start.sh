#!/bin/bash
# 竞品爬虫服务启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数定义
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Python
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        exit 1
    fi
    print_info "Python3 is available"
}

# 检查依赖
check_dependencies() {
    print_info "Checking dependencies..."
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found"
        exit 1
    fi
    
    # 检查MongoDB连接
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand({ ping: 1 })" &> /dev/null; then
            print_info "MongoDB is running"
        else
            print_warn "MongoDB is not running. Please start MongoDB first."
        fi
    else
        print_warn "MongoDB client not found. Please install MongoDB."
    fi
}

# 安装依赖
install_dependencies() {
    print_info "Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    print_info "Installing Playwright browsers..."
    python3 -m playwright install chromium
}

# 创建目录
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p data logs
}

# 启动服务
start_service() {
    local mode=${1:-"dev"}
    
    if [ "$mode" = "prod" ]; then
        print_info "Starting service in production mode..."
        uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
    else
        print_info "Starting service in development mode..."
        uvicorn main:app --reload --host 0.0.0.0 --port 8000
    fi
}

# 停止服务
stop_service() {
    print_info "Stopping service..."
    pkill -f "uvicorn main:app" || true
}

# 重启服务
restart_service() {
    stop_service
    sleep 2
    start_service "$1"
}

# 显示状态
show_status() {
    print_info "Service status:"
    
    # 检查进程
    if pgrep -f "uvicorn main:app" > /dev/null; then
        print_info "Service is running"
        pgrep -f "uvicorn main:app"
    else
        print_warn "Service is not running"
    fi
    
    # 检查端口
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_info "Port 8000 is in use"
    else
        print_warn "Port 8000 is free"
    fi
    
    # 检查健康
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:8000/health > /dev/null; then
            print_info "Health check: OK"
        else
            print_warn "Health check: Failed"
        fi
    fi
}

# 显示日志
show_logs() {
    local lines=${1:-100}
    if [ -f "logs/competitor_crawler.log" ]; then
        tail -n "$lines" logs/competitor_crawler.log
    else
        print_warn "Log file not found"
    fi
}

# 显示帮助
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install dependencies"
    echo "  start       Start service (dev mode)"
    echo "  start:prod  Start service (production mode)"
    echo "  stop        Stop service"
    echo "  restart     Restart service"
    echo "  restart:prod Restart service (production mode)"
    echo "  status      Show service status"
    echo "  logs        Show logs (default: last 100 lines)"
    echo "  logs:tail   Tail logs"
    echo "  help        Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 start"
    echo "  $0 start:prod"
    echo "  $0 logs 200"
}

# 主函数
main() {
    local command=${1:-"help"}
    
    # 切换到脚本所在目录
    cd "$(dirname "$0")"
    
    # 检查Python
    check_python
    
    case $command in
        "install")
            check_dependencies
            install_dependencies
            create_directories
            print_info "Installation completed"
            ;;
        "start")
            start_service "dev"
            ;;
        "start:prod")
            start_service "prod"
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            restart_service "dev"
            ;;
        "restart:prod")
            restart_service "prod"
            ;;
        "status")
            show_status
            ;;
        "logs")
            local lines=${2:-100}
            show_logs "$lines"
            ;;
        "logs:tail")
            if [ -f "logs/competitor_crawler.log" ]; then
                tail -f logs/competitor_crawler.log
            else
                print_warn "Log file not found"
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
