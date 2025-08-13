#!/usr/bin/env node

// 环境变量检查脚本
require('dotenv').config();

console.log('🔍 检查环境变量配置...\n');

const requiredVars = {
    'HOST': '服务器监听地址',
    'PORT': '服务器端口',
    'NODE_ENV': '运行环境',
    'DB_HOST': '数据库主机',
    'DB_PORT': '数据库端口',
    'DB_USER': '数据库用户名',
    'DB_PASSWORD': '数据库密码',
    'DB_NAME': '数据库名称',
    'JWT_SECRET': 'JWT密钥',
    'JWT_EXPIRES_IN': 'JWT过期时间'
};

const optionalVars = {
    'PROTOCOL': '协议类型',
    'CORS_ORIGIN': '跨域配置',
    'RATE_LIMIT_WINDOW_MS': '速率限制窗口',
    'RATE_LIMIT_MAX_REQUESTS': '速率限制最大请求数'
};

console.log('📋 必需环境变量:');
let allRequiredPresent = true;

for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    if (value) {
        if (varName === 'JWT_SECRET') {
            // 隐藏JWT密钥的完整内容
            const displayValue = value.length > 10 ? value.substring(0, 10) + '...' : value;
            console.log(`  ✅ ${varName}: ${displayValue} (${description})`);
        } else {
            console.log(`  ✅ ${varName}: ${value} (${description})`);
        }
    } else {
        console.log(`  ❌ ${varName}: 未设置 (${description})`);
        allRequiredPresent = false;
    }
}

console.log('\n📋 可选环境变量:');
for (const [varName, description] of Object.entries(optionalVars)) {
    const value = process.env[varName];
    if (value) {
        console.log(`  ✅ ${varName}: ${value} (${description})`);
    } else {
        console.log(`  ⚠️  ${varName}: 未设置 (${description})`);
    }
}

console.log('\n🔧 环境变量类型检查:');
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
    console.log(`  JWT_SECRET类型: ${typeof jwtSecret}`);
    console.log(`  JWT_SECRET长度: ${jwtSecret.length}`);
    console.log(`  JWT_SECRET是否为空: ${!jwtSecret.trim()}`);
    
    // 测试JWT密钥是否有效
    try {
        const jwt = require('jsonwebtoken');
        const testPayload = { test: 'data' };
        const testToken = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
        const decoded = jwt.verify(testToken, jwtSecret);
        console.log(`  JWT_SECRET有效性: ✅ 可以正常签名和验证`);
    } catch (error) {
        console.log(`  JWT_SECRET有效性: ❌ ${error.message}`);
    }
}

console.log('\n📊 总结:');
if (allRequiredPresent) {
    console.log('  🎉 所有必需的环境变量都已设置！');
} else {
    console.log('  ⚠️  部分必需的环境变量未设置，请检查配置。');
}

console.log('\n💡 建议:');
if (!process.env.JWT_SECRET) {
    console.log('  1. 运行 ./scripts/generate-jwt-secret.sh 生成JWT密钥');
}
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'your_password') {
    console.log('  2. 设置真实的数据库密码');
}
if (!process.env.NODE_ENV) {
    console.log('  3. 设置NODE_ENV为development或production');
}

console.log('\n🔗 相关文件:');
console.log('  - .env: 环境变量配置文件');
console.log('  - env.example: 环境变量示例文件');
console.log('  - scripts/generate-jwt-secret.sh: JWT密钥生成脚本'); 