// 游戏核心逻辑
class GameManager {
    constructor() {
        console.log('GameManager构造函数开始');
        this.isRunning = false;
        this.battleInterval = null;
        this.gameData = null;
        this.enemies = [
            { name: '小野猪', health: 50, maxHealth: 50, attack: 8, exp: 10, gold: 5 },
            { name: '森林狼', health: 80, maxHealth: 80, attack: 12, exp: 15, gold: 8 },
            { name: '山贼', health: 120, maxHealth: 120, attack: 18, exp: 25, gold: 12 },
            { name: '巨魔', health: 200, maxHealth: 200, attack: 25, exp: 40, gold: 20 },
            { name: '龙', health: 500, maxHealth: 500, attack: 40, exp: 100, gold: 50 }
        ];
        this.currentEnemy = null;
        
        console.log('GameManager构造函数完成，enemies:', this.enemies);
        // 异步初始化
        this.init().catch(error => {
            console.error('GameManager初始化失败:', error);
        });
    }

    async init() {
        console.log('GameManager.init() 开始');
        console.log('this.enemies:', this.enemies);
        
        // 检查用户登录状态
        this.checkAuth();
        
        // 等待游戏数据初始化完成
        await this.initGameData();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新界面
        this.updateUI();
        
        // 生成第一个怪物
        console.log('准备生成怪物，this.enemies:', this.enemies);
        console.log('当前gameData状态:', this.gameData);
        
        // 确保游戏数据已初始化
        if (this.gameData && this.gameData.level) {
            this.generateEnemy();
        } else {
            console.error('游戏数据未正确初始化，跳过生成怪物');
        }
        
        console.log('GameManager.init() 完成');
    }

    checkAuth() {
        const savedUser = localStorage.getItem('gameUser');
        if (!savedUser) {
            window.location.href = '/';
            return;
        }
        
        try {
            this.gameData = JSON.parse(savedUser);
            console.log('从localStorage获取的gameData:', this.gameData);
        } catch (e) {
            localStorage.removeItem('gameUser');
            window.location.href = '/';
        }
    }

    async initGameData() {
        console.log('initGameData开始，当前gameData:', this.gameData);
        
        try {
            // 从后台API获取游戏数据
            console.log('尝试从后台API获取游戏数据...');
            const response = await fetch('/api/game/data', {
                headers: {
                    'Authorization': 'Bearer ' + this.gameData.token
                }
            });

            console.log('API响应状态:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('API响应数据:', data);
                if (data.success) {
                    this.gameData = { ...this.gameData, ...data.data };
                    console.log('从后台API获取的游戏数据:', data.data);
                } else {
                    console.log('API返回失败:', data.message);
                }
            } else {
                console.log('API请求失败，状态码:', response.status);
            }
        } catch (error) {
            console.error('获取游戏数据失败:', error);
        }

        // 确保游戏数据有默认值
        console.log('检查是否需要设置默认游戏数据，当前level:', this.gameData.level);
        
        // 设置默认值，确保所有必要字段都存在
        this.gameData = {
            level: 1,
            exp: 0,
            gold: 100,
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5,
            ...this.gameData // 用API数据覆盖默认值
        };
        
        console.log('设置默认数据后的gameData:', this.gameData);
        
        // 计算升级所需经验
        this.gameData.expToNextLevel = this.calculateExpToNextLevel();
        
        console.log('初始化后的完整gameData:', this.gameData);
        console.log('initGameData完成');
        
        // 验证所有必要字段
        this.validateGameData();
    }

