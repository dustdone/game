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
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
        }
    );
}

module.exports = {
    authenticateToken,
    generateToken
}; 