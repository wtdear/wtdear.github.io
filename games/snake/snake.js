class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game elements
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.directionQueue = [];
        this.gameSpeed = 150;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gridSize = 15;

        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.speedSelect = document.getElementById('speed');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.themeSelect = document.getElementById('theme');
        
        this.initGame();
        this.setupEventListeners();
        this.updateUI();
    }

    initGame() {
        this.snake = [{x: 5, y: 7}, {x: 4, y: 7}, {x: 3, y: 7}];
        this.direction = 'right';
        this.directionQueue = [];
        this.score = 0;
        this.level = 1;
        this.gameSpeed = parseInt(this.speedSelect.value) || 150;
        
        this.speedSelect.value = "150";
        this.gridSizeSelect.value = "15";
        
        this.generateFood();
        this.cellSize = this.canvas.width / this.gridSize;
        this.applyTheme();
        this.draw();
    }

    queueDirection(newDirection) {
        const lastDirection = this.directionQueue.length > 0 
            ? this.directionQueue[this.directionQueue.length - 1] 
            : this.direction;

        const isOpposite = (
            (newDirection === 'up' && lastDirection === 'down') ||
            (newDirection === 'down' && lastDirection === 'up') ||
            (newDirection === 'left' && lastDirection === 'right') ||
            (newDirection === 'right' && lastDirection === 'left')
        );

        if (!isOpposite && newDirection !== lastDirection) {
            this.directionQueue.push(newDirection);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            
            const key = e.key.toLowerCase();
            switch(key) {
                case 'arrowup': case 'w': this.queueDirection('up'); break;
                case 'arrowdown': case 's': this.queueDirection('down'); break;
                case 'arrowleft': case 'a': this.queueDirection('left'); break;
                case 'arrowright': case 'd': this.queueDirection('right'); break;
                case ' ': e.preventDefault(); this.togglePause(); break;
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.querySelector('.game-over').style.display = 'none';
            this.restartGame();
            this.startGame();
        });

        let touchStartX = 0; let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), {passive: false});
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            const diffX = e.changedTouches[0].clientX - touchStartX;
            const diffY = e.changedTouches[0].clientY - touchStartY;
            
            if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                this.queueDirection(diffX > 0 ? 'right' : 'left');
            } else {
                this.queueDirection(diffY > 0 ? 'down' : 'up');
            }
            e.preventDefault();
        });

        this.speedSelect.addEventListener('change', () => {
            this.gameSpeed = parseInt(this.speedSelect.value);
            if (this.isPlaying && !this.isPaused) {
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
            }
        });

        this.gridSizeSelect.addEventListener('change', () => {
            this.gridSize = parseInt(this.gridSizeSelect.value);
            this.initGame();
        });

        this.themeSelect.addEventListener('change', () => this.applyTheme());
    }

    startGame() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.isPaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> pause';
        this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
    }

    togglePause() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            clearInterval(this.gameInterval);
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> resume';
        } else {
            this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
            document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> pause';
        }
    }

    restartGame() {
        clearInterval(this.gameInterval);
        this.isPlaying = false;
        this.isPaused = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> pause';
        this.initGame();
        this.updateUI();
    }

    gameLoop() {
        if (this.directionQueue.length > 0) {
            this.direction = this.directionQueue.shift();
        }
        
        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.gameOver(); return;
        }
        
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver(); return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.level;
            if (this.score >= this.level * 80) {
                this.level++;
                this.gameSpeed = Math.max(50, this.gameSpeed - 10);
                this.levelElement.classList.add('level-up');
                setTimeout(() => this.levelElement.classList.remove('level-up'), 1000);
            }
            this.generateFood();
            this.scoreElement.classList.add('increase');
            setTimeout(() => this.scoreElement.classList.remove('increase'), 500);
        } else {
            this.snake.pop();
        }
        
        this.updateUI();
        this.draw();
    }

    generateFood() {
        let foodPosition;
        const maxAttempts = 100;
        let attempts = 0;
        
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (
            this.snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y) && 
            attempts < maxAttempts
        );
        this.food = foodPosition;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.drawCell(segment.x, segment.y, isHead ? 'snake-head' : 'snake-body');
            if (isHead) this.drawEyes(segment.x, segment.y);
        });
        
        if (this.food && typeof this.food.x !== 'undefined') {
            this.drawCell(this.food.x, this.food.y, 'food');
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }
    }

    drawCell(x, y, type) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        const padding = 2;
        
        this.ctx.save();
        switch(type) {
            case 'snake-head':
                this.ctx.fillStyle = this.getSnakeColor();
                this.ctx.shadowColor = this.getSnakeColor();
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.roundRect(pixelX + padding, pixelY + padding, this.cellSize - padding * 2, this.cellSize - padding * 2, 6);
                this.ctx.fill();
                break;
            case 'snake-body':
                this.ctx.fillStyle = this.getSnakeColor();
                this.ctx.globalAlpha = 0.85;
                this.ctx.beginPath();
                this.ctx.roundRect(pixelX + padding, pixelY + padding, this.cellSize - padding * 2, this.cellSize - padding * 2, 4);
                this.ctx.fill();
                break;
            case 'food':
                this.drawApple(pixelX, pixelY);
                break;
        }
        this.ctx.restore();
    }

    drawApple(pixelX, pixelY) {
        const size = this.cellSize - 4;
        const centerX = pixelX + this.cellSize / 2;
        const centerY = pixelY + this.cellSize / 2;
        const radius = size / 2;
        
        this.ctx.save();
        this.ctx.shadowColor = this.getAppleColor();
        this.ctx.shadowBlur = 12;
        
        this.ctx.fillStyle = this.getAppleColor();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawEyes(x, y) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        const eyeSize = this.cellSize / 8;
        this.ctx.fillStyle = '#FFFFFF';
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        switch(this.direction) {
            case 'right': leftEyeX = pixelX + this.cellSize - eyeSize * 3; leftEyeY = pixelY + eyeSize * 2; rightEyeX = pixelX + this.cellSize - eyeSize * 3; rightEyeY = pixelY + this.cellSize - eyeSize * 3; break;
            case 'left': leftEyeX = pixelX + eyeSize * 2; leftEyeY = pixelY + eyeSize * 2; rightEyeX = pixelX + eyeSize * 2; rightEyeY = pixelY + this.cellSize - eyeSize * 3; break;
            case 'up': leftEyeX = pixelX + eyeSize * 2; leftEyeY = pixelY + eyeSize * 2; rightEyeX = pixelX + this.cellSize - eyeSize * 3; rightEyeY = pixelY + eyeSize * 2; break;
            case 'down': leftEyeX = pixelX + eyeSize * 2; leftEyeY = pixelY + this.cellSize - eyeSize * 3; rightEyeX = pixelX + this.cellSize - eyeSize * 3; rightEyeY = pixelY + this.cellSize - eyeSize * 3; break;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    getSnakeColor() {
        switch(this.themeSelect.value) {
            case 'dark': return '#f8fafc';
            case 'green': return '#22c55e';
            case 'retro': return '#f59e0b';
            default: return '#a855f7'; // Cosmic
        }
    }

    getAppleColor() {
        switch(this.themeSelect.value) {
            case 'dark': return '#a855f7';
            case 'green': return '#ef4444';
            case 'retro': return '#ec4899';
            default: return '#06b6d4'; // Cosmic
        }
    }

    applyTheme() {
        this.canvas.className = `canvas-${this.themeSelect.value}`;
        this.draw();
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.levelElement.textContent = this.level;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
    }

    gameOver() {
        clearInterval(this.gameInterval);
        this.isPlaying = false;
        this.isPaused = false;
        const gameOverScreen = document.querySelector('.game-over');
        if (gameOverScreen) {
            document.querySelector('.game-over-score').textContent = this.score;
            gameOverScreen.style.display = 'flex';
        }
        document.getElementById('startBtn').disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            return this;
        };
    }

    const game = new SnakeGame();
    
    document.getElementById('closeGameOver')?.addEventListener('click', () => {
        document.querySelector('.game-over').style.display = 'none';
    });

    const bindMobileBtn = (id, direction) => {
        document.getElementById(id)?.addEventListener('click', () => game.queueDirection(direction));
    };
    
    bindMobileBtn('upBtn', 'up');
    bindMobileBtn('downBtn', 'down');
    bindMobileBtn('leftBtn', 'left');
    bindMobileBtn('rightBtn', 'right');

    document.getElementById('mobilePauseBtn')?.addEventListener('click', () => game.togglePause());
});