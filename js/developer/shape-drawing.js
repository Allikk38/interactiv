// js/developer/shape-drawing.js
// Модуль рисования формы дома на сетке 10×10

const ShapeDrawing = {
    gridSize: 10,
    cellSize: 30,
    grid: null,
    container: null,
    onComplete: null,

    init(containerId, onCompleteCallback) {
        this.container = document.getElementById(containerId);
        this.onComplete = onCompleteCallback;
        this.initGrid();
        this.render();
        this.attachEvents();
    },

    initGrid() {
        // Создаём пустую сетку 10x10 (false = пусто, true = застроено)
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
    },

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="shape-drawing-container" style="text-align: center;">
                <div style="margin-bottom: 20px;">
                    <h3>📐 Нарисуйте форму дома</h3>
                    <p>Кликайте по клеткам, чтобы построить форму. Дом должен быть цельным (без дырок).</p>
                    <div style="margin: 10px 0;">
                        <span id="shape-cells-count" style="background: var(--color-primary); padding: 4px 12px; border-radius: 20px; color: white;">0 клеток</span>
                    </div>
                </div>
                <div class="shape-grid" style="display: grid; grid-template-columns: repeat(${this.gridSize}, ${this.cellSize}px); gap: 2px; background: var(--color-border); padding: 2px; display: inline-block; background: var(--color-border);">
                    ${this.renderGrid()}
                </div>
                <div style="margin-top: 20px;">
                    <button id="shape-clear-btn" class="btn btn--secondary btn--small" style="margin-right: 10px;">🗑️ Очистить</button>
                    <button id="shape-confirm-btn" class="btn btn--primary" disabled>✅ Подтвердить форму</button>
                </div>
                <div id="shape-error" style="color: var(--color-danger); margin-top: 10px; font-size: 0.8rem;"></div>
            </div>
        `;
    },

    renderGrid() {
        let html = '<div style="display: flex; flex-direction: column; gap: 2px;">';
        for (let y = 0; y < this.gridSize; y++) {
            html += '<div style="display: flex; gap: 2px;">';
            for (let x = 0; x < this.gridSize; x++) {
                const isFilled = this.grid[y][x];
                html += `
                    <div class="shape-cell" data-x="${x}" data-y="${y}" style="
                        width: ${this.cellSize}px;
                        height: ${this.cellSize}px;
                        background: ${isFilled ? 'var(--color-primary)' : 'var(--color-surface)'};
                        border: 1px solid var(--color-border);
                        cursor: pointer;
                        transition: all 0.1s ease;
                    "></div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    attachEvents() {
        // Клик по клеткам
        document.querySelectorAll('.shape-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                this.toggleCell(x, y);
            });
        });

        // Кнопка очистки
        const clearBtn = document.getElementById('shape-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearGrid());
        }

        // Кнопка подтверждения
        const confirmBtn = document.getElementById('shape-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.validateAndComplete());
        }
    },

    toggleCell(x, y) {
        this.grid[y][x] = !this.grid[y][x];
        this.updateCellDisplay(x, y);
        this.updateStats();
        this.updateConfirmButton();
    },

    updateCellDisplay(x, y) {
        const cell = document.querySelector(`.shape-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.style.background = this.grid[y][x] ? 'var(--color-primary)' : 'var(--color-surface)';
        }
    },

    updateStats() {
        const count = this.getFilledCount();
        const countEl = document.getElementById('shape-cells-count');
        if (countEl) countEl.textContent = `${count} клеток`;
    },

    getFilledCount() {
        let count = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) count++;
            }
        }
        return count;
    },

    updateConfirmButton() {
        const confirmBtn = document.getElementById('shape-confirm-btn');
        const count = this.getFilledCount();
        if (confirmBtn) {
            confirmBtn.disabled = count < 4;
        }
    },

    clearGrid() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    this.grid[y][x] = false;
                    this.updateCellDisplay(x, y);
                }
            }
        }
        this.updateStats();
        this.updateConfirmButton();
        this.hideError();
    },

    validateAndComplete() {
        const errorEl = document.getElementById('shape-error');
        
        // Проверка 1: достаточно клеток
        const count = this.getFilledCount();
        if (count < 4) {
            errorEl.textContent = '❌ Дом должен занимать минимум 4 клетки!';
            return;
        }

        // Проверка 2: целостность (без дырок)
        if (!this.isSolid()) {
            errorEl.textContent = '❌ Форма должна быть цельной, без дырок и разрывов!';
            return;
        }

        // Всё хорошо
        errorEl.textContent = '';
        
        // Рассчитываем характеристики формы
        const shapeData = this.calculateShapeData();
        
        if (this.onComplete) {
            this.onComplete(shapeData);
        }
    },

    isSolid() {
        // Находим первую заполненную клетку
        let startX = -1, startY = -1;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX !== -1) break;
        }
        
        if (startX === -1) return false;
        
        // BFS для проверки связности
        const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        const queue = [{x: startX, y: startY}];
        visited[startY][startX] = true;
        
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                    if (this.grid[ny][nx] && !visited[ny][nx]) {
                        visited[ny][nx] = true;
                        queue.push({x: nx, y: ny});
                    }
                }
            }
        }
        
        // Проверяем, что все заполненные клетки посещены
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] && !visited[y][x]) {
                    return false;
                }
            }
        }
        
        return true;
    },

    calculateShapeData() {
        // Находим границы формы
        let minX = this.gridSize, maxX = -1, minY = this.gridSize, maxY = -1;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const totalCells = this.getFilledCount();
        
        // Процент заполнения bounding box
        const boundingBoxArea = width * height;
        const fillPercentage = Math.round((totalCells / boundingBoxArea) * 100);
        
        // Определяем тип формы (простой вывод)
        let shapeType = 'Стандартная';
        if (width === height && fillPercentage > 80) shapeType = 'Квадратная';
        if (width > height * 1.5) shapeType = 'Вытянутая';
        if (height > width * 1.5) shapeType = 'Башенная';
        
        return {
            width: width,
            height: height,
            totalCells: totalCells,
            fillPercentage: fillPercentage,
            shapeType: shapeType,
            maxFloors: Math.floor(totalCells / 2) + 2, // Влияет на этажность
            grid: this.grid.map(row => [...row]) // Копия сетки
        };
    },

    hideError() {
        const errorEl = document.getElementById('shape-error');
        if (errorEl) errorEl.textContent = '';
    }
};

window.ShapeDrawing = ShapeDrawing;