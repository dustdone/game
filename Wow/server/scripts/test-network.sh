#!/bin/bash

# 网络连接测试脚本
echo "🌐 网络连接测试开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取本机IP
echo -e "${BLUE}📱 获取本机网络信息...${NC}"
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "本机局域网IP: $LOCAL_IP"

# 获取公网IP
echo -e "${BLUE}🌍 获取公网IP...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "无法获取")
echo "公网IP: $PUBLIC_IP"

# 测试本地端口
echo -e "${BLUE}🔍 测试本地端口5555...${NC}"
if nc -z localhost 5555 2>/dev/null; then
    echo -e "${GREEN}✅ 本地端口5555开放${NC}"
else
    echo -e "${RED}❌ 本地端口5555未开放${NC}"
fi

# 测试局域网端口
echo -e "${BLUE}🔍 测试局域网端口5555...${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    if nc -z $LOCAL_IP 5555 2>/dev/null; then
        echo -e "${GREEN}✅ 局域网端口5555开放${NC}"
    else
        echo -e "${RED}❌ 局域网端口5555未开放${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  无法获取局域网IP${NC}"
fi

# 测试网络连通性
echo -e "${BLUE}🌐 测试网络连通性...${NC}"
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 网络连通正常${NC}"
else
    echo -e "${RED}❌ 网络连通异常${NC}"
fi

# 测试DNS解析
echo -e "${BLUE}🔍 测试DNS解析...${NC}"
if nslookup google.com >/dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS解析正常${NC}"
else
    echo -e "${RED}❌ DNS解析异常${NC}"
fi

# 显示访问地址
echo -e "${BLUE}📋 访问地址信息:${NC}"
echo "本地访问: http://localhost:5555"
if [ ! -z "$LOCAL_IP" ]; then
    echo "局域网访问: http://$LOCAL_IP:5555"
fi
if [ "$PUBLIC_IP" != "无法获取" ]; then
    echo "外网访问: http://$PUBLIC_IP:5555"
fi

# 测试健康检查端点
echo -e "${BLUE}🏥 测试健康检查端点...${NC}"
if curl -s http://localhost:5555/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 健康检查端点正常${NC}"
    # 显示详细信息
    echo "服务器状态详情:"
    curl -s http://localhost:5555/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:5555/health
else
    echo -e "${RED}❌ 健康检查端点异常${NC}"
fi

echo -e "${GREEN}🎉 网络测试完成!${NC}"

# 提供下一步建议
echo -e "${YELLOW}💡 下一步建议:${NC}"
echo "1. 如果局域网无法访问，检查防火墙设置"
echo "2. 如果外网无法访问，配置路由器端口转发"
echo "3. 使用 'curl http://localhost:5555/health' 查看详细服务器信息"
echo "4. 检查 .env 文件中的 HOST 和 PORT 配置" 