    bindEvents() {
        const startBtn = document.getElementById('startBattle');
        const stopBtn = document.getElementById('stopBattle');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startBattle());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopBattle());
        }
        
        // 添加调试信息
        console.log('绑定事件完成:', {
            startBtn: startBtn,
            stopBtn: stopBtn
        });
    }

    startBattle() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('startBattle').textContent = '停止战斗';
        document.getElementById('startBattle').className = 'btn btn-danger';
        
        this.battleInterval = setInterval(() => {
            this.battleRound();
        }, 1000);
        
        this.updateStatus('战斗开始！');
    }

    stopBattle() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.battleInterval);
        this.battleInterval = null;
        
        document.getElementById('startBattle').textContent = '开始战斗';
        document.getElementById('startBattle').className = 'btn btn-success';
        
        this.updateStatus('战斗已停止');
    }

    battleRound() {
        if (!this.currentEnemy || this.currentEnemy.health <= 0) {
            this.defeatEnemy();
            return;
        }

        // 玩家攻击怪物
        const playerDamage = Math.max(1, this.gameData.attack - this.currentEnemy.defense);
        this.currentEnemy.health = Math.max(0, this.currentEnemy.health - playerDamage);
        
        // 怪物攻击玩家
        if (this.currentEnemy.health > 0) {
            const enemyDamage = Math.max(1, this.currentEnemy.attack - this.gameData.defense);
            this.gameData.health = Math.max(0, this.gameData.health - enemyDamage);
            
            if (this.gameData.health <= 0) {
                this.playerDeath();
                return;
            }
        }

        // 更新界面
        this.updateUI();
        this.updateEnemyUI();
    }

    defeatEnemy() {
        // 获得奖励
        this.gameData.exp += this.currentEnemy.exp;
        this.gameData.gold += this.currentEnemy.gold;
        
        // 随机掉落物品
        if (Math.random() < 0.3) {
            const items = ['生命药水', '力量药水', '防御药水', '经验药水'];
            const randomItem = items[Math.floor(Math.random() * items.length)];
            this.addItemToInventory(randomItem, 1);
        }
        
        this.updateStatus(`击败了${this.currentEnemy.name}！获得${this.currentEnemy.exp}经验和${this.currentEnemy.gold}金币`);
        
        // 检查升级
        this.checkLevelUp();
        
        // 生成新怪物
        this.generateEnemy();
        
        // 保存游戏数据
        this.saveGameData();
    }

    playerDeath() {
        this.stopBattle();
        this.gameData.health = this.gameData.maxHealth;
        this.gameData.gold = Math.max(0, this.gameData.gold - 20);
        
        this.updateStatus('你被击败了！损失了一些金币，生命值已恢复');
        
        // 保存游戏数据
        this.saveGameData();
    }

    generateEnemy() {
        // 安全检查
        if (!this.enemies || !Array.isArray(this.enemies) || this.enemies.length === 0) {
            console.error('enemies数组未定义或为空:', this.enemies);
            return;
        }
        
        if (!this.gameData || !this.gameData.level) {
            console.error('gameData未定义或缺少level:', this.gameData);
            return;
        }
        
        // 根据玩家等级选择怪物
        const enemyIndex = Math.min(
            Math.floor(this.gameData.level / 2),
            this.enemies.length - 1
        );
        
        const enemyTemplate = this.enemies[enemyIndex];
        if (!enemyTemplate) {
            console.error('无法获取怪物模板:', { enemyIndex, enemies: this.enemies });
            return;
        }
        
        this.currentEnemy = {
            name: enemyTemplate.name,
            health: enemyTemplate.maxHealth,
            maxHealth: enemyTemplate.maxHealth,
            attack: enemyTemplate.attack,
            defense: Math.floor(enemyTemplate.attack * 0.3),
            exp: enemyTemplate.exp,
            gold: enemyTemplate.gold
        };
        
        console.log('生成怪物成功:', this.currentEnemy);
        this.updateEnemyUI();
    }

    checkLevelUp() {
        if (this.gameData.exp >= this.gameData.expToNextLevel) {
            this.gameData.level++;
            this.gameData.exp -= this.gameData.expToNextLevel;
            this.gameData.expToNextLevel = this.calculateExpToNextLevel();
            
            // 升级奖励
            this.gameData.maxHealth += 20;
            this.gameData.health = this.gameData.maxHealth;
            this.gameData.attack += 5;
            this.gameData.defense += 3;
            this.gameData.gold += 50;
            
            this.updateStatus(`恭喜升级！当前等级：${this.gameData.level}`);
            
            // 保存游戏数据
            this.saveGameData();
        }
    }

    calculateExpToNextLevel() {
        return this.gameData.level * 100;
    }

    addItemToInventory(itemName, quantity) {
        const existingItem = this.gameData.inventory ? this.gameData.inventory.find(item => item.name === itemName) : null;
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            if (!this.gameData.inventory) this.gameData.inventory = [];
            this.gameData.inventory.push({ name: itemName, quantity: quantity });
        }
        
        this.updateInventoryUI();
    }

    validateGameData() {
        console.log('🔍 验证游戏数据完整性...');
        const requiredFields = ['level', 'exp', 'gold', 'health', 'maxHealth', 'attack', 'defense'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (typeof this.gameData[field] === 'undefined') {
                missingFields.push(field);
                console.warn(`⚠️ 缺失字段: ${field}`);
            } else {
                console.log(`✅ ${field}: ${this.gameData[field]}`);
            }
        });
        
        if (missingFields.length > 0) {
            console.error(`❌ 游戏数据不完整，缺失字段: ${missingFields.join(', ')}`);
            // 自动修复缺失字段
            this.fixMissingGameData(missingFields);
        } else {
            console.log('🎉 游戏数据完整性验证通过！');
        }
    }

    fixMissingGameData(missingFields) {
        console.log('🔧 开始修复缺失的游戏数据...');
        const defaultValues = {
            level: 1,
            exp: 0,
            gold: 100,
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5
        };
        
        missingFields.forEach(field => {
            if (defaultValues[field] !== undefined) {
                this.gameData[field] = defaultValues[field];
                console.log(`🔧 修复字段 ${field}: ${defaultValues[field]}`);
            }
        });
        
        console.log('修复后的游戏数据:', this.gameData);
    }

    validateHealthData() {
        console.log('🔍 验证生命值数据一致性...');
        
        const healthElement = document.getElementById('health');
        const currentHealth = this.gameData.health;
        const currentMaxHealth = this.gameData.maxHealth;
        
        console.log('数据状态:', {
            gameDataHealth: currentHealth,
            gameDataMaxHealth: currentMaxHealth,
            uiDisplay: healthElement ? healthElement.textContent : '元素未找到'
        });
        
        // 检查数据一致性
        if (currentHealth > currentMaxHealth) {
            console.warn('⚠️ 当前生命值超过最大生命值，自动修正');
            this.gameData.health = currentMaxHealth;
        }
        
        if (currentMaxHealth < 100) {
            console.warn('⚠️ 最大生命值异常低，自动修正');
            this.gameData.maxHealth = Math.max(100, currentMaxHealth);
        }
        
        // 重新更新UI
        if (healthElement) {
            healthElement.textContent = `${this.gameData.health}/${this.gameData.maxHealth}`;
            console.log('UI已重新更新，新的生命值显示:', healthElement.textContent);
        }
    }

    async saveGameData() {
        try {
            // 确保所有值都不是undefined
            const gameDataToSave = {
                level: this.gameData.level || 1,
                exp: this.gameData.exp || 0,
                gold: this.gameData.gold || 100,
                health: this.gameData.health || 100,
                maxHealth: this.gameData.maxHealth || 100,
                attack: this.gameData.attack || 10,
                defense: this.gameData.defense || 5
            };
            
            console.log('准备保存的游戏数据:', gameDataToSave);
            
            // 保存到后台API
            const response = await fetch('/api/game/data', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.gameData.token
                },
                body: JSON.stringify(gameDataToSave)
            });
            
            if (response.ok) {
                console.log('游戏数据保存成功');
            } else {
                console.error('保存游戏数据失败，状态码:', response.status);
                const errorData = await response.json();
                console.error('错误详情:', errorData);
            }
        } catch (error) {
            console.error('保存游戏数据失败:', error);
        }
    }

    updateUI() {
        console.log('更新UI - 开始');
        // 更新玩家信息 - 使用正确的HTML元素ID
        const usernameElement = document.getElementById('username');
        const levelElement = document.getElementById('userLevel');
        const expElement = document.getElementById('userExp');
        const goldElement = document.getElementById('userGold');
        const healthElement = document.getElementById('health');
        const attackElement = document.getElementById('attack');
        const defenseElement = document.getElementById('defense');
        
        console.log('找到的HTML元素:', {
            username: usernameElement,
            level: levelElement,
            exp: expElement,
            gold: goldElement,
            health: healthElement,
            attack: attackElement,
            defense: defenseElement
        });
        
        if (usernameElement) usernameElement.textContent = this.gameData.username;
        if (levelElement) levelElement.textContent = this.gameData.level;
        if (expElement) expElement.textContent = `${this.gameData.exp}/${this.gameData.expToNextLevel}`;
        if (goldElement) goldElement.textContent = this.gameData.gold;
        if (healthElement) healthElement.textContent = `${this.gameData.health}/${this.gameData.maxHealth || 100}`;
        if (attackElement) attackElement.textContent = this.gameData.attack;
        if (defenseElement) defenseElement.textContent = this.gameData.defense;
        
        console.log('UI更新完成，当前游戏数据:', {
            username: this.gameData.username,
            level: this.gameData.level,
            exp: this.gameData.exp,
            gold: this.gameData.gold,
            health: this.gameData.health,
            maxHealth: this.gameData.maxHealth,
            attack: this.gameData.attack,
            defense: this.gameData.defense
        });
        
        // 更新进度条
        const healthBar = document.getElementById('healthBar');
        if (healthBar) {
            const maxHealth = this.gameData.maxHealth || 100;
            const healthPercent = (this.gameData.health / maxHealth) * 100;
            healthBar.style.width = healthPercent + '%';
            healthBar.className = `progress-bar ${healthPercent > 50 ? 'bg-success' : healthPercent > 25 ? 'bg-warning' : 'bg-danger'}`;
        }
        
        const expBar = document.getElementById('expBar');
        if (expBar) {
            const expPercent = (this.gameData.exp / this.gameData.expToNextLevel) * 100;
            expBar.style.width = expPercent + '%';
        }
    }

    updateEnemyUI() {
        if (!this.currentEnemy) return;
        
        // 添加空值检查
        const enemyNameElement = document.getElementById('enemyName');
        const enemyHealthElement = document.getElementById('enemyHealth');
        const enemyAttackElement = document.getElementById('enemyAttack');
        const enemyDefenseElement = document.getElementById('enemyDefense');
        
        if (enemyNameElement) enemyNameElement.textContent = this.currentEnemy.name;
        if (enemyHealthElement) enemyHealthElement.textContent = `${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`;
        if (enemyAttackElement) enemyAttackElement.textContent = this.currentEnemy.attack;
        if (enemyDefenseElement) enemyDefenseElement.textContent = this.currentEnemy.defense;
        
        // 更新怪物血条
        const enemyHealthBar = document.getElementById('enemyHealthBar');
        if (enemyHealthBar) {
            const healthPercent = (this.currentEnemy.health / this.currentEnemy.maxHealth) * 100;
            enemyHealthBar.style.width = healthPercent + '%';
            enemyHealthBar.className = `progress-bar ${healthPercent > 50 ? 'bg-success' : healthPercent > 25 ? 'bg-warning' : 'bg-danger'}`;
        }
    }

    updateInventoryUI() {
        const inventoryList = document.getElementById('inventoryList');
        if (!inventoryList) return;
        
        inventoryList.innerHTML = '';
        
        if (this.gameData.inventory && this.gameData.inventory.length > 0) {
            this.gameData.inventory.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.innerHTML = `
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                `;
                inventoryList.appendChild(itemElement);
            });
        } else {
            inventoryList.innerHTML = '<p class="text-muted">背包是空的</p>';
        }
    }

    updateStatus(message) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = 'alert alert-info';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, 3000);
        }
    }
}

