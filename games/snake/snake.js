class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game elements
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameSpeed = 80;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gridSize = 25;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.levelElement = document.getElementById('level');
        this.speedSelect = document.getElementById('speed');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.themeSelect = document.getElementById('theme');
        
        // Initialize game
        this.initGame();
        this.setupEventListeners();
        this.updateUI();
    }

    initGame() {
        // Reset game state
        this.snake = [
            {x: 5, y: 12},
            {x: 4, y: 12},
            {x: 3, y: 12}
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.gameSpeed = parseInt(this.speedSelect.value);
        
        // Generate first food
        this.generateFood();
        
        // Set canvas size based on grid
        this.cellSize = this.canvas.width / this.gridSize;
        
        // Apply theme
        this.applyTheme();
        
        // Draw initial state
        this.draw();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.querySelector('.game-over').style.display = 'none';
            this.restartGame();
            this.startGame();
        });

        // Settings
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
        this.direction = this.nextDirection;
        
        // Move snake
        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.gridSize || 
            head.y < 0 || head.y >= this.gridSize) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.level;
            
            // Check level up
            if (this.score >= this.level * 80) {
                this.level++;
                this.gameSpeed = Math.max(50, this.gameSpeed - 10);
                this.levelElement.classList.add('level-up');
                setTimeout(() => this.levelElement.classList.remove('level-up'), 1000);
            }
            
            this.generateFood();
            
            // Update score with animation
            this.scoreElement.classList.add('increase');
            setTimeout(() => this.scoreElement.classList.remove('increase'), 500);
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
        
        // Update UI
        this.updateUI();
        
        // Draw game
        this.draw();
    }

    generateFood() {
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.some(segment => 
            segment.x === foodPosition.x && segment.y === foodPosition.y));
        
        this.food = foodPosition;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.drawCell(segment.x, segment.y, isHead ? 'snake-head' : 'snake-body');
            
            // Draw eyes on head
            if (isHead) {
                this.drawEyes(segment.x, segment.y);
            }
        });
        
        // Draw food
        this.drawCell(this.food.x, this.food.y, 'food');
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
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
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.roundRect(pixelX + padding, pixelY + padding, 
                                 this.cellSize - padding * 2, 
                                 this.cellSize - padding * 2, 6);
                this.ctx.fill();
                break;
                
            case 'snake-body':
                this.ctx.fillStyle = this.getSnakeColor();
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.roundRect(pixelX + padding, pixelY + padding, 
                                 this.cellSize - padding * 2, 
                                 this.cellSize - padding * 2, 4);
                this.ctx.fill();
                break;
                
            case 'food':
                this.ctx.fillStyle = this.getFoodColor();
                this.ctx.shadowColor = this.getFoodColor();
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(pixelX + this.cellSize / 2, 
                           pixelY + this.cellSize / 2, 
                           (this.cellSize - padding * 2) / 2, 
                           0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }

    drawEyes(x, y) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        const eyeSize = this.cellSize / 8;
        
        this.ctx.fillStyle = '#FFFFFF';
        
        // Determine eye positions based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch(this.direction) {
            case 'right':
                leftEyeX = pixelX + this.cellSize - eyeSize * 3;
                leftEyeY = pixelY + eyeSize * 2;
                rightEyeX = pixelX + this.cellSize - eyeSize * 3;
                rightEyeY = pixelY + this.cellSize - eyeSize * 3;
                break;
            case 'left':
                leftEyeX = pixelX + eyeSize * 2;
                leftEyeY = pixelY + eyeSize * 2;
                rightEyeX = pixelX + eyeSize * 2;
                rightEyeY = pixelY + this.cellSize - eyeSize * 3;
                break;
            case 'up':
                leftEyeX = pixelX + eyeSize * 2;
                leftEyeY = pixelY + eyeSize * 2;
                rightEyeX = pixelX + this.cellSize - eyeSize * 3;
                rightEyeY = pixelY + eyeSize * 2;
                break;
            case 'down':
                leftEyeX = pixelX + eyeSize * 2;
                leftEyeY = pixelY + this.cellSize - eyeSize * 3;
                rightEyeX = pixelX + this.cellSize - eyeSize * 3;
                rightEyeY = pixelY + this.cellSize - eyeSize * 3;
                break;
        }
        
        // Draw eyes
        this.ctx.beginPath();
        this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    getSnakeColor() {
        const theme = this.themeSelect.value;
        switch(theme) {
            case 'dark': return '#BB86FC';
            case 'green': return '#00FF88';
            case 'retro': return '#FF6B6B';
            default: return '#4CAF50';
        }
    }

    getFoodColor() {
        const theme = this.themeSelect.value;
        switch(theme) {
            case 'dark': return '#03DAC6';
            case 'green': return '#FF4081';
            case 'retro': return '#4ECDC4';
            default: return '#FF5252';
        }
    }

    applyTheme() {
        const theme = this.themeSelect.value;
        this.canvas.className = `canvas-${theme}`;
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        this.levelElement.textContent = this.level;
        
        // Update high score if needed
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
        
        // Show game over screen
        const gameOverScreen = document.querySelector('.game-over');
        const finalScore = document.querySelector('.game-over-score');
        
        finalScore.textContent = this.score;
        gameOverScreen.style.display = 'flex';
        
        // Update start button
        document.getElementById('startBtn').disabled = false;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // Polyfill for roundRect if not supported
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        };
    }
});