#!/bin/bash

# 云服务器网络诊断脚本
echo "☁️ 云服务器网络诊断开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=${1:-5555}
LOCAL_IP=$(hostname -I | awk '{print $1}')
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "无法获取")

echo -e "${BLUE}服务器信息:${NC}"
echo "主机名: $(hostname)"
echo "本地IP: $LOCAL_IP"
echo "公网IP: $PUBLIC_IP"
echo "端口: $PORT"

# 1. 检查服务器状态
echo -e "\n${BLUE}1. 检查服务器状态...${NC}"
if pgrep -f "node.*server.js" > /dev/null; then
    echo -e "${GREEN}✅ Node.js服务器正在运行${NC}"
    ps aux | grep "node.*server.js" | grep -v grep
else
    echo -e "${RED}❌ Node.js服务器未运行${NC}"
fi

# 2. 检查端口监听
echo -e "\n${BLUE}2. 检查端口监听状态...${NC}"
if netstat -tlnp 2>/dev/null | grep ":$PORT "; then
    echo -e "${GREEN}✅ 端口 $PORT 正在监听${NC}"
    netstat -tlnp 2>/dev/null | grep ":$PORT "
else
    echo -e "${RED}❌ 端口 $PORT 未监听${NC}"
fi

# 3. 检查本地连接
echo -e "\n${BLUE}3. 检查本地连接...${NC}"
if curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 本地连接正常${NC}"
else
    echo -e "${RED}❌ 本地连接失败${NC}"
fi

# 4. 检查局域网连接
echo -e "\n${BLUE}4. 检查局域网连接...${NC}"
if curl -s http://$LOCAL_IP:$PORT/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 局域网连接正常${NC}"
else
    echo -e "${RED}❌ 局域网连接失败${NC}"
fi

# 5. 检查防火墙状态
echo -e "\n${BLUE}5. 检查防火墙状态...${NC}"
if command -v ufw >/dev/null 2>&1; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    echo "UFW状态: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        echo -e "${YELLOW}⚠️  UFW防火墙已启用${NC}"
        sudo ufw status | grep $PORT || echo -e "${RED}❌ 端口 $PORT 未在UFW中开放${NC}"
    fi
else
    echo "UFW未安装"
fi

# 6. 检查iptables规则
echo -e "\n${BLUE}6. 检查iptables规则...${NC}"
if sudo iptables -L INPUT -n | grep -q ":$PORT "; then
    echo -e "${GREEN}✅ iptables允许端口 $PORT${NC}"
    sudo iptables -L INPUT -n | grep ":$PORT "
else
    echo -e "${RED}❌ iptables未允许端口 $PORT${NC}"
fi

# 7. 检查网络接口
echo -e "\n${BLUE}7. 检查网络接口...${NC}"
ip addr show | grep "inet " | grep -v "127.0.0.1"

# 8. 测试外网连接
echo -e "\n${BLUE}8. 测试外网连接...${NC}"
echo "从其他网络测试: curl http://$PUBLIC_IP:$PORT/health"

# 9. 诊断建议
echo -e "\n${BLUE}9. 诊断建议:${NC}"
if curl -s http://localhost:$PORT/health >/dev/null 2>&1; then
    if curl -s http://$LOCAL_IP:$PORT/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 本地和局域网都正常，问题在防火墙或安全组${NC}"
        echo "建议操作:"
        echo "  1. 开放UFW端口: sudo ufw allow $PORT"
        echo "  2. 添加iptables规则: sudo iptables -A INPUT -p tcp --dport $PORT -j ACCEPT"
        echo "  3. 检查云服务商安全组设置"
    else
        echo -e "${YELLOW}⚠️  本地正常但局域网不通，检查防火墙${NC}"
    fi
else
    echo -e "${RED}❌ 本地连接失败，检查服务器状态${NC}"
fi

echo -e "\n${GREEN}🎉 云服务器诊断完成!${NC}" 