const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'idle_game',
    charset: 'utf8mb4',
    timezone: '+08:00',
    // 连接池配置
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// 创建连接池
let pool = null;

// 初始化数据库连接池
async function initDatabase() {
    try {
        // 首先创建数据库（如果不存在）
        const tempPool = mysql.createPool({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            charset: dbConfig.charset
        });

        // 创建数据库
        await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempPool.end();

        // 创建正式连接池
        pool = mysql.createPool(dbConfig);
        
        // 测试连接
        const connection = await pool.getConnection();
        console.log('✅ MySQL数据库连接成功');
        connection.release();

        // 初始化数据表
        await initTables();
        
        return pool;
    } catch (error) {
        console.error('❌ MySQL数据库连接失败:', error.message);
        throw error;
    }
}

// 初始化数据表
async function initTables() {
    try {
        // 用户表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 游戏数据表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS game_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                level INT DEFAULT 1,
                exp INT DEFAULT 0,
                gold INT DEFAULT 100,
                health INT DEFAULT 100,
                max_health INT DEFAULT 100,
                attack INT DEFAULT 10,
                defense INT DEFAULT 5,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 背包物品表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                item_name VARCHAR(100) NOT NULL,
                quantity INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_item_name (item_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 战斗记录表
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS battle_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                enemy_name VARCHAR(100) NOT NULL,
                result ENUM('win', 'lose') NOT NULL,
                exp_gained INT DEFAULT 0,
                gold_gained INT DEFAULT 0,
                battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_battle_time (battle_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ 数据表初始化完成');
    } catch (error) {
        console.error('❌ 数据表初始化失败:', error.message);
        throw error;
    }
}

// 获取连接池
function getPool() {
    if (!pool) {
        throw new Error('数据库连接池未初始化');
    }
    return pool;
}

// 执行查询
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error.message);
        throw error;
    }
}

// 执行事务
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    initDatabase,
    getPool,
    query,
    transaction
}; 