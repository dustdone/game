// 游戏核心逻辑
class GameManager {
    constructor() {
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
        this.init();
    }

    init() {
        // 检查用户登录状态
        this.checkAuth();
        
        // 初始化游戏数据
        this.initGameData();
        
        // 调试信息
        console.log('游戏数据初始化完成:', this.gameData);
        
        // 绑定事件
        this.bindEvents();
        
        // 更新界面
        this.updateUI();
        
        // 生成第一个怪物
        this.generateEnemy();
    }

    checkAuth() {
        const savedUser = localStorage.getItem('gameUser');
        if (!savedUser) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            this.gameData = JSON.parse(savedUser);
        } catch (e) {
            localStorage.removeItem('gameUser');
            window.location.href = 'index.html';
        }
    }

    initGameData() {
        if (!this.gameData) {
            this.gameData = {
                username: '玩家',
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
        } else {
            // 确保从localStorage读取的数据包含所有必要的游戏属性
            if (typeof this.gameData.health === 'undefined') this.gameData.health = 100;
            if (typeof this.gameData.maxHealth === 'undefined') this.gameData.maxHealth = 100;
            if (typeof this.gameData.attack === 'undefined') this.gameData.attack = 10;
            if (typeof this.gameData.defense === 'undefined') this.gameData.defense = 5;
            if (typeof this.gameData.inventory === 'undefined') this.gameData.inventory = [];
        }
        
        // 计算升级所需经验
        this.gameData.expToNextLevel = this.calculateExpToNextLevel();
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
    }

    startBattle() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('startBattle').disabled = true;
        document.getElementById('stopBattle').disabled = false;
        
        this.updateStatus('战斗开始！正在自动战斗...');
        
        // 开始自动战斗循环
        this.battleInterval = setInterval(() => {
            this.performBattle();
        }, 1000); // 每秒执行一次战斗
    }

    stopBattle() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.battleInterval);
        this.battleInterval = null;
        
        document.getElementById('startBattle').disabled = false;
        document.getElementById('stopBattle').disabled = true;
        
        this.updateStatus('战斗已停止');
    }

    performBattle() {
        if (!this.currentEnemy || this.currentEnemy.health <= 0) {
            this.generateEnemy();
            return;
        }

        // 玩家攻击怪物
        const playerDamage = Math.max(1, this.gameData.attack - this.currentEnemy.defense || 0);
        this.currentEnemy.health = Math.max(0, this.currentEnemy.health - playerDamage);
        
        // 怪物攻击玩家
        if (this.currentEnemy.health > 0) {
            const enemyDamage = Math.max(1, this.currentEnemy.attack - this.gameData.defense);
            this.gameData.health = Math.max(0, this.gameData.health - enemyDamage);
        }

        // 检查怪物是否死亡
        if (this.currentEnemy.health <= 0) {
            this.defeatEnemy();
        }

        // 检查玩家是否死亡
        if (this.gameData.health <= 0) {
            this.playerDeath();
        }

        // 更新界面
        this.updateUI();
    }

    defeatEnemy() {
        // 获得奖励
        this.gameData.exp += this.currentEnemy.exp;
        this.gameData.gold += this.currentEnemy.gold;
        
        // 随机掉落物品
        if (Math.random() < 0.3) {
            this.addItemToInventory('治疗药水', 1);
        }
        
        this.updateStatus(`击败了 ${this.currentEnemy.name}！获得 ${this.currentEnemy.exp} 经验和 ${this.currentEnemy.gold} 金币`);
        
        // 检查是否升级
        this.checkLevelUp();
        
        // 生成新怪物
        setTimeout(() => {
            this.generateEnemy();
        }, 2000);
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
        // 根据玩家等级选择怪物
        const enemyIndex = Math.min(
            Math.floor(this.gameData.level / 2),
            this.enemies.length - 1
        );
        
        const enemyTemplate = this.enemies[enemyIndex];
        this.currentEnemy = {
            name: enemyTemplate.name,
            health: enemyTemplate.maxHealth,
            maxHealth: enemyTemplate.maxHealth,
            attack: enemyTemplate.attack,
            defense: Math.floor(enemyTemplate.attack * 0.3),
            exp: enemyTemplate.exp,
            gold: enemyTemplate.gold
        };
        
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
        const existingItem = this.gameData.inventory.find(item => item.name === itemName);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.gameData.inventory.push({ name: itemName, quantity: quantity });
        }
        
        this.updateInventoryUI();
    }

    updateUI() {
        // 更新玩家信息
        document.getElementById('username').textContent = this.gameData.username;
        document.getElementById('userLevel').textContent = this.gameData.level;
        document.getElementById('userExp').textContent = `${this.gameData.exp}/${this.gameData.expToNextLevel}`;
        document.getElementById('userGold').textContent = this.gameData.gold;
        
        // 更新角色属性
        const healthElement = document.getElementById('health');
        const attackElement = document.getElementById('attack');
        const defenseElement = document.getElementById('defense');
        
        if (healthElement) {
            healthElement.textContent = `${this.gameData.health}/${this.gameData.maxHealth}`;
        }
        if (attackElement) {
            attackElement.textContent = this.gameData.attack;
        }
        if (defenseElement) {
            defenseElement.textContent = this.gameData.defense;
        }
        
        // 调试信息
        console.log('界面更新完成:', {
            health: this.gameData.health,
            attack: this.gameData.attack,
            defense: this.gameData.defense
        });
        
        // 更新升级按钮状态
        this.updateUpgradeButtons();
    }

    updateEnemyUI() {
        if (this.currentEnemy) {
            document.getElementById('enemyName').textContent = this.currentEnemy.name;
            document.getElementById('enemyHealth').textContent = `${this.currentEnemy.health}/${this.currentEnemy.maxHealth}`;
            document.getElementById('enemyAttack').textContent = this.currentEnemy.attack;
        }
    }

    updateInventoryUI() {
        const inventoryDiv = document.getElementById('inventory');
        
        if (this.gameData.inventory.length === 0) {
            inventoryDiv.innerHTML = '<div class="empty-inventory">背包空空如也</div>';
            return;
        }
        
        inventoryDiv.innerHTML = this.gameData.inventory.map(item => `
            <div class="inventory-item">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">${item.quantity}</span>
            </div>
        `).join('');
    }

    updateUpgradeButtons() {
        const upgradeCost = 50;
        const buttons = document.querySelectorAll('.upgrade-btn');
        
        buttons.forEach(button => {
            button.disabled = this.gameData.gold < upgradeCost;
        });
    }

    updateStatus(message) {
        const statusDiv = document.getElementById('statusMessage');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }

    saveGameData() {
        localStorage.setItem('gameUser', JSON.stringify(this.gameData));
    }
}

// 升级系统
function upgradeAttack() {
    if (gameManager.gameData.gold >= 50) {
        gameManager.gameData.gold -= 50;
        gameManager.gameData.attack += 5;
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('攻击力升级成功！');
    }
}

function upgradeDefense() {
    if (gameManager.gameData.gold >= 50) {
        gameManager.gameData.gold -= 50;
        gameManager.gameData.defense += 3;
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('防御力升级成功！');
    }
}

function upgradeHealth() {
    if (gameManager.gameData.gold >= 50) {
        gameManager.gameData.gold -= 50;
        gameManager.gameData.maxHealth += 30;
        gameManager.gameData.health = gameManager.gameData.maxHealth;
        gameManager.updateUI();
        gameManager.saveGameData();
        gameManager.updateStatus('生命值升级成功！');
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('gameUser');
        window.location.href = 'index.html';
    }
}

// 自动保存游戏数据
setInterval(() => {
    if (gameManager && gameManager.gameData) {
        gameManager.saveGameData();
    }
}, 30000); // 每30秒自动保存

// 初始化游戏
const gameManager = new GameManager(); 