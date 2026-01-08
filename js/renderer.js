/**
 * Maze Renderer
 * Handles all canvas drawing operations
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 20;
        this.maze = null;

        // Colors
        this.colors = {
            wall: '#1e1e2e',
            path: '#3b3b4f',
            start: '#10b981',
            end: '#ef4444',
            visited: 'rgba(99, 102, 241, 0.4)',
            solution: '#fbbf24',
            npcBody: '#ec4899',
            npcGlow: 'rgba(236, 72, 153, 0.4)',
            npcInner: '#f472b6',
            grid: 'rgba(255, 255, 255, 0.03)'
        };

        // State
        this.visitedCells = new Set();
        this.solutionPath = [];
        this.currentSolutionIndex = 0;
    }

    /**
     * Initialize canvas size based on maze
     */
    init(maze) {
        this.maze = maze;

        // Calculate optimal cell size
        const maxCanvasSize = Math.min(window.innerWidth * 0.55, 600);
        this.cellSize = Math.floor(maxCanvasSize / maze.size);
        this.cellSize = Math.max(this.cellSize, 8); // Minimum cell size

        const canvasSize = this.cellSize * maze.size;
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;

        this.clear();
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.wall;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.visitedCells.clear();
        this.solutionPath = [];
        this.currentSolutionIndex = 0;
    }

    /**
     * Render the complete maze
     */
    renderMaze() {
        if (!this.maze) return;

        const { size, grid } = this.maze.getData();

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this._drawCell(x, y, grid[y][x]);
            }
        }
    }

    /**
     * Draw a single cell
     */
    _drawCell(x, y, type) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const size = this.cellSize;
        const padding = 1;

        let color;
        switch (type) {
            case 0: // Wall
                color = this.colors.wall;
                break;
            case 1: // Path
                color = this.colors.path;
                break;
            case 2: // Start
                color = this.colors.start;
                break;
            case 3: // End
                color = this.colors.end;
                break;
            default:
                color = this.colors.path;
        }

        // Draw cell background
        this.ctx.fillStyle = color;
        this.ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);

        // Add slight rounded corners for larger cells
        if (this.cellSize > 15 && type !== 0) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(px + padding, py + padding, size - padding * 2, size - padding * 2, 3);
            this.ctx.fill();
        }

        // Add special effects for start/end
        if (type === 2 || type === 3) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            const centerX = px + size / 2;
            const centerY = py + size / 2;
            const radius = (size / 2) * 0.6;
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Mark a cell as visited (for algorithm visualization)
     */
    markVisited(x, y) {
        const key = `${x},${y}`;
        if (this.visitedCells.has(key)) return;
        this.visitedCells.add(key);

        const cell = this.maze.getCell(x, y);
        if (cell === 2 || cell === 3) return; // Don't overwrite start/end

        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const size = this.cellSize;

        this.ctx.fillStyle = this.colors.visited;
        this.ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    }

    /**
     * Draw solution path progressively
     */
    drawSolutionCell(x, y) {
        const cell = this.maze.getCell(x, y);
        if (cell === 2 || cell === 3) return; // Don't overwrite start/end

        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const size = this.cellSize;
        const center = size / 2;

        // Draw golden path
        this.ctx.fillStyle = this.colors.solution;
        this.ctx.shadowColor = this.colors.solution;
        this.ctx.shadowBlur = 8;

        this.ctx.beginPath();
        this.ctx.arc(px + center, py + center, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw the complete solution path
     */
    drawFullSolution(path) {
        for (let i = 0; i < path.length; i++) {
            this.drawSolutionCell(path[i].x, path[i].y);
        }
    }

    /**
     * Draw NPC
     */
    drawNPC(npc) {
        const data = npc.getRenderData();
        const px = data.x * this.cellSize + this.cellSize / 2;
        const py = data.y * this.cellSize + this.cellSize / 2;
        const radius = (this.cellSize / 2) * data.size;

        // Glow effect
        this.ctx.shadowColor = data.glowColor;
        this.ctx.shadowBlur = 15;

        // Outer circle
        const gradient = this.ctx.createRadialGradient(
            px, py, 0,
            px, py, radius
        );
        gradient.addColorStop(0, this.colors.npcInner);
        gradient.addColorStop(0.7, data.color);
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner highlight
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(px - radius * 0.2, py - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        if (this.cellSize > 12) {
            const eyeOffset = radius * 0.25;
            const eyeSize = radius * 0.15;

            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(px - eyeOffset, py - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
            this.ctx.arc(px + eyeOffset, py - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Pupils
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.beginPath();
            this.ctx.arc(px - eyeOffset, py - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
            this.ctx.arc(px + eyeOffset, py - eyeOffset * 0.5, eyeSize * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
    }

    /**
     * Full redraw with current state
     */
    redraw(npc) {
        this.renderMaze();

        // Redraw visited cells
        for (const key of this.visitedCells) {
            const [x, y] = key.split(',').map(Number);
            this.markVisited(x, y);
        }

        // Redraw solution path up to current index
        for (let i = 0; i < this.currentSolutionIndex; i++) {
            if (this.solutionPath[i]) {
                this.drawSolutionCell(this.solutionPath[i].x, this.solutionPath[i].y);
            }
        }

        // Draw NPC
        if (npc) {
            this.drawNPC(npc);
        }
    }

    /**
     * Set solution path for progressive drawing
     */
    setSolutionPath(path) {
        this.solutionPath = path;
        this.currentSolutionIndex = 0;
    }

    /**
     * Increment solution path index
     */
    advanceSolution() {
        if (this.currentSolutionIndex < this.solutionPath.length) {
            const cell = this.solutionPath[this.currentSolutionIndex];
            this.drawSolutionCell(cell.x, cell.y);
            this.currentSolutionIndex++;
            return true;
        }
        return false;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