// 自动保存游戏数据
setInterval(() => {
    if (gameManager && gameManager.gameData) {
        gameManager.saveGameData();
    }
}, 30000); // 每30秒自动保存

// 升级系统函数
function upgradeAttack() {
    console.log('升级攻击力 - 开始');
    if (gameManager && gameManager.gameData && gameManager.gameData.gold >= 50) {
        const oldAttack = gameManager.gameData.attack;
        const oldGold = gameManager.gameData.gold;
        
        gameManager.gameData.gold -= 50;
        gameManager.gameData.attack += 5;
        
        console.log(`升级攻击力 - 成功: ${oldAttack} -> ${gameManager.gameData.attack}, 金币: ${oldGold} -> ${gameManager.gameData.gold}`);
        
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('攻击力升级成功！');
    } else {
        console.log('升级攻击力 - 失败: 金币不足或游戏未初始化');
        alert('金币不足或游戏未初始化！');
    }
}

function upgradeDefense() {
    console.log('升级防御力 - 开始');
    if (gameManager && gameManager.gameData && gameManager.gameData.gold >= 50) {
        const oldDefense = gameManager.gameData.defense;
        const oldGold = gameManager.gameData.gold;
        
        gameManager.gameData.gold -= 50;
        gameManager.gameData.defense += 3;
        
        console.log(`升级防御力 - 成功: ${oldDefense} -> ${gameManager.gameData.defense}, 金币: ${oldGold} -> ${gameManager.gameData.gold}`);
        
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('防御力升级成功！');
    } else {
        console.log('升级防御力 - 失败: 金币不足或游戏未初始化');
        alert('金币不足或游戏未初始化！');
    }
}

