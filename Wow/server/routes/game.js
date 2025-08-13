const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取游戏数据
router.get('/data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 查询游戏数据
        const [gameData] = await query(
            `SELECT level, exp, gold, health, max_health, attack, defense, last_login
             FROM game_data WHERE user_id = ?`,
            [userId]
        );

        if (!gameData) {
            return res.status(404).json({
                success: false,
                message: '游戏数据不存在'
            });
        }

        // 计算升级所需经验
        gameData.expToNextLevel = gameData.level * 100;

        res.json({
            success: true,
            data: gameData
        });

    } catch (error) {
        console.error('获取游戏数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 保存游戏数据
router.put('/data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { level, exp, gold, health, maxHealth, attack, defense } = req.body;

        // 验证数据并设置默认值
        const validatedData = {
            level: typeof level === 'number' ? level : 1,
            exp: typeof exp === 'number' ? exp : 0,
            gold: typeof gold === 'number' ? gold : 100,
            health: typeof health === 'number' ? health : 100,
            maxHealth: typeof maxHealth === 'number' ? maxHealth : 100,
            attack: typeof attack === 'number' ? attack : 10,
            defense: typeof defense === 'number' ? defense : 5
        };
        
        console.log('验证后的游戏数据:', validatedData);

        // 更新游戏数据
        await query(
            `UPDATE game_data 
             SET level = ?, exp = ?, gold = ?, health = ?, max_health = ?, attack = ?, defense = ?
             WHERE user_id = ?`,
            [validatedData.level, validatedData.exp, validatedData.gold, validatedData.health, validatedData.maxHealth, validatedData.attack, validatedData.defense, userId]
        );

        res.json({
            success: true,
            message: '游戏数据保存成功'
        });

    } catch (error) {
        console.error('保存游戏数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取背包物品
router.get('/inventory', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const inventory = await query(
            'SELECT item_name, quantity FROM inventory WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json({
            success: true,
            data: inventory
        });

    } catch (error) {
        console.error('获取背包错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 添加物品到背包
router.post('/inventory', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemName, quantity = 1 } = req.body;

        if (!itemName || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: '物品信息格式错误'
            });
        }

        // 检查物品是否已存在
        const existingItem = await query(
            'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ?',
            [userId, itemName]
        );

        if (existingItem.length > 0) {
            // 更新数量
            await query(
                'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
                [quantity, existingItem[0].id]
            );
        } else {
            // 添加新物品
            await query(
                'INSERT INTO inventory (user_id, item_name, quantity) VALUES (?, ?, ?)',
                [userId, itemName, quantity]
            );
        }

        res.json({
            success: true,
            message: '物品添加成功'
        });

    } catch (error) {
        console.error('添加物品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 使用物品
router.put('/inventory/use', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemName, quantity = 1 } = req.body;

        if (!itemName || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: '物品信息格式错误'
            });
        }

        // 检查物品数量
        const [item] = await query(
            'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ?',
            [userId, itemName]
        );

        if (!item || item.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: '物品数量不足'
            });
        }

        // 使用物品
        if (item.quantity === quantity) {
            // 删除物品
            await query(
                'DELETE FROM inventory WHERE id = ?',
                [item.id]
            );
        } else {
            // 减少数量
            await query(
                'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
                [quantity, item.id]
            );
        }

        // 处理物品效果（这里以治疗药水为例）
        if (itemName === '治疗药水') {
            await query(
                'UPDATE game_data SET health = max_health WHERE user_id = ?',
                [userId]
            );
        }

        res.json({
            success: true,
            message: '物品使用成功'
        });

    } catch (error) {
        console.error('使用物品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 记录战斗日志
router.post('/battle-log', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { enemyName, result, expGained, goldGained } = req.body;

        if (!enemyName || !result || typeof expGained !== 'number' || typeof goldGained !== 'number') {
            return res.status(400).json({
                success: false,
                message: '战斗日志数据格式错误'
            });
        }

        await query(
            'INSERT INTO battle_logs (user_id, enemy_name, result, exp_gained, gold_gained) VALUES (?, ?, ?, ?, ?)',
            [userId, enemyName, result, expGained, goldGained]
        );

        res.json({
            success: true,
            message: '战斗日志记录成功'
        });

    } catch (error) {
        console.error('记录战斗日志错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取战斗历史
router.get('/battle-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // 获取总记录数
        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM battle_logs WHERE user_id = ?',
            [userId]
        );

        const total = countResult.total;

        // 获取分页数据
        const battleLogs = await query(
            `SELECT enemy_name, result, exp_gained, gold_gained, battle_time
             FROM battle_logs 
             WHERE user_id = ? 
             ORDER BY battle_time DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: {
                logs: battleLogs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('获取战斗历史错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取排行榜
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const leaderboard = await query(
            `SELECT u.username, g.level, g.exp, g.gold
             FROM users u
             JOIN game_data g ON u.id = g.user_id
             ORDER BY g.level DESC, g.exp DESC
             LIMIT ?`,
            [limit]
        );

        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        console.error('获取排行榜错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router; 