const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入数据库配置
const { initDatabase } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// 跨域配置
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 速率限制
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    }
});
app.use(limiter);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static('public'));

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// 根路径 - 登录界面
app.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>挂机游戏 - 登录</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            width: 100%;
            max-width: 400px;
            padding: 20px;
        }

        .login-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .auth-container {
            display: flex;
            gap: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        .auth-section {
            flex: 1;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            display: none;
        }

        .auth-section.active {
            display: block;
        }

        .auth-section h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2em;
        }

        .auth-form {
            margin-bottom: 20px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 0.9em;
        }

        .form-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .auth-btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        }

        .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .register-btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }

        .register-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
        }

        .switch-text {
            text-align: center;
            margin-top: 20px;
        }

        .switch-text a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .switch-text a:hover {
            text-decoration: underline;
        }

        .login-header h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .login-header p {
            color: #666;
            font-size: 1.1em;
        }

        .auth-container {
            display: flex;
            gap: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        .auth-section {
            flex: 1;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            display: none;
        }

        .auth-section.active {
            display: block;
        }

        .auth-section h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2em;
        }

        .auth-form {
            margin-bottom: 20px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 0.9em;
        }

        .form-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .auth-btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 10px;
        }

        .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .register-btn {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }

        .register-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
        }

        .switch-text {
            text-align: center;
            margin-top: 20px;
        }

        .switch-text a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }

        .switch-text a:hover {
            text-decoration: underline;
        }

        .message {
            text-align: center;
            padding: 10px;
            border-radius: 8px;
            margin-top: 20px;
            font-weight: 600;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .message.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }

        .api-info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 15px;
            text-align: center;
        }

        .api-info h3 {
            color: #667eea;
            margin-bottom: 15px;
        }

        .api-info p {
            color: #666;
            font-size: 0.9em;
            line-height: 1.5;
        }

        @media (max-width: 480px) {
            .container {
                padding: 10px;
            }
            
            .login-container {
                padding: 30px 20px;
            }
            
            .login-header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="login-header">
            <h1>挂机游戏</h1>
            <p>开始你的冒险之旅</p>
        </div>
        
        <div class="auth-container">
            <!-- 登录界面 -->
            <div id="loginSection" class="auth-section active">
                <h2>登录</h2>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginUsername">用户名</label>
                        <input type="text" id="loginUsername" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">密码</label>
                        <input type="password" id="loginPassword" name="password" required>
                    </div>
                    
                    <button type="submit" class="auth-btn login-btn">登录</button>
                </form>
                
                <p class="switch-text">
                    还没有账号？<a href="#" id="switchToRegisterLink">立即注册</a>
                </p>
            </div>

            <!-- 注册界面 -->
            <div id="registerSection" class="auth-section">
                <h2>注册</h2>
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="registerUsername">用户名</label>
                        <input type="text" id="registerUsername" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerEmail">邮箱</label>
                        <input type="email" id="registerEmail" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="registerPassword">密码</label>
                        <input type="password" id="registerPassword" name="password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">确认密码</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>
                    
                    <button type="submit" class="auth-btn register-btn">注册</button>
                </form>
                
                <p class="switch-text">
                    已有账号？<a href="#" id="switchToLoginLink">立即登录</a>
                </p>
            </div>
        </div>
        
        <div id="message" class="message"></div>

        <div class="api-info">
            <h3>🔧 后台服务信息</h3>
            <p>服务器运行时间: ${Math.floor(process.uptime())} 秒</p>
            <p>API地址: http://localhost:5555</p>
            <p>健康检查: <a href="/health" style="color: #667eea;">/health</a></p>
            <p>✅ 注册和登录完全由后台API处理</p>
            <p>✅ 数据存储在MySQL数据库中</p>
            <p>✅ 支持多用户系统</p>
        </div>
    </div>

    <script src="/auth.js"></script>
</body>
</html>`;
    
    res.send(html);
});

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 游戏页面路由
app.get('/game', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>挂机游戏 - 主界面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            color: #333;
        }

        .game-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        /* 顶部导航栏 */
        .game-header {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .user-info span {
            font-weight: 600;
            color: #333;
        }

        .level {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
        }

        .game-stats {
            display: flex;
            gap: 20px;
        }

        .stat {
            background: #f8f9fa;
            padding: 8px 15px;
            border-radius: 15px;
            font-weight: 600;
            color: #495057;
        }

        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            background: #c82333;
            transform: translateY(-2px);
        }

        /* 主要内容区域 */
        .game-main {
            display: flex;
            flex: 1;
            gap: 20px;
            padding: 20px;
            overflow: hidden;
        }

        /* 左侧游戏区域 */
        .game-area {
            flex: 2;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .character-info, .battle-area {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .character-info h2, .battle-area h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }

        .character-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .stat-item label {
            font-weight: 600;
            color: #495057;
        }

        .stat-item span {
            font-weight: 700;
            color: #28a745;
        }

        /* 战斗区域 */
        .enemy-info {
            margin-bottom: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px solid #e9ecef;
        }

        .enemy-name {
            font-size: 1.3em;
            font-weight: 700;
            color: #dc3545;
            margin-bottom: 15px;
            text-align: center;
        }

        .enemy-stats {
            display: flex;
            justify-content: space-around;
            gap: 20px;
        }

        .enemy-stats span {
            font-weight: 600;
            color: #495057;
        }

        .battle-controls {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .battle-btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1em;
        }

        .battle-btn:first-child {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }

        .battle-btn:last-child {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
        }

        .battle-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .battle-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* 右侧控制面板 */
        .control-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .upgrade-section, .inventory-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .upgrade-section h3, .inventory-section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }

        .upgrade-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }

        .upgrade-item label {
            display: block;
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
        }

        .upgrade-btn {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .upgrade-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .upgrade-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        /* 背包系统 */
        .inventory-items {
            min-height: 200px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .empty-inventory {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 40px 20px;
        }

        .inventory-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #e9ecef;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }

        .item-name {
            font-weight: 600;
            color: #495057;
        }

        .item-quantity {
            background: #007bff;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            font-weight: 600;
        }

        /* 底部状态栏 */
        .game-footer {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            text-align: center;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .status-message {
            color: #495057;
            font-weight: 600;
            font-size: 1.1em;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .game-main {
                flex-direction: column;
                padding: 15px;
            }
            
            .game-header {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .game-stats {
                justify-content: center;
            }
            
            .character-stats {
                grid-template-columns: 1fr;
            }
            
            .enemy-stats {
                flex-direction: column;
                gap: 10px;
            }
            
            .battle-controls {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- 顶部导航栏 -->
        <header class="game-header">
            <div class="user-info">
                <span id="username">玩家</span>
                <span class="level">等级: <span id="userLevel">1</span></span>
            </div>
            <div class="game-stats">
                <span class="stat">经验: <span id="userExp">0</span></span>
                <span class="stat">金币: <span id="userGold">100</span></span>
            </div>
                                <button class="logout-btn" id="logoutBtn">退出登录</button>
        </header>

        <!-- 主要内容区域 -->
        <main class="game-main">
            <!-- 左侧游戏区域 -->
            <div class="game-area">
                <div class="character-info">
                    <h2>角色信息</h2>
                    <div class="character-stats">
                        <div class="stat-item">
                            <label>生命值:</label>
                            <span id="health">100/100</span>
                        </div>
                        <div class="stat-item">
                            <label>攻击力:</label>
                            <span id="attack">10</span>
                        </div>
                        <div class="stat-item">
                            <label>防御力:</label>
                            <span id="defense">5</span>
                        </div>
                    </div>
                </div>

                <div class="battle-area">
                    <h2>战斗区域</h2>
                    <div class="enemy-info">
                        <div class="enemy-name" id="enemyName">等待怪物出现...</div>
                        <div class="enemy-stats">
                            <span>生命值: <span id="enemyHealth">0/0</span></span>
                            <span>攻击力: <span id="enemyAttack">0</span></span>
                        </div>
                    </div>
                    <div class="battle-controls">
                        <button id="startBattle" class="battle-btn">开始战斗</button>
                        <button id="stopBattle" class="battle-btn" disabled>停止战斗</button>
                    </div>
                </div>
            </div>

            <!-- 右侧控制面板 -->
            <div class="control-panel">
                <div class="upgrade-section">
                    <h3>升级系统</h3>
                    <div class="upgrade-item">
                        <label>攻击力升级</label>
                        <button id="upgradeAttackBtn" class="upgrade-btn">升级 (花费: 50金币)</button>
                    </div>
                    <div class="upgrade-item">
                        <label>防御力升级</label>
                        <button id="upgradeDefenseBtn" class="upgrade-btn">升级 (花费: 50金币)</button>
                    </div>
                    <div class="upgrade-item">
                        <label>生命值升级</label>
                        <button id="upgradeHealthBtn" class="upgrade-btn">升级 (花费: 50金币)</button>
                    </div>
                </div>

                <div class="inventory-section">
                    <h3>背包</h3>
                    <div class="inventory-items" id="inventory">
                        <div class="empty-inventory">背包空空如也</div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部状态栏 -->
        <footer class="game-footer">
            <div class="status-message" id="statusMessage">欢迎来到挂机游戏！</div>
        </footer>
    </div>

    <script src="/game.js"></script>





                





</body>
</html>`;
    
    res.send(html);
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    // 数据库连接错误
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            message: '数据库连接失败，请检查数据库服务'
        });
    }
    
    // 数据库查询错误
    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: '数据库表不存在，请检查数据库初始化'
        });
    }
    
    // 默认错误响应
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : '未知错误'
    });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

// 启动服务器
async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();
        
        // 启动HTTP服务器
        const server = app.listen(PORT, () => {
            console.log('🚀 挂机游戏服务器启动成功!');
            console.log(`📍 服务器地址: http://localhost:${PORT}`);
            console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
            console.log('📊 API接口:');
            console.log(`   - 健康检查: GET /health`);
            console.log(`   - 用户认证: POST /api/auth/login, POST /api/auth/register`);
            console.log(`   - 游戏数据: GET /api/game/data, PUT /api/game/data`);
            console.log(`   - 背包系统: GET /api/game/inventory, POST /api/game/inventory`);
            console.log(`   - 排行榜: GET /api/game/leaderboard`);
        });
        
    } catch (error) {
        console.error('❌ 服务器启动失败:', error.message);
        process.exit(1);
    }
}

// 启动服务器
startServer(); 