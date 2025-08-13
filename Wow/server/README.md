# 挂机游戏后台服务

基于Node.js + Express + MySQL的挂机游戏后台服务，提供完整的用户认证、游戏数据管理和API接口。

## 🚀 功能特性

### 🔐 用户认证系统
- 用户注册/登录
- JWT令牌认证
- 密码加密存储
- 会话管理

### 🎮 游戏数据管理
- 角色属性管理
- 背包系统
- 战斗日志记录
- 排行榜系统

### 🛡️ 安全特性
- 密码加密（bcrypt）
- JWT令牌验证
- 请求速率限制
- 跨域保护
- 安全头部设置

## 📁 项目结构

```
server/
├── config/
│   └── database.js          # MySQL数据库配置
├── middleware/
│   └── auth.js              # JWT认证中间件
├── routes/
│   ├── auth.js              # 用户认证路由
│   └── game.js              # 游戏数据路由
├── package.json             # 项目依赖配置
├── server.js                # 服务器主文件
├── start.sh                 # Linux/Mac启动脚本
├── start.bat                # Windows启动脚本
├── env.example              # 环境变量配置示例
└── README.md                # 项目说明文档
```

## 🛠️ 环境要求

- **Node.js**: 16.0.0 或更高版本
- **MySQL**: 8.0 或更高版本
- **npm**: 8.0.0 或更高版本

## 📦 安装步骤

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd server
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量配置文件
cp env.example .env

# 编辑.env文件，修改数据库配置
nano .env  # Linux/Mac
# 或
notepad .env  # Windows
```

### 4. 配置MySQL数据库
确保MySQL服务正在运行，并创建数据库用户（可选）：
```sql
CREATE USER 'game_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON idle_game.* TO 'game_user'@'localhost';
FLUSH PRIVILEGES;
```

## ⚙️ 配置说明

### 环境变量配置 (.env)
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=idle_game

# JWT密钥配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 跨域配置
CORS_ORIGIN=http://localhost:5500

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 启动服务

### 使用启动脚本（推荐）
```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

### 手动启动
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## 📊 API接口文档

### 健康检查
```
GET /health
```

### 用户认证
```
POST /api/auth/register    # 用户注册
POST /api/auth/login       # 用户登录
GET  /api/auth/profile     # 获取用户信息
PUT  /api/auth/change-password  # 修改密码
```

### 游戏数据
```
GET  /api/game/data           # 获取游戏数据
PUT  /api/game/data           # 保存游戏数据
GET  /api/game/inventory      # 获取背包物品
POST /api/game/inventory      # 添加物品到背包
PUT  /api/game/inventory/use  # 使用物品
```

### 战斗系统
```
POST /api/game/battle-log     # 记录战斗日志
GET  /api/game/battle-history # 获取战斗历史
GET  /api/game/leaderboard    # 获取排行榜
```

## 🔧 数据库结构

### 用户表 (users)
- `id`: 用户ID（主键）
- `username`: 用户名（唯一）
- `password_hash`: 加密后的密码
- `email`: 邮箱地址
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 游戏数据表 (game_data)
- `id`: 记录ID（主键）
- `user_id`: 用户ID（外键）
- `level`: 角色等级
- `exp`: 当前经验值
- `gold`: 金币数量
- `health`: 当前生命值
- `max_health`: 最大生命值
- `attack`: 攻击力
- `defense`: 防御力
- `last_login`: 最后登录时间

### 背包表 (inventory)
- `id`: 物品ID（主键）
- `user_id`: 用户ID（外键）
- `item_name`: 物品名称
- `quantity`: 物品数量
- `created_at`: 获得时间
- `updated_at`: 更新时间

### 战斗日志表 (battle_logs)
- `id`: 日志ID（主键）
- `user_id`: 用户ID（外键）
- `enemy_name`: 敌人名称
- `result`: 战斗结果（win/lose）
- `exp_gained`: 获得经验
- `gold_gained`: 获得金币
- `battle_time`: 战斗时间

## 🌐 远程连接配置

### 1. 修改MySQL配置
编辑MySQL配置文件 `my.cnf` 或 `my.ini`：
```ini
[mysqld]
bind-address = 0.0.0.0
```

### 2. 创建远程用户
```sql
CREATE USER 'game_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON idle_game.* TO 'game_user'@'%';
FLUSH PRIVILEGES;
```

### 3. 修改环境变量
```env
DB_HOST=your_server_ip
DB_USER=game_user
DB_PASSWORD=your_password
```

### 4. 防火墙配置
```bash
# 开放MySQL端口
sudo ufw allow 3306

# 开放应用端口
sudo ufw allow 3000
```

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查MySQL服务是否运行
- 验证数据库连接信息
- 确认数据库用户权限

#### 2. 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

#### 3. 权限问题
```bash
# 修改脚本权限
chmod +x start.sh

# 检查文件权限
ls -la
```

## 📈 性能优化

### 数据库优化
- 使用连接池管理连接
- 添加适当的索引
- 定期清理日志数据

### 服务器优化
- 启用压缩
- 使用缓存
- 负载均衡

## 🔒 安全建议

1. **修改默认配置**
   - 更改JWT密钥
   - 修改数据库密码
   - 限制数据库访问IP

2. **网络安全**
   - 使用HTTPS
   - 配置防火墙
   - 定期更新依赖

3. **监控日志**
   - 记录访问日志
   - 监控错误日志
   - 设置告警机制

## 📞 技术支持

如有问题或建议，请：
1. 查看错误日志
2. 检查配置文件
3. 提交Issue或Pull Request

## �� 许可证

本项目仅供学习和参考使用。 