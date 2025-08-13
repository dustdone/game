// 用户认证管理
class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        // 检查本地存储中是否有用户信息
        const savedUser = localStorage.getItem('gameUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;
                this.redirectToGame();
            } catch (e) {
                localStorage.removeItem('gameUser');
            }
        }

        // 绑定登录表单事件
        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.showMessage('请填写用户名和密码', 'error');
            return;
        }

        try {
            // 模拟登录验证（实际项目中应该调用后端API）
            const success = await this.validateUser(username, password);
            
            if (success) {
                this.currentUser = {
                    username: username,
                    level: 1,
                    exp: 0,
                    gold: 100,
                    health: 100,
                    maxHealth: 100,
                    attack: 10,
                    defense: 5,
                    lastLogin: new Date().toISOString(),
                    inventory: []
                };
                
                this.isLoggedIn = true;
                localStorage.setItem('gameUser', JSON.stringify(this.currentUser));
                
                this.showMessage('登录成功！正在跳转...', 'success');
                setTimeout(() => {
                    this.redirectToGame();
                }, 1000);
            } else {
                this.showMessage('用户名或密码错误', 'error');
            }
        } catch (error) {
            this.showMessage('登录失败，请重试', 'error');
        }
    }

    async validateUser(username, password) {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 简单的用户验证逻辑（实际项目中应该查询数据库）
        const validUsers = [
            { username: 'admin', password: 'admin123' },
            { username: 'test', password: 'test123' },
            { username: 'player', password: 'player123' }
        ];
        
        return validUsers.some(user => 
            user.username === username && user.password === password
        );
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
            
            // 3秒后自动隐藏消息
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }, 3000);
        }
    }

    redirectToGame() {
        // 跳转到游戏主页面
        window.location.href = 'game.html';
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('gameUser');
        window.location.href = 'index.html';
    }
}

// 注册功能
function showRegister() {
    // 创建注册表单
    const loginContainer = document.querySelector('.login-container');
    const loginForm = document.querySelector('.login-form');
    
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    
    const registerForm = document.createElement('div');
    registerForm.className = 'register-form';
    registerForm.innerHTML = `
        <div class="form-group">
            <label for="regUsername">用户名</label>
            <input type="text" id="regUsername" name="regUsername" required>
        </div>
        
        <div class="form-group">
            <label for="regPassword">密码</label>
            <input type="password" id="regPassword" name="regPassword" required>
        </div>
        
        <div class="form-group">
            <label for="regConfirmPassword">确认密码</label>
            <input type="password" id="regConfirmPassword" name="regConfirmPassword" required>
        </div>
        
        <div class="form-group">
            <button type="button" class="login-btn" onclick="handleRegister()">注册</button>
        </div>
        
        <div class="form-group">
            <button type="button" class="register-btn" onclick="showLogin()">返回登录</button>
        </div>
    `;
    
    loginContainer.appendChild(registerForm);
}

function showLogin() {
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    
    if (registerForm) {
        registerForm.remove();
    }
}

function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    
    if (!username || !password || !confirmPassword) {
        authManager.showMessage('请填写所有字段', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        authManager.showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        authManager.showMessage('密码长度至少6位', 'error');
        return;
    }
    
    // 模拟注册成功
    authManager.showMessage('注册成功！请使用新账号登录', 'success');
    setTimeout(() => {
        showLogin();
    }, 2000);
}

// 初始化认证管理器
const authManager = new AuthManager(); 