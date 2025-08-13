#!/bin/bash

# JWT密钥生成脚本
echo "🔐 生成JWT密钥..."

# 生成64位随机字符串作为JWT密钥
JWT_SECRET=$(openssl rand -base64 64)

echo "生成的JWT密钥:"
echo "$JWT_SECRET"
echo ""

echo "请将以下内容添加到 .env 文件中:"
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# 检查是否已存在.env文件
if [ -f ".env" ]; then
    echo "检测到 .env 文件，是否要自动更新JWT_SECRET? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # 更新现有的.env文件
        if grep -q "JWT_SECRET=" .env; then
            # 替换现有的JWT_SECRET
            sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
            echo "✅ JWT_SECRET已更新"
        else
            # 添加新的JWT_SECRET
            echo "JWT_SECRET=$JWT_SECRET" >> .env
            echo "✅ JWT_SECRET已添加"
        fi
    else
        echo "请手动更新 .env 文件"
    fi
else
    echo "未找到 .env 文件，请手动创建并添加JWT_SECRET"
fi

echo ""
echo "🎉 JWT密钥生成完成！" 