function upgradeHealth() {
    console.log('升级生命值 - 开始');
    console.log('升级前的游戏数据:', {
        gold: gameManager?.gameData?.gold,
        maxHealth: gameManager?.gameData?.maxHealth,
        health: gameManager?.gameData?.health
    });
    
    if (gameManager && gameManager.gameData && gameManager.gameData.gold >= 50) {
        const oldMaxHealth = gameManager.gameData.maxHealth || 100;
        const oldHealth = gameManager.gameData.health || 100;
        const oldGold = gameManager.gameData.gold || 100;
        
        // 确保数值有效
        if (typeof oldMaxHealth !== 'number' || typeof oldHealth !== 'number' || typeof oldGold !== 'number') {
            console.error('升级生命值 - 数据类型错误:', {
                maxHealth: typeof oldMaxHealth, oldMaxHealth,
                health: typeof oldHealth, oldHealth,
                gold: typeof oldGold, oldGold
            });
            alert('游戏数据异常，请刷新页面重试！');
            return;
        }
        
        gameManager.gameData.gold = oldGold - 50;
        gameManager.gameData.maxHealth = oldMaxHealth + 30;
        gameManager.gameData.health = gameManager.gameData.maxHealth;
        
        console.log(`升级生命值 - 成功: 最大生命值 ${oldMaxHealth} -> ${gameManager.gameData.maxHealth}, 当前生命值 ${oldHealth} -> ${gameManager.gameData.health}, 金币: ${oldGold} -> ${gameManager.gameData.gold}`);
        
        // 验证升级后的数据
        console.log('升级后的游戏数据:', {
            gold: gameManager.gameData.gold,
            maxHealth: gameManager.gameData.maxHealth,
            health: gameManager.gameData.health
        });
        
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('生命值升级成功！');
        
        // 再次验证UI更新后的数据
        setTimeout(() => {
            console.log('UI更新后的最终数据:', {
                gold: gameManager.gameData.gold,
                maxHealth: gameManager.gameData.maxHealth,
                health: gameManager.gameData.health
            });
            
            // 验证UI是否正确显示
            const healthElement = document.getElementById('health');
            if (healthElement) {
                console.log('UI中的生命值显示:', healthElement.textContent);
            }
            
            // 验证数据一致性
            this.validateHealthData();
        }, 100);
    } else {
        console.log('升级生命值 - 失败: 金币不足或游戏未初始化');
        console.log('当前状态:', {
            gameManager: !!gameManager,
            gameData: !!gameManager?.gameData,
            gold: gameManager?.gameData?.gold
        });
        alert('金币不足或游戏未初始化！');
    }
}

