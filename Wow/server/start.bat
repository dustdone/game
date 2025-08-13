@echo off
chcp 65001 >nul
echo 🚀 正在启动挂机游戏服务器...

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm，请先安装npm
    pause
    exit /b 1
)

REM 检查.env文件是否存在
if not exist .env (
    echo ⚠️  警告: 未找到.env配置文件，将使用默认配置
    echo 📝 请复制env.example为.env并修改数据库配置
)

echo 📦 正在安装依赖包...
call npm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

echo 🌐 正在启动服务器...
call npm start

pause 