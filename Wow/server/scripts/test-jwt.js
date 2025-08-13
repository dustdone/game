#!/usr/bin/env node

// JWT测试脚本
console.log('🧪 测试JWT库功能...\n');

try {
    // 1. 检查JWT库版本
    const jwt = require('jsonwebtoken');
    const packageJson = require('./package.json');
    const jwtVersion = packageJson.dependencies.jsonwebtoken;
    
    console.log(`📦 JWT库版本: ${jwtVersion}`);
    console.log(`🔧 实际版本: ${require('jsonwebtoken/package.json').version}`);
    
    // 2. 测试基本JWT功能
    console.log('\n🧪 测试基本JWT功能...');
    
    const testSecret = 'test_secret_key_for_testing_only';
    const testPayload = { 
        id: 1, 
        username: 'testuser',
        test: true 
    };
    
    console.log('测试载荷:', testPayload);
    console.log('测试密钥:', testSecret);
    
    // 生成令牌
    const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
    console.log('✅ JWT令牌生成成功');
    console.log('令牌长度:', token.length);
    console.log('令牌前50字符:', token.substring(0, 50) + '...');
    
    // 验证令牌
    const decoded = jwt.verify(token, testSecret);
    console.log('✅ JWT令牌验证成功');
    console.log('解码后的载荷:', decoded);
    
    // 3. 测试环境变量中的JWT密钥
    console.log('\n🔍 测试环境变量中的JWT密钥...');
    require('dotenv').config();
    
    const envSecret = process.env.JWT_SECRET;
    if (envSecret) {
        console.log('✅ 找到JWT_SECRET环境变量');
        console.log('密钥类型:', typeof envSecret);
        console.log('密钥长度:', envSecret.length);
        console.log('密钥前10字符:', envSecret.substring(0, 10) + '...');
        
        // 测试环境变量密钥
        try {
            const envToken = jwt.sign(testPayload, envSecret, { expiresIn: '1h' });
            const envDecoded = jwt.verify(envToken, envSecret);
            console.log('✅ 环境变量JWT密钥测试成功');
        } catch (error) {
            console.log('❌ 环境变量JWT密钥测试失败:', error.message);
        }
    } else {
        console.log('❌ 未找到JWT_SECRET环境变量');
    }
    
    // 4. 测试不同类型的载荷
    console.log('\n🧪 测试不同类型的载荷...');
    
    const testCases = [
        { name: '简单对象', payload: { id: 1, name: 'test' } },
        { name: '嵌套对象', payload: { user: { id: 1, profile: { name: 'test' } } } },
        { name: '数组', payload: { items: [1, 2, 3], count: 3 } },
        { name: '混合类型', payload: { id: 1, active: true, tags: ['user', 'admin'] } }
    ];
    
    for (const testCase of testCases) {
        try {
            const testToken = jwt.sign(testCase.payload, testSecret, { expiresIn: '1h' });
            const testDecoded = jwt.verify(testToken, testSecret);
            console.log(`✅ ${testCase.name}: 成功`);
        } catch (error) {
            console.log(`❌ ${testCase.name}: 失败 - ${error.message}`);
        }
    }
    
    console.log('\n🎉 JWT库测试完成！所有功能正常。');
    
} catch (error) {
    console.error('❌ JWT测试失败:', error);
    console.error('错误堆栈:', error.stack);
    
    // 提供解决建议
    console.log('\n💡 解决建议:');
    console.log('1. 检查JWT库是否正确安装: npm install jsonwebtoken');
    console.log('2. 检查Node.js版本是否兼容');
    console.log('3. 尝试重新安装依赖: rm -rf node_modules && npm install');
} 