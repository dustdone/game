// 切换登录/注册界面
function switchToRegister() {
    console.log('切换到注册界面');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    
    if (loginSection && registerSection) {
        loginSection.classList.remove('active');
        registerSection.classList.add('active');
        console.log('切换完成');
    } else {
        console.error('找不到界面元素:', { loginSection, registerSection });
    }
}

function switchToLogin() {
    console.log('切换到登录界面');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    
    if (loginSection && registerSection) {
        registerSection.classList.remove('active');
        loginSection.classList.add('active');
        console.log('切换完成');
    } else {
        console.error('找不到界面元素:', { loginSection, registerSection });
    }
}

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

        // 绑定表单事件
        this.bindEvents();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            this.showMessage('请填写用户名和密码', 'error');
            return;
        }

        try {
            // 显示加载状态
            this.showMessage('正在登录...', 'info');
            
            // 调用后台API进行登录
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = {
                    username: data.data.user.username,
                    id: data.data.user.id,
                    token: data.data.token
                };
                
                this.isLoggedIn = true;
                localStorage.setItem('gameUser', JSON.stringify(this.currentUser));
                
                this.showMessage('登录成功！正在跳转...', 'success');
                setTimeout(() => {
                    this.redirectToGame();
                }, 1000);
            } else {
                this.showMessage(data.message || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showMessage('登录失败，请重试', 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('请填写所有字段', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('两次输入的密码不一致', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('密码长度至少6位', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }
        
        try {
            // 显示加载状态
            this.showMessage('正在注册...', 'info');
            
            // 调用后台API进行注册
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('注册成功！请使用新账号登录', 'success');
                // 清空表单
                document.getElementById('registerForm').reset();
                // 切换到登录界面
                setTimeout(() => {
                    switchToLogin();
                }, 2000);
            } else {
                this.showMessage(data.message || '注册失败', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showMessage('注册失败，请重试', 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
        window.location.href = '/game';
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('gameUser');
        window.location.href = '/';
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    
    console.log('界面元素状态:', {
        loginSection: loginSection,
        registerSection: registerSection,
        loginSectionClasses: loginSection ? loginSection.className : 'null',
        registerSectionClasses: registerSection ? registerSection.className : 'null'
    });
    
    // 绑定切换链接的事件监听器
    const switchToRegisterLink = document.getElementById('switchToRegisterLink');
    const switchToLoginLink = document.getElementById('switchToLoginLink');
    
    if (switchToRegisterLink) {
        switchToRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击了立即注册链接');
            switchToRegister();
        });
    }
    
    if (switchToLoginLink) {
        switchToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击了立即登录链接');
            switchToLogin();
        });
    }
    
    // 初始化认证管理器
    const authManager = new AuthManager();
    
    // 测试切换函数
    window.testSwitch = function() {
        console.log('测试切换函数');
        switchToRegister();
    };
}); 