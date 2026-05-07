class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.player = new Player(100, this.height - 150);
        this.enemy = new Enemy(this.width - 150, this.height - 150);
        this.gravity = 0.5;
        this.friction = 0.8;
        
        this.score = 0;
        this.gameState = 'start';
        this.lastEnemySpawn = 0;
        this.enemiesDefeated = 0;
        
        this.keys = {};
        this.particles = [];
        
        this.isMobile = this.detectMobile();
        this.setupDeviceUI();
        
        this.init();
    }
    
    detectMobile() {
        const check = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const hasMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isSmallScreen = window.innerWidth < 768;
            return hasTouch && (hasMobileUA || isSmallScreen);
        };
        
        const result = check();
        return result;
    }
    
    setupDeviceUI() {
        const deviceType = document.getElementById('deviceType');
        const touchControls = document.getElementById('touchControls');
        const keyboardControls = document.getElementById('controls');
        
        if (this.isMobile) {
            deviceType.textContent = '手机';
            touchControls.classList.add('active');
            keyboardControls.style.display = 'none';
        } else {
            deviceType.textContent = '电脑';
            touchControls.classList.remove('active');
            keyboardControls.style.display = 'block';
        }
        
        if (window.innerWidth < 820) {
            this.canvas.style.width = '100%';
            this.canvas.style.height = 'auto';
        }
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyZ' && this.gameState === 'playing') {
                this.player.attack();
            }
            if (e.code === 'KeyX' && this.gameState === 'playing') {
                this.player.specialAttack();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('resize', () => {
            this.setupDeviceUI();
        });
    }
    
    setupTouchListeners() {
        const touchLeft = document.getElementById('touchLeft');
        const touchRight = document.getElementById('touchRight');
        const touchJump = document.getElementById('touchJump');
        const touchAttack = document.getElementById('touchAttack');
        const touchSpecial = document.getElementById('touchSpecial');
        
        const handleTouchStart = (control) => {
            return (e) => {
                e.preventDefault();
                this.keys[control] = true;
                if (control === 'TouchAttack' && this.gameState === 'playing') {
                    this.player.attack();
                }
                if (control === 'TouchSpecial' && this.gameState === 'playing') {
                    this.player.specialAttack();
                }
            };
        };
        
        const handleTouchEnd = (control) => {
            return (e) => {
                e.preventDefault();
                this.keys[control] = false;
            };
        };
        
        touchLeft.addEventListener('touchstart', handleTouchStart('ArrowLeft'));
        touchLeft.addEventListener('touchend', handleTouchEnd('ArrowLeft'));
        touchLeft.addEventListener('mousedown', handleTouchStart('ArrowLeft'));
        touchLeft.addEventListener('mouseup', handleTouchEnd('ArrowLeft'));
        
        touchRight.addEventListener('touchstart', handleTouchStart('ArrowRight'));
        touchRight.addEventListener('touchend', handleTouchEnd('ArrowRight'));
        touchRight.addEventListener('mousedown', handleTouchStart('ArrowRight'));
        touchRight.addEventListener('mouseup', handleTouchEnd('ArrowRight'));
        
        touchJump.addEventListener('touchstart', handleTouchStart('ArrowUp'));
        touchJump.addEventListener('touchend', handleTouchEnd('ArrowUp'));
        touchJump.addEventListener('mousedown', handleTouchStart('ArrowUp'));
        touchJump.addEventListener('mouseup', handleTouchEnd('ArrowUp'));
        
        touchAttack.addEventListener('touchstart', handleTouchStart('TouchAttack'));
        touchAttack.addEventListener('touchend', handleTouchEnd('TouchAttack'));
        touchAttack.addEventListener('mousedown', handleTouchStart('TouchAttack'));
        touchAttack.addEventListener('mouseup', handleTouchEnd('TouchAttack'));
        
        touchSpecial.addEventListener('touchstart', handleTouchStart('TouchSpecial'));
        touchSpecial.addEventListener('touchend', handleTouchEnd('TouchSpecial'));
        touchSpecial.addEventListener('mousedown', handleTouchStart('TouchSpecial'));
        touchSpecial.addEventListener('mouseup', handleTouchEnd('TouchSpecial'));
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.player.update(this.keys, this.gravity, this.friction, this.width, this.height);
        this.enemy.update(this.player, this.width, this.height);
        
        this.checkCollision();
        this.checkEnemyDefeated();
        
        this.particles.forEach((p, index) => {
            p.update();
            if (p.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    checkCollision() {
        const playerHitbox = this.player.getHitbox();
        const enemyHitbox = this.enemy.getHitbox();
        
        if (this.player.isAttacking && !this.player.attackHit) {
            const attackBox = this.player.getAttackBox();
            if (this.isColliding(attackBox, enemyHitbox)) {
                this.enemy.takeDamage(this.player.attackDamage);
                this.player.attackHit = true;
                this.createHitParticles(this.enemy.x, this.enemy.y, 'red');
            }
        }
        
        if (this.player.isSpecialAttacking && !this.player.specialHit) {
            const specialBox = this.player.getSpecialAttackBox();
            if (this.isColliding(specialBox, enemyHitbox)) {
                this.enemy.takeDamage(this.player.specialDamage);
                this.player.specialHit = true;
                this.createHitParticles(this.enemy.x, this.enemy.y, 'blue');
            }
        }
        
        if (this.enemy.isAttacking && !this.enemy.attackHit) {
            const enemyAttackBox = this.enemy.getAttackBox();
            if (this.isColliding(enemyAttackBox, playerHitbox)) {
                this.player.takeDamage(this.enemy.attackDamage);
                this.enemy.attackHit = true;
                this.createHitParticles(this.player.x, this.player.y, 'orange');
            }
        }
    }
    
    isColliding(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    checkEnemyDefeated() {
        if (this.enemy.health <= 0) {
            this.score += 100;
            this.enemiesDefeated++;
            this.updateScore();
            
            this.createExplosion(this.enemy.x + this.enemy.width / 2, this.enemy.y + this.enemy.height / 2);
            
            const difficulty = Math.min(this.enemiesDefeated * 0.1, 0.5);
            this.enemy = new Enemy(this.width - 150, this.height - 150, difficulty);
        }
        
        if (this.player.health <= 0) {
            this.gameOver(false);
        }
    }
    
    createHitParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, ['red', 'orange', 'yellow'][Math.floor(Math.random() * 3)]));
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        this.player.render(this.ctx);
        this.enemy.render(this.ctx);
        
        this.particles.forEach(p => p.render(this.ctx));
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.6, '#98d8c8');
        gradient.addColorStop(1, '#7bc47f');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#5a9a5a';
        this.ctx.fillRect(0, this.height - 50, this.width, 50);
        
        this.drawClouds();
        this.drawTrees();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(100, 60, 50);
        this.drawCloud(300, 80, 40);
        this.drawCloud(550, 50, 60);
        this.drawCloud(700, 70, 35);
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTrees() {
        this.drawTree(50, this.height - 50, 30);
        this.drawTree(150, this.height - 50, 25);
        this.drawTree(650, this.height - 50, 35);
        this.drawTree(750, this.height - 50, 28);
    }
    
    drawTree(x, y, size) {
        this.ctx.fillStyle = '#4a7c4a';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - size, y - size * 1.5);
        this.ctx.lineTo(x + size, y - size * 1.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2d5a2d';
        this.ctx.fillRect(x - 5, y - size * 1.5, 10, size * 0.5);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateHealthBars() {
        document.getElementById('playerHealth').style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        document.getElementById('enemyHealth').style.width = `${(this.enemy.health / this.enemy.maxHealth) * 100}%`;
    }
    
    updateScore() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
    }
    
    start() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.player = new Player(100, this.height - 150);
        this.enemy = new Enemy(this.width - 150, this.height - 150);
        this.score = 0;
        this.enemiesDefeated = 0;
        this.particles = [];
        
        this.updateHealthBars();
        this.updateScore();
    }
    
    gameOver(won) {
        this.gameState = 'gameover';
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('gameOverTitle').textContent = won ? '胜利！' : '游戏结束';
        document.getElementById('finalScore').textContent = `最终分数: ${this.score} | 击败敌人: ${this.enemiesDefeated}`;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = -12;
        this.isJumping = false;
        
        this.health = 100;
        this.maxHealth = 100;
        
        this.isAttacking = false;
        this.isSpecialAttacking = false;
        this.attackTimer = 0;
        this.specialTimer = 0;
        this.attackHit = false;
        this.specialHit = false;
        this.attackDamage = 15;
        this.specialDamage = 30;
        
        this.facingRight = true;
        this.color = '#4a90d9';
        this.attackColor = '#6ab7ff';
        this.specialColor = '#00d4ff';
    }
    
    update(keys, gravity, friction, maxWidth, maxHeight) {
        this.velocityX = 0;
        
        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.facingRight = false;
        }
        if (keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.facingRight = true;
        }
        
        if (keys['ArrowUp'] && !this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
        
        this.velocityY += gravity;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > maxWidth) this.x = maxWidth - this.width;
        
        if (this.y + this.height >= maxHeight - 50) {
            this.y = maxHeight - 50 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackHit = false;
            }
        }
        
        if (this.isSpecialAttacking) {
            this.specialTimer--;
            if (this.specialTimer <= 0) {
                this.isSpecialAttacking = false;
                this.specialHit = false;
            }
        }
    }
    
    attack() {
        if (!this.isAttacking && !this.isSpecialAttacking) {
            this.isAttacking = true;
            this.attackTimer = 15;
        }
    }
    
    specialAttack() {
        if (!this.isAttacking && !this.isSpecialAttacking) {
            this.isSpecialAttacking = true;
            this.specialTimer = 20;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        game.updateHealthBars();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 5
        };
    }
    
    getAttackBox() {
        const direction = this.facingRight ? 1 : -1;
        return {
            x: this.facingRight ? this.x + this.width : this.x - 30,
            y: this.y + 10,
            width: 30,
            height: 40
        };
    }
    
    getSpecialAttackBox() {
        const direction = this.facingRight ? 1 : -1;
        return {
            x: this.facingRight ? this.x + this.width : this.x - 50,
            y: this.y,
            width: 50,
            height: this.height
        };
    }
    
    render(ctx) {
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#2a5a8a';
        ctx.fillRect(this.x + 10, this.y + 10, 15, 20);
        ctx.fillRect(this.x + 25, this.y + 10, 15, 20);
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 25, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 30, this.y + 25, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 15, this.y + 50, 8, 25);
        ctx.fillRect(this.x + 27, this.y + 50, 8, 25);
        
        if (this.isAttacking) {
            ctx.fillStyle = this.attackColor;
            const attackX = this.x + this.width;
            ctx.fillRect(attackX, this.y + 15, 25, 15);
            ctx.fillRect(attackX + 20, this.y + 10, 10, 25);
        }
        
        if (this.isSpecialAttacking) {
            ctx.fillStyle = this.specialColor;
            ctx.shadowColor = this.specialColor;
            ctx.shadowBlur = 10;
            const attackX = this.x + this.width;
            ctx.fillRect(attackX, this.y, 40, this.height);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, difficulty = 0) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 2 + difficulty;
        this.jumpForce = -10;
        this.isJumping = false;
        
        this.health = 80 + difficulty * 20;
        this.maxHealth = this.health;
        
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackHit = false;
        this.attackDamage = 10 + difficulty * 5;
        
        this.facingRight = false;
        this.color = '#e74c3c';
        this.attackColor = '#ff6b6b';
        
        this.aiTimer = 0;
        this.aiAction = 'idle';
        this.difficulty = difficulty;
    }
    
    update(player, maxWidth, maxHeight) {
        this.aiTimer++;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        if (this.aiTimer > 60) {
            this.aiTimer = 0;
            const rand = Math.random();
            
            if (Math.abs(dx) < 200) {
                this.aiAction = 'attack';
            } else if (Math.abs(dx) < 300 && Math.random() < 0.3 + this.difficulty) {
                this.aiAction = 'jump';
            } else {
                this.aiAction = 'move';
            }
        }
        
        this.velocityX = 0;
        
        if (this.aiAction === 'move') {
            if (dx > 0) {
                this.velocityX = this.speed;
                this.facingRight = true;
            } else {
                this.velocityX = -this.speed;
                this.facingRight = false;
            }
        } else if (this.aiAction === 'attack') {
            if (Math.abs(dx) > 30) {
                if (dx > 0) {
                    this.velocityX = this.speed;
                    this.facingRight = true;
                } else {
                    this.velocityX = -this.speed;
                    this.facingRight = false;
                }
            } else {
                this.attack();
            }
        }
        
        if (this.aiAction === 'jump' && !this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
        
        this.velocityY += 0.5;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > maxWidth) this.x = maxWidth - this.width;
        
        if (this.y + this.height >= maxHeight - 50) {
            this.y = maxHeight - 50 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackHit = false;
            }
        }
    }
    
    attack() {
        if (!this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 12;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
        game.updateHealthBars();
    }
    
    getHitbox() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 5
        };
    }
    
    getAttackBox() {
        return {
            x: this.facingRight ? this.x + this.width : this.x - 30,
            y: this.y + 10,
            width: 30,
            height: 40
        };
    }
    
    render(ctx) {
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, -this.y);
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#a52a2a';
        ctx.fillRect(this.x + 12, this.y + 8, 12, 15);
        ctx.fillRect(this.x + 26, this.y + 8, 12, 15);
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 22, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 30, this.y + 22, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 21, this.y + 21, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 31, this.y + 21, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 15, this.y + 52, 8, 23);
        ctx.fillRect(this.x + 27, this.y + 52, 8, 23);
        
        if (this.isAttacking) {
            ctx.fillStyle = this.attackColor;
            ctx.shadowColor = this.attackColor;
            ctx.shadowBlur = 5;
            const attackX = this.x + this.width;
            ctx.fillRect(attackX, this.y + 15, 25, 15);
            ctx.fillRect(attackX + 20, this.y + 10, 10, 25);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.2;
        this.life--;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (this.life / this.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let game;

function startGame() {
    game.start();
}

function restartGame() {
    game.start();
}

window.addEventListener('load', () => {
    game = new Game();
});
