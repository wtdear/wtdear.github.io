class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game elements
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameSpeed = 150; // Медленная начальная скорость
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.level = 1;
        this.isPlaying = false;
        this.isPaused = false;
        this.gridSize = 15; // Стандартный размер поля 15x15
        
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
            {x: 5, y: 7},
            {x: 4, y: 7},
            {x: 3, y: 7}
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.gameSpeed = parseInt(this.speedSelect.value) || 150;
        
        // Set speed select to slowest
        this.speedSelect.value = "150";
        
        // Set grid size select to 15
        this.gridSizeSelect.value = "15";
        
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
        if (!this.isPlaying || this.isPaused) return;
        
        const key = e.key.toLowerCase();
        
        switch(key) {
            case 'arrowup':
            case 'w':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'arrowdown':
            case 's':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'arrowleft':
            case 'a':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'arrowright':
            case 'd':
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

        // Touch events for swipe controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isPlaying || this.isPaused) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // Minimum swipe distance
            if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (diffX > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (diffX < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (diffY > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (diffY < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
            
            e.preventDefault();
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
        const maxAttempts = 100;
        let attempts = 0;
        
        do {
            foodPosition = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (
            this.snake.some(segment => 
                segment.x === foodPosition.x && segment.y === foodPosition.y
            ) && attempts < maxAttempts
        );
        
        // If couldn't find empty spot, create food at a default position
        if (attempts >= maxAttempts) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (!this.snake.some(segment => segment.x === x && segment.y === y)) {
                        foodPosition = {x, y};
                        break;
                    }
                }
            }
        }
        
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
        
        // Draw food (apple)
        if (this.food && typeof this.food.x !== 'undefined') {
            this.drawCell(this.food.x, this.food.y, 'food');
        }
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
                this.roundRect(pixelX + padding, pixelY + padding, 
                             this.cellSize - padding * 2, 
                             this.cellSize - padding * 2, 6);
                this.ctx.fill();
                break;
                
            case 'snake-body':
                this.ctx.fillStyle = this.getSnakeColor();
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.roundRect(pixelX + padding, pixelY + padding, 
                             this.cellSize - padding * 2, 
                             this.cellSize - padding * 2, 4);
                this.ctx.fill();
                break;
                
            case 'food':
                // Draw apple instead of red circle
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
        
        // Save context
        this.ctx.save();
        
        // Shadow for apple
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 3;
        
        // Main apple body
        this.ctx.fillStyle = this.getAppleColor();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Apple highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Reset shadow for stem and leaf
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Apple stem (brown)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.fillRect(centerX - 1, centerY - radius - 4, 2, 5);
        
        // Apple leaf (green)
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 3, centerY - radius - 1, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    // Custom roundRect method
    roundRect(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + height, radius);
        this.ctx.arcTo(x + width, y + height, x, y + height, radius);
        this.ctx.arcTo(x, y + height, x, y, radius);
        this.ctx.arcTo(x, y, x + width, y, radius);
        this.ctx.closePath();
        return this.ctx;
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

    getAppleColor() {
        const theme = this.themeSelect.value;
        switch(theme) {
            case 'dark': return '#FF5252'; // Красное яблоко
            case 'green': return '#FF4081'; // Розовое яблоко
            case 'retro': return '#FF6B6B'; // Светло-красное яблоко
            default: return '#FF0000'; // Классическое красное яблоко
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
        
        if (gameOverScreen && finalScore) {
            finalScore.textContent = this.score;
            gameOverScreen.style.display = 'flex';
        }
        
        // Update start button
        document.getElementById('startBtn').disabled = false;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // Add event listener for close game over button
    const closeGameOverBtn = document.getElementById('closeGameOver');
    if (closeGameOverBtn) {
        closeGameOverBtn.addEventListener('click', () => {
            const gameOverScreen = document.querySelector('.game-over');
            if (gameOverScreen) {
                gameOverScreen.style.display = 'none';
            }
        });
    }
    
    // Initialize mobile control buttons
    const mobileUpBtn = document.getElementById('upBtn');
    const mobileDownBtn = document.getElementById('downBtn');
    const mobileLeftBtn = document.getElementById('leftBtn');
    const mobileRightBtn = document.getElementById('rightBtn');
    
    const handleMobileControl = (direction) => {
        if (!game.isPlaying || game.isPaused) return;
        
        switch(direction) {
            case 'up':
                if (game.direction !== 'down') game.nextDirection = 'up';
                break;
            case 'down':
                if (game.direction !== 'up') game.nextDirection = 'down';
                break;
            case 'left':
                if (game.direction !== 'right') game.nextDirection = 'left';
                break;
            case 'right':
                if (game.direction !== 'left') game.nextDirection = 'right';
                break;
        }
    };
    
    if (mobileUpBtn) {
        mobileUpBtn.addEventListener('click', () => handleMobileControl('up'));
    }
    
    if (mobileDownBtn) {
        mobileDownBtn.addEventListener('click', () => handleMobileControl('down'));
    }
    
    if (mobileLeftBtn) {
        mobileLeftBtn.addEventListener('click', () => handleMobileControl('left'));
    }
    
    if (mobileRightBtn) {
        mobileRightBtn.addEventListener('click', () => handleMobileControl('right'));
    }
    
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