const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '访问令牌缺失' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: '访问令牌无效或已过期' 
            });
        }
        req.user = user;
        next();
    });
}

// 生成JWT令牌
function generateToken(user) {
    // 验证JWT密钥是否存在
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET环境变量未设置');
    }
    
    // 确保JWT_SECRET是字符串类型
    const secret = String(process.env.JWT_SECRET);
    if (!secret || secret.trim() === '') {
        throw new Error('JWT_SECRET不能为空');
    }
    
    // 验证用户对象
    if (!user || typeof user !== 'object') {
        console.error('用户对象验证失败 - 不是对象:', user);
        throw new Error('无效的用户对象');
    }
    
    console.log('验证用户对象字段:', {
        hasId: !!user.id,
        hasUsername: !!user.username,
        idType: typeof user.id,
        usernameType: typeof user.username,
        idValue: user.id,
        usernameValue: user.username
    });
    
    if (!user.id || !user.username) {
        console.error('用户对象缺少必要字段:', user);
        throw new Error('用户对象缺少必要字段');
    }
    
    // 确保用户ID是数字
    const userId = parseInt(user.id);
    if (isNaN(userId)) {
        console.error('用户ID不是有效数字:', user.id);
        throw new Error('用户ID必须是数字');
    }
    
    try {
        console.log('准备生成JWT令牌:', {
            payload: { id: userId, username: user.username },
            secret: secret.substring(0, 10) + '...', // 只显示前10个字符
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
        
        const token = jwt.sign(
            { 
                id: userId, 
                username: String(user.username) 
            },
            secret,
            { 
                expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
            }
        );
        
        console.log('JWT令牌生成成功');
        return token;
    } catch (error) {
        console.error('JWT签名错误详情:', {
            error: error.message,
            stack: error.stack,
            user: user,
            secretType: typeof secret,
            secretLength: secret.length
        });
        throw new Error('JWT令牌生成失败: ' + error.message);
    }
}

module.exports = {
    authenticateToken,
    generateToken
}; 