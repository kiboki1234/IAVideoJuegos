/**
 * Maze Generator
 * Uses Recursive Backtracking algorithm to generate perfect mazes
 */

class Maze {
    constructor(size) {
        // Ensure odd size for proper maze generation
        this.size = size % 2 === 0 ? size + 1 : size;
        this.grid = [];
        this.start = { x: 1, y: 1 };
        this.end = { x: this.size - 2, y: this.size - 2 };
    }

    /**
     * Cell types:
     * 0 = Wall
     * 1 = Path
     * 2 = Start
     * 3 = End
     */
    generate() {
        // Initialize grid with walls
        this.grid = Array(this.size).fill(null).map(() => 
            Array(this.size).fill(0)
        );

        // Generate maze using recursive backtracking
        this._carve(1, 1);

        // Set start and end points
        this.grid[this.start.y][this.start.x] = 2;
        this.grid[this.end.y][this.end.x] = 3;

        // Ensure there's a path to the end
        this._ensureEndReachable();

        return this;
    }

    /**
     * Recursive backtracking algorithm
     */
    _carve(x, y) {
        this.grid[y][x] = 1;

        // Directions: [dx, dy] for N, E, S, W
        const directions = [
            [0, -2], // North
            [2, 0],  // East
            [0, 2],  // South
            [-2, 0]  // West
        ];

        // Shuffle directions
        this._shuffle(directions);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            // Check if the next cell is within bounds and is a wall
            if (this._isInBounds(nx, ny) && this.grid[ny][nx] === 0) {
                // Carve through the wall between current and next cell
                this.grid[y + dy / 2][x + dx / 2] = 1;
                this._carve(nx, ny);
            }
        }
    }

    /**
     * Ensure the end point is reachable
     */
    _ensureEndReachable() {
        const ex = this.end.x;
        const ey = this.end.y;

        // Make sure end cell is a path
        this.grid[ey][ex] = 1;

        // Check if at least one neighbor is a path
        const neighbors = [
            [ex - 1, ey],
            [ex + 1, ey],
            [ex, ey - 1],
            [ex, ey + 1]
        ];

        const hasPathNeighbor = neighbors.some(([nx, ny]) => 
            this._isInBounds(nx, ny) && this.grid[ny][nx] === 1
        );

        // If no path neighbor, create one
        if (!hasPathNeighbor) {
            for (const [nx, ny] of neighbors) {
                if (this._isInBounds(nx, ny)) {
                    this.grid[ny][nx] = 1;
                    break;
                }
            }
        }

        // Reset end marker
        this.grid[ey][ex] = 3;
    }

    /**
     * Fisher-Yates shuffle
     */
    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Check if coordinates are within maze bounds
     */
    _isInBounds(x, y) {
        return x > 0 && x < this.size - 1 && y > 0 && y < this.size - 1;
    }

    /**
     * Check if a cell is walkable (path, start, or end)
     */
    isWalkable(x, y) {
        if (!this._isInBounds(x, y) && 
            !(x === 0 || y === 0 || x === this.size - 1 || y === this.size - 1)) {
            return false;
        }
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return false;
        }
        return this.grid[y][x] !== 0;
    }

    /**
     * Get walkable neighbors of a cell
     */
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            [0, -1], // North
            [1, 0],  // East
            [0, 1],  // South
            [-1, 0]  // West
        ];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isWalkable(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }

    /**
     * Get cell type at position
     */
    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return 0;
        }
        return this.grid[y][x];
    }

    /**
     * Export maze data
     */
    getData() {
        return {
            size: this.size,
            grid: this.grid,
            start: this.start,
            end: this.end
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Maze;
}
