#!/bin/bash

# 端口管理脚本
echo "🔧 端口管理工具"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=${1:-5555}

echo -e "${BLUE}检查端口 ${PORT} 的使用情况...${NC}"

# 检查端口占用
if lsof -i :$PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}端口 ${PORT} 被占用:${NC}"
    lsof -i :$PORT
    
    echo -e "\n${BLUE}选择操作:${NC}"
    echo "1. 杀死占用端口的进程"
    echo "2. 使用其他端口"
    echo "3. 退出"
    
    read -p "请输入选择 (1-3): " choice
    
    case $choice in
        1)
            echo -e "${YELLOW}正在杀死占用端口 ${PORT} 的进程...${NC}"
            lsof -ti :$PORT | xargs kill -9
            echo -e "${GREEN}进程已杀死，端口 ${PORT} 现在可用${NC}"
            ;;
        2)
            echo -e "${BLUE}建议使用端口: 5556, 5557, 5558${NC}"
            read -p "请输入新端口号: " new_port
            if [[ $new_port =~ ^[0-9]+$ ]] && [ $new_port -ge 1024 ] && [ $new_port -le 65535 ]; then
                echo -e "${GREEN}新端口: ${new_port}${NC}"
                echo "请修改 .env 文件中的 PORT 值"
            else
                echo -e "${RED}无效的端口号${NC}"
            fi
            ;;
        3)
            echo -e "${BLUE}退出端口管理${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${GREEN}端口 ${PORT} 可用${NC}"
fi 