// 退出登录函数
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除本地存储的用户数据
        localStorage.removeItem('gameUser');
        
        // 停止游戏循环
        if (gameManager && gameManager.battleInterval) {
            clearInterval(gameManager.battleInterval);
        }
        
        // 跳转回登录页面
        window.location.href = '/';
    }
}

// 绑定按钮事件
document.addEventListener('DOMContentLoaded', function() {
    // 绑定退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 绑定升级按钮
    const upgradeAttackBtn = document.getElementById('upgradeAttackBtn');
    const upgradeDefenseBtn = document.getElementById('upgradeDefenseBtn');
    const upgradeHealthBtn = document.getElementById('upgradeHealthBtn');
    
    if (upgradeAttackBtn) {
        upgradeAttackBtn.addEventListener('click', upgradeAttack);
    }
    
    if (upgradeDefenseBtn) {
        upgradeDefenseBtn.addEventListener('click', upgradeDefense);
    }
    
    if (upgradeHealthBtn) {
        upgradeHealthBtn.addEventListener('click', upgradeHealth);
    }
    
    console.log('按钮事件绑定完成:', {
        logoutBtn: logoutBtn,
        upgradeAttackBtn: upgradeAttackBtn,
        upgradeDefenseBtn: upgradeDefenseBtn,
        upgradeHealthBtn: upgradeHealthBtn
    });
});

// 初始化游戏
const gameManager = new GameManager(); 