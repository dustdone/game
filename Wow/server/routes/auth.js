const express = require('express');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth-simple');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少6位'
            });
        }

        // 检查用户名是否已存在
        const existingUser = await query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 加密密码
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 创建用户和游戏数据
        const result = await transaction(async (connection) => {
            // 插入用户
            const [userResult] = await connection.execute(
                'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                [username, passwordHash, email || null]
            );

            const userId = userResult.insertId;

            // 插入初始游戏数据
            await connection.execute(
                `INSERT INTO game_data (user_id, level, exp, gold, health, max_health, attack, defense) 
                 VALUES (?, 1, 0, 100, 100, 100, 10, 5)`,
                [userId]
            );

            return { userId, username };
        });

        // 生成JWT令牌
        let token;
        try {
            // 统一用户对象格式
            const userForToken = {
                id: result.userId,
                username: result.username
            };
            console.log('注册时传递给generateToken的用户对象:', userForToken);
            token = generateToken(userForToken);
        } catch (error) {
            console.error('JWT生成错误:', error);
            return res.status(500).json({
                success: false,
                message: 'JWT令牌生成失败: ' + error.message
            });
        }

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: result.userId,
                    username: result.username
                },
                token
            }
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 查询用户
        const users = await query(
            'SELECT id, username, password_hash FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        const user = users[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 更新最后登录时间
        await query(
            'UPDATE game_data SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.id]
        );

        // 生成JWT令牌
        console.log('登录时传递给generateToken的用户对象:', {
            id: user.id,
            username: user.username
        });
        const token = generateToken(user);

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    username: user.username
                },
                token
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户信息
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 查询用户信息和游戏数据
        const [userData] = await query(
            `SELECT u.username, u.email, u.created_at,
                    g.level, g.exp, g.gold, g.health, g.max_health, g.attack, g.defense, g.last_login
             FROM users u
             LEFT JOIN game_data g ON u.id = g.user_id
             WHERE u.id = ?`,
            [userId]
        );

        if (!userData) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 修改密码
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码不能为空'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少6位'
            });
        }

        // 验证当前密码
        const [user] = await query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 加密新密码
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // 更新密码
        await query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: '密码修改成功'
        });

    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router; 