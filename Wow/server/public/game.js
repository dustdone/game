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
        
        // 新增：技能系统
        this.skills = {
            attack: { name: '强力攻击', cost: 10, cooldown: 0, maxCooldown: 3, icon: '⚔️' },
            defense: { name: '防御姿态', cost: 15, cooldown: 0, maxCooldown: 5, icon: '🛡️' },
            heal: { name: '治疗术', cost: 20, cooldown: 0, maxCooldown: 8, icon: '💚' },
            critical: { name: '暴击强化', cost: 25, cooldown: 0, maxCooldown: 10, icon: '🔥' }
        };
        
        // 新增：战斗状态
        this.battleState = 'idle'; // idle, fighting, dead
        
        // 新增：战斗日志
        this.battleLog = [];
        this.maxLogEntries = 50;
        
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
        this.updateSkillsUI();
        this.updateBattleStatus();
        
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
        // 战斗控制按钮
        const startBattleBtn = document.getElementById('startBattle');
        const stopBattleBtn = document.getElementById('stopBattle');
        
        if (startBattleBtn) {
            startBattleBtn.addEventListener('click', () => this.startBattle());
        }
        
        if (stopBattleBtn) {
            stopBattleBtn.addEventListener('click', () => this.stopBattle());
        }
        
        // 技能按钮
        const skillAttackBtn = document.getElementById('skillAttack');
        const skillDefenseBtn = document.getElementById('skillDefense');
        const skillHealBtn = document.getElementById('skillHeal');
        const skillCriticalBtn = document.getElementById('skillCritical');
        
        if (skillAttackBtn) {
            skillAttackBtn.addEventListener('click', () => this.useSkill('attack'));
        }
        
        if (skillDefenseBtn) {
            skillDefenseBtn.addEventListener('click', () => this.useSkill('defense'));
        }
        
        if (skillHealBtn) {
            skillHealBtn.addEventListener('click', () => this.useSkill('heal'));
        }
        
        if (skillCriticalBtn) {
            skillCriticalBtn.addEventListener('click', () => this.useSkill('critical'));
        }
        
        // 升级按钮
        const upgradeAttackBtn = document.getElementById('upgradeAttackBtn');
        const upgradeDefenseBtn = document.getElementById('upgradeDefenseBtn');
        const upgradeHealthBtn = document.getElementById('upgradeHealthBtn');
        
        if (upgradeAttackBtn) {
            upgradeAttackBtn.addEventListener('click', () => this.upgradeAttack());
        }
        
        if (upgradeDefenseBtn) {
            upgradeDefenseBtn.addEventListener('click', () => this.upgradeDefense());
        }
        
        if (upgradeHealthBtn) {
            upgradeHealthBtn.addEventListener('click', () => this.upgradeHealth());
        }
        
        // 退出登录按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    startBattle() {
        if (this.isRunning) return;
        
        if (!this.currentEnemy) {
            this.addBattleLog('没有怪物可以战斗！', 'system');
            return;
        }
        
        this.isRunning = true;
        this.battleState = 'fighting';
        this.updateBattleStatus();
        
        // 更新按钮状态
        const startBtn = document.getElementById('startBattle');
        const stopBtn = document.getElementById('stopBattle');
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        this.addBattleLog(`开始与 ${this.currentEnemy.name} 战斗！`, 'system');
        
        // 开始战斗循环
        this.battleInterval = setInterval(() => {
            this.battleRound();
        }, 1000);
    }

    stopBattle() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.battleState = 'idle';
        this.updateBattleStatus();
        
        // 更新按钮状态
        const startBtn = document.getElementById('startBattle');
        const stopBtn = document.getElementById('stopBattle');
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        this.addBattleLog('战斗已停止！', 'system');
        
        if (this.battleInterval) {
            clearInterval(this.battleInterval);
            this.battleInterval = null;
        }
    }

    battleRound() {
        if (!this.currentEnemy || !this.gameData) return;
        
        // 更新技能冷却
        this.updateSkillCooldowns();
        
        // 玩家攻击怪物
        let playerDamage = this.calculateDamage(this.gameData.attack, this.currentEnemy.defense || 0);
        let isCritical = Math.random() < 0.15; // 15%暴击率
        
        if (isCritical) {
            playerDamage = Math.floor(playerDamage * 1.5);
            this.addBattleLog(`暴击！你对 ${this.currentEnemy.name} 造成了 ${playerDamage} 点伤害！`, 'critical');
        } else {
            this.addBattleLog(`你对 ${this.currentEnemy.name} 造成了 ${playerDamage} 点伤害！`, 'attack');
        }
        
        this.currentEnemy.health = Math.max(0, this.currentEnemy.health - playerDamage);
        
        // 检查怪物是否死亡
        if (this.currentEnemy.health <= 0) {
            this.defeatEnemy();
            return;
        }
        
        // 怪物攻击玩家
        let enemyDamage = this.calculateDamage(this.currentEnemy.attack, this.gameData.defense);
        let isDodge = Math.random() < 0.1; // 10%闪避率
        
        if (isDodge) {
            this.addBattleLog(`闪避！你躲过了 ${this.currentEnemy.name} 的攻击！`, 'dodge');
        } else {
            this.gameData.health = Math.max(0, this.gameData.health - enemyDamage);
            this.addBattleLog(`${this.currentEnemy.name} 对你造成了 ${enemyDamage} 点伤害！`, 'defense');
        }
        
        // 检查玩家是否死亡
        if (this.gameData.health <= 0) {
            this.playerDeath();
            return;
        }
        
        // 更新界面
        this.updateUI();
        this.updateEnemyUI();
        
        // 保存游戏数据
        this.saveGameData();
    }

    defeatEnemy() {
        if (!this.currentEnemy) return;
        
        // 停止战斗
        this.stopBattle();
        
        // 获得奖励
        this.gameData.exp += this.currentEnemy.exp;
        this.gameData.gold += this.currentEnemy.gold;
        
        // 随机掉落物品
        if (Math.random() < 0.3) { // 30%掉落率
            const item = this.generateRandomItem();
            this.addItemToInventory(item);
            this.addBattleLog(`获得物品：${item.name}！`, 'heal');
        }
        
        this.addBattleLog(`击败了 ${this.currentEnemy.name}！获得 ${this.currentEnemy.exp} 经验和 ${this.currentEnemy.gold} 金币！`, 'attack');
        
        // 检查升级
        this.checkLevelUp();
        
        // 生成新怪物
        this.generateEnemy();
        
        // 更新界面
        this.updateUI();
        this.updateInventoryUI();
        
        // 保存游戏数据
        this.saveGameData();
    }

    playerDeath() {
        // 停止战斗
        this.stopBattle();
        
        // 设置死亡状态
        this.battleState = 'dead';
        this.updateBattleStatus();
        
        // 扣除金币作为死亡惩罚
        const deathPenalty = Math.floor(this.gameData.gold * 0.1);
        this.gameData.gold = Math.max(0, this.gameData.gold - deathPenalty);
        
        // 恢复部分生命值
        this.gameData.health = Math.floor(this.gameData.maxHealth * 0.5);
        
        this.addBattleLog(`你被 ${this.currentEnemy.name} 击败了！损失 ${deathPenalty} 金币！`, 'system');
        this.addBattleLog('生命值恢复至50%！', 'heal');
        
        // 生成新怪物
        this.generateEnemy();
        
        // 更新界面
        this.updateUI();
        
        // 保存游戏数据
        this.saveGameData();
        
        // 3秒后恢复战斗状态
        setTimeout(() => {
            this.battleState = 'idle';
            this.updateBattleStatus();
        }, 3000);
    }

    generateEnemy() {
        if (!this.enemies || this.enemies.length === 0) {
            console.error('enemies数组未定义或为空');
            return;
        }
        
        // 根据玩家等级选择怪物
        let enemyIndex = Math.min(Math.floor(this.gameData.level / 10), this.enemies.length - 1);
        enemyIndex = Math.max(0, enemyIndex);
        
        const baseEnemy = this.enemies[enemyIndex];
        this.currentEnemy = {
            ...baseEnemy,
            health: baseEnemy.maxHealth,
            level: Math.max(1, this.gameData.level - 5 + Math.floor(Math.random() * 10))
        };
        
        // 根据等级调整怪物属性
        const levelMultiplier = 1 + (this.currentEnemy.level - 1) * 0.1;
        this.currentEnemy.maxHealth = Math.floor(baseEnemy.maxHealth * levelMultiplier);
        this.currentEnemy.health = this.currentEnemy.maxHealth;
        this.currentEnemy.attack = Math.floor(baseEnemy.attack * levelMultiplier);
        this.currentEnemy.exp = Math.floor(baseEnemy.exp * levelMultiplier);
        this.currentEnemy.gold = Math.floor(baseEnemy.gold * levelMultiplier);
        
        this.addBattleLog(`新的怪物出现了：${this.currentEnemy.name} (等级 ${this.currentEnemy.level})！`, 'system');
        
        this.updateEnemyUI();
    }

    // 新增：生成随机物品
    generateRandomItem() {
        const items = [
            { name: '生命药水', type: 'consumable', effect: 'health', value: 50 },
            { name: '力量药水', type: 'consumable', effect: 'attack', value: 5 },
            { name: '防御药水', type: 'consumable', effect: 'defense', value: 3 },
            { name: '经验药水', type: 'consumable', effect: 'exp', value: 100 },
            { name: '金币袋', type: 'consumable', effect: 'gold', value: 25 }
        ];
        
        return items[Math.floor(Math.random() * items.length)];
    }

    addItemToInventory(item) {
        if (!this.gameData.inventory) {
            this.gameData.inventory = [];
        }
        
        const existingItem = this.gameData.inventory.find(invItem => invItem.name === item.name);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.gameData.inventory.push({
                ...item,
                quantity: 1
            });
        }
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
        if (enemyDefenseElement) enemyDefenseElement.textContent = this.currentEnemy.defense || 0;
        
        // 更新怪物血条
        const enemyHealthBar = document.getElementById('enemyHealthBar');
        const enemyHealthPercent = document.getElementById('enemyHealthPercent');
        
        if (enemyHealthBar && enemyHealthPercent) {
            const healthPercent = (this.currentEnemy.health / this.currentEnemy.maxHealth) * 100;
            enemyHealthBar.style.width = healthPercent + '%';
            enemyHealthPercent.textContent = Math.round(healthPercent) + '%';
            
            // 根据血量设置血条颜色
            enemyHealthBar.className = 'health-bar-fill';
            if (healthPercent <= 25) {
                enemyHealthBar.classList.add('low');
            } else if (healthPercent <= 50) {
                enemyHealthBar.classList.add('medium');
            }
        }
    }

    updateInventoryUI() {
        const inventoryElement = document.getElementById('inventory');
        if (!inventoryElement) return;
        
        if (!this.gameData.inventory || this.gameData.inventory.length === 0) {
            inventoryElement.innerHTML = '<div class="empty-inventory">背包空空如也</div>';
            return;
        }
        
        inventoryElement.innerHTML = this.gameData.inventory.map(item => 
            `<div class="inventory-item">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">${item.quantity}</span>
            </div>`
        ).join('');
    }

    // 新增：添加战斗日志
    addBattleLog(message, type = 'system') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            message: `[${timestamp}] ${message}`,
            type: type,
            timestamp: Date.now()
        };
        
        this.battleLog.unshift(logEntry);
        
        // 限制日志条目数量
        if (this.battleLog.length > this.maxLogEntries) {
            this.battleLog = this.battleLog.slice(0, this.maxLogEntries);
        }
        
        this.updateBattleLogUI();
    }

    // 新增：更新战斗日志界面
    updateBattleLogUI() {
        const battleLogElement = document.getElementById('battleLog');
        if (!battleLogElement) return;
        
        battleLogElement.innerHTML = this.battleLog.map(entry => 
            `<div class="log-entry ${entry.type}">${entry.message}</div>`
        ).join('');
        
        // 自动滚动到底部
        battleLogElement.scrollTop = 0;
    }

    // 新增：更新战斗状态
    updateBattleStatus() {
        const statusIndicator = document.getElementById('battleStatusIndicator');
        const statusText = document.getElementById('battleStatusText');
        
        if (!statusIndicator || !statusText) return;
        
        // 移除所有状态类
        statusIndicator.className = 'status-indicator';
        statusIndicator.classList.add(this.battleState);
        
        // 更新状态文本
        const statusMessages = {
            idle: '等待中',
            fighting: '战斗中',
            dead: '已阵亡'
        };
        
        statusText.textContent = statusMessages[this.battleState] || '未知状态';
    }

    // 新增：使用技能
    useSkill(skillKey) {
        const skill = this.skills[skillKey];
        if (!skill) return false;
        
        // 检查冷却时间
        if (skill.cooldown > 0) {
            this.addBattleLog(`技能 ${skill.name} 还在冷却中！`, 'system');
            return false;
        }
        
        // 检查金币
        if (this.gameData.gold < skill.cost) {
            this.addBattleLog(`金币不足，无法使用 ${skill.name}！`, 'system');
            return false;
        }
        
        // 扣除金币
        this.gameData.gold -= skill.cost;
        
        // 设置冷却时间
        skill.cooldown = skill.maxCooldown;
        
        // 应用技能效果
        let effectMessage = '';
        switch (skillKey) {
            case 'attack':
                const attackBonus = Math.floor(this.gameData.attack * 0.5);
                this.gameData.attack += attackBonus;
                effectMessage = `攻击力提升 ${attackBonus} 点！`;
                break;
            case 'defense':
                const defenseBonus = Math.floor(this.gameData.defense * 0.5);
                this.gameData.defense += defenseBonus;
                effectMessage = `防御力提升 ${defenseBonus} 点！`;
                break;
            case 'heal':
                const healAmount = Math.floor(this.gameData.maxHealth * 0.3);
                this.gameData.health = Math.min(this.gameData.maxHealth, this.gameData.health + healAmount);
                effectMessage = `恢复生命值 ${healAmount} 点！`;
                break;
            case 'critical':
                // 暴击率提升（这里简化处理）
                effectMessage = `暴击率提升！`;
                break;
        }
        
        this.addBattleLog(`使用技能 ${skill.name}！${effectMessage}`, 'heal');
        this.updateUI();
        this.updateSkillsUI();
        
        return true;
    }

    // 新增：更新技能界面
    updateSkillsUI() {
        Object.keys(this.skills).forEach(skillKey => {
            const skillElement = document.getElementById(`skill${skillKey.charAt(0).toUpperCase() + skillKey.slice(1)}`);
            if (!skillElement) return;
            
            const skill = this.skills[skillKey];
            
            // 更新冷却时间显示
            if (skill.cooldown > 0) {
                skillElement.classList.add('disabled');
                skillElement.querySelector('.skill-cost').textContent = `冷却: ${skill.cooldown}回合`;
            } else {
                skillElement.classList.remove('disabled');
                skillElement.querySelector('.skill-cost').textContent = `消耗: ${skill.cost}金币`;
            }
            
            // 检查金币是否足够
            if (this.gameData.gold < skill.cost) {
                skillElement.classList.add('disabled');
            } else if (skill.cooldown === 0) {
                skillElement.classList.remove('disabled');
            }
        });
    }

    // 新增：技能冷却更新
    updateSkillCooldowns() {
        Object.values(this.skills).forEach(skill => {
            if (skill.cooldown > 0) {
                skill.cooldown--;
            }
        });
        this.updateSkillsUI();
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

    // 新增：计算伤害
    calculateDamage(attack, defense) {
        const baseDamage = Math.max(1, attack - defense);
        const variance = Math.random() * 0.4 + 0.8; // 80%-120%的伤害浮动
        return Math.floor(baseDamage * variance);
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