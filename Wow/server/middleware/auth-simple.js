const crypto = require('crypto');
require('dotenv').config();

// 简化的JWT认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '访问令牌缺失' 
        });
    }

    try {
        // 验证令牌
        const user = verifyToken(token);
        if (user) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ 
                success: false, 
                message: '访问令牌无效或已过期' 
            });
        }
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: '访问令牌验证失败' 
        });
    }
}

// 生成简化的令牌
function generateToken(user) {
    try {
        // 验证用户对象
        if (!user || typeof user !== 'object') {
            throw new Error('无效的用户对象');
        }
        
        if (!user.id || !user.username) {
            throw new Error('用户对象缺少必要字段');
        }
        
        // 确保用户ID是数字
        const userId = parseInt(user.id);
        if (isNaN(userId)) {
            throw new Error('用户ID必须是数字');
        }
        
        // 创建载荷
        const payload = {
            id: userId,
            username: String(user.username),
            timestamp: Date.now(),
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天后过期
        };
        
        // 使用环境变量密钥
        const secret = process.env.JWT_SECRET || 'fallback_secret_key';
        
        // 创建签名
        const data = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
        
        // 组合令牌
        const token = Buffer.from(data).toString('base64') + '.' + signature;
        
        console.log('简化令牌生成成功');
        return token;
        
    } catch (error) {
        console.error('令牌生成错误:', error);
        throw new Error('令牌生成失败: ' + error.message);
    }
}

// 验证简化的令牌
function verifyToken(token) {
    try {
        // 分离数据和签名
        const parts = token.split('.');
        if (parts.length !== 2) {
            return null;
        }
        
        const [dataPart, signaturePart] = parts;
        
        // 解码数据
        const data = JSON.parse(Buffer.from(dataPart, 'base64').toString());
        
        // 检查过期时间
        if (data.expires && Date.now() > data.expires) {
            return null;
        }
        
        // 验证签名
        const secret = process.env.JWT_SECRET || 'fallback_secret_key';
        const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
        
        if (signaturePart !== expectedSignature) {
            return null;
        }
        
        return {
            id: data.id,
            username: data.username
        };
        
    } catch (error) {
        console.error('令牌验证错误:', error);
        return null;
    }
}

module.exports = {
    authenticateToken,
    generateToken,
    verifyToken
}; 