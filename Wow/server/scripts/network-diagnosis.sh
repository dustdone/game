#!/bin/bash

# 网络连接诊断脚本
echo "🌐 网络连接诊断开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=${1:-5555}
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo -e "${BLUE}检查端口 ${PORT} 的连接状态...${NC}"

# 1. 检查本地端口
echo -e "\n${BLUE}1. 检查本地端口 ${PORT}...${NC}"
if nc -z localhost $PORT 2>/dev/null; then
    echo -e "${GREEN}✅ 本地端口 ${PORT} 开放${NC}"
else
    echo -e "${RED}❌ 本地端口 ${PORT} 未开放${NC}"
fi

# 2. 检查局域网端口
echo -e "\n${BLUE}2. 检查局域网端口 ${PORT}...${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    if nc -z $LOCAL_IP $PORT 2>/dev/null; then
        echo -e "${GREEN}✅ 局域网端口 ${PORT} 开放 (${LOCAL_IP})${NC}"
    else
        echo -e "${RED}❌ 局域网端口 ${PORT} 未开放 (${LOCAL_IP})${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  无法获取局域网IP${NC}"
fi

# 3. 测试本地健康检查
echo -e "\n${BLUE}3. 测试本地健康检查...${NC}"
if curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 本地健康检查成功${NC}"
    # 显示服务器信息
    echo "服务器状态:"
    curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$PORT/health
else
    echo -e "${RED}❌ 本地健康检查失败${NC}"
fi

# 4. 检查网络连通性
echo -e "\n${BLUE}4. 检查网络连通性...${NC}"
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 网络连通正常${NC}"
else
    echo -e "${RED}❌ 网络连通异常${NC}"
fi

# 5. 获取公网IP
echo -e "\n${BLUE}5. 获取公网IP...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "无法获取")
echo "公网IP: $PUBLIC_IP"

# 6. 显示访问地址
echo -e "\n${BLUE}6. 访问地址信息:${NC}"
echo "本地访问: http://localhost:$PORT"
if [ ! -z "$LOCAL_IP" ]; then
    echo "局域网访问: http://$LOCAL_IP:$PORT"
fi
if [ "$PUBLIC_IP" != "无法获取" ]; then
    echo "外网访问: http://$PUBLIC_IP:$PORT"
fi

# 7. 诊断建议
echo -e "\n${BLUE}7. 诊断建议:${NC}"
if nc -z localhost $PORT 2>/dev/null; then
    if [ ! -z "$LOCAL_IP" ] && nc -z $LOCAL_IP $PORT 2>/dev/null; then
        echo -e "${GREEN}✅ 本地和局域网都正常，问题可能在端口转发或防火墙${NC}"
        echo "建议检查:"
        echo "  - 路由器端口转发设置"
        echo "  - 本地防火墙设置"
        echo "  - ISP是否阻止端口"
    else
        echo -e "${YELLOW}⚠️  本地正常但局域网不通，检查防火墙设置${NC}"
    fi
else
    echo -e "${RED}❌ 本地端口未开放，服务器可能未启动${NC}"
    echo "建议检查:"
    echo "  - 服务器是否正在运行"
    echo "  - 端口是否被占用"
    echo "  - 配置文件是否正确"
fi

echo -e "\n${GREEN}🎉 网络诊断完成!${NC}" 