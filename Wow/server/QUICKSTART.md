# 🚀 快速启动指南

## 5分钟快速启动

### 1. 环境准备
确保已安装：
- ✅ Node.js 16+
- ✅ MySQL 8.0+
- ✅ npm 8+

### 2. 启动MySQL
```bash
# Windows
net start mysql

# Linux/Mac
sudo systemctl start mysql
# 或
sudo service mysql start
```

### 3. 配置数据库
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库（可选，程序会自动创建）
CREATE DATABASE IF NOT EXISTS idle_game;
```

### 4. 配置环境变量
```bash
# 复制配置文件
cp env.example .env

# 编辑配置文件（修改数据库密码）
# Windows: notepad .env
# Mac/Linux: nano .env
```

### 5. 启动服务器
```bash
# 使用启动脚本（推荐）
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh

# 或手动启动
npm install
npm start
```

### 6. 验证启动
访问：http://localhost:3000/health

应该看到：
```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🔧 常见问题快速解决

### 问题1: 端口被占用
```bash
# 查看端口占用
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# 杀死进程
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### 问题2: 数据库连接失败
```bash
# 检查MySQL状态
sudo systemctl status mysql

# 重启MySQL
sudo systemctl restart mysql
```

### 问题3: 权限不足
```bash
# 修改脚本权限
chmod +x start.sh

# 检查文件权限
ls -la
```

## 📱 测试API接口

### 1. 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

### 2. 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

### 3. 获取游戏数据
```bash
curl -X GET http://localhost:3000/api/game/data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🌐 远程访问配置

### 1. 修改MySQL配置
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
bind-address = 0.0.0.0
```

### 2. 重启MySQL
```bash
sudo systemctl restart mysql
```

### 3. 创建远程用户
```sql
CREATE USER 'game_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON idle_game.* TO 'game_user'@'%';
FLUSH PRIVILEGES;
```

### 4. 修改.env文件
```env
DB_HOST=0.0.0.0
DB_USER=game_user
DB_PASSWORD=your_password
```

### 5. 开放防火墙端口
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 3306

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload
```

## 📊 监控和日志

### 查看服务器日志
```bash
# 实时查看日志
tail -f logs/server.log

# 查看错误日志
grep ERROR logs/server.log
```

### 健康检查
```bash
# 检查服务器状态
curl http://localhost:3000/health

# 检查数据库连接
curl http://localhost:3000/api/game/data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 下一步

1. **集成前端**: 修改前端代码，连接后台API
2. **添加功能**: 扩展游戏功能，如商店、任务等
3. **部署上线**: 使用PM2、Docker等工具部署到生产环境
4. **监控告警**: 添加日志监控和性能监控

## 📞 获取帮助

- 📖 查看完整文档: `README.md`
- 🐛 报告问题: 提交Issue
- 💡 贡献代码: 提交Pull Request
- 📧 联系支持: 发送邮件

---

**祝您使用愉快！** 🎮✨ 