/**
 * Advanced Maze Generator
 * Graph-based maze generation with multiple algorithms
 * Includes: Recursive Backtracking, Prim's, Kruskal's, Eller's, and Binary Tree
 */

class Maze {
    constructor(size, algorithm = 'backtracking') {
        // Ensure odd size for proper maze generation
        this.size = size % 2 === 0 ? size + 1 : size;
        this.grid = [];
        this.start = { x: 1, y: 1 };
        this.end = { x: this.size - 2, y: this.size - 2 };
        this.algorithm = algorithm;

        // Graph representation for complex algorithms
        this.graph = new Map(); // Adjacency list
        this.edges = []; // For Kruskal's algorithm
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

        // Generate maze based on selected algorithm
        switch (this.algorithm) {
            case 'backtracking':
                this._generateBacktracking();
                break;
            case 'prims':
                this._generatePrims();
                break;
            case 'kruskals':
                this._generateKruskals();
                break;
            case 'ellers':
                this._generateEllers();
                break;
            case 'binary':
                this._generateBinaryTree();
                break;
            case 'sidewinder':
                this._generateSidewinder();
                break;
            case 'huntandkill':
                this._generateHuntAndKill();
                break;
            default:
                this._generateBacktracking();
        }

        // Set start and end points
        this.grid[this.start.y][this.start.x] = 2;
        this.grid[this.end.y][this.end.x] = 3;

        // Ensure there's a path to the end
        this._ensureEndReachable();

        return this;
    }

    // ==========================================
    // GENERATION ALGORITHMS
    // ==========================================

    /**
     * Recursive Backtracking (DFS-based)
     * Creates long, winding corridors
     * Properties: Perfect maze, high "river" factor
     */
    _generateBacktracking() {
        this._carve(1, 1);
    }

    _carve(x, y) {
        this.grid[y][x] = 1;
        const directions = this._shuffle([[0, -2], [2, 0], [0, 2], [-2, 0]]);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (this._isInBounds(nx, ny) && this.grid[ny][nx] === 0) {
                this.grid[y + dy / 2][x + dx / 2] = 1;
                this._carve(nx, ny);
            }
        }
    }

    /**
     * Randomized Prim's Algorithm
     * Creates mazes with more branching, shorter dead ends
     * Based on minimum spanning tree
     */
    _generatePrims() {
        // Start with all cells as walls, pick a starting cell
        const startX = 1;
        const startY = 1;
        this.grid[startY][startX] = 1;

        // Frontier: walls that are adjacent to visited cells
        const frontier = [];
        this._addFrontier(startX, startY, frontier);

        while (frontier.length > 0) {
            // Pick random frontier cell
            const idx = Math.floor(Math.random() * frontier.length);
            const [fx, fy] = frontier.splice(idx, 1)[0];

            // Find visited neighbors (cells that are paths)
            const neighbors = this._getVisitedNeighbors(fx, fy);

            if (neighbors.length > 0) {
                // Pick random neighbor and connect
                const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];

                // Make frontier cell a path
                this.grid[fy][fx] = 1;

                // Make wall between frontier and neighbor a path
                const wallX = fx + (nx - fx) / 2;
                const wallY = fy + (ny - fy) / 2;
                this.grid[wallY][wallX] = 1;

                // Add new frontiers
                this._addFrontier(fx, fy, frontier);
            }
        }
    }

    _addFrontier(x, y, frontier) {
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (this._isInBounds(nx, ny) && this.grid[ny][nx] === 0) {
                // Check if not already in frontier
                if (!frontier.some(([fx, fy]) => fx === nx && fy === ny)) {
                    frontier.push([nx, ny]);
                }
            }
        }
    }

    _getVisitedNeighbors(x, y) {
        const neighbors = [];
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (this._isInBounds(nx, ny) && this.grid[ny][nx] === 1) {
                neighbors.push([nx, ny]);
            }
        }
        return neighbors;
    }

    /**
     * Randomized Kruskal's Algorithm
     * Creates uniformly random mazes
     * Uses Union-Find data structure
     */
    _generateKruskals() {
        // Initialize Union-Find
        const parent = new Map();
        const rank = new Map();

        const find = (cell) => {
            if (parent.get(cell) !== cell) {
                parent.set(cell, find(parent.get(cell)));
            }
            return parent.get(cell);
        };

        const union = (a, b) => {
            const rootA = find(a);
            const rootB = find(b);
            if (rootA === rootB) return false;

            if (rank.get(rootA) < rank.get(rootB)) {
                parent.set(rootA, rootB);
            } else if (rank.get(rootA) > rank.get(rootB)) {
                parent.set(rootB, rootA);
            } else {
                parent.set(rootB, rootA);
                rank.set(rootA, rank.get(rootA) + 1);
            }
            return true;
        };

        // Create cells and edges
        const cells = [];
        const edges = [];

        for (let y = 1; y < this.size - 1; y += 2) {
            for (let x = 1; x < this.size - 1; x += 2) {
                const cell = `${x},${y}`;
                cells.push([x, y]);
                parent.set(cell, cell);
                rank.set(cell, 0);

                // Add right edge
                if (x + 2 < this.size - 1) {
                    edges.push({ x1: x, y1: y, x2: x + 2, y2: y, wallX: x + 1, wallY: y });
                }
                // Add bottom edge
                if (y + 2 < this.size - 1) {
                    edges.push({ x1: x, y1: y, x2: x, y2: y + 2, wallX: x, wallY: y + 1 });
                }
            }
        }

        // Shuffle edges
        this._shuffle(edges);

        // Process edges
        for (const edge of edges) {
            const cellA = `${edge.x1},${edge.y1}`;
            const cellB = `${edge.x2},${edge.y2}`;

            if (union(cellA, cellB)) {
                // Connect cells
                this.grid[edge.y1][edge.x1] = 1;
                this.grid[edge.y2][edge.x2] = 1;
                this.grid[edge.wallY][edge.wallX] = 1;
            }
        }

        // Make sure all cells are paths
        for (const [x, y] of cells) {
            this.grid[y][x] = 1;
        }
    }

    /**
     * Eller's Algorithm
     * Memory efficient, generates row by row
     * Creates interesting horizontal patterns
     */
    _generateEllers() {
        let currentSets = new Map();
        let setCounter = 0;

        for (let y = 1; y < this.size - 1; y += 2) {
            const newSets = new Map();

            // Assign sets to cells in this row
            for (let x = 1; x < this.size - 1; x += 2) {
                this.grid[y][x] = 1;

                if (!currentSets.has(x)) {
                    currentSets.set(x, setCounter++);
                }
            }

            // Randomly join adjacent cells
            for (let x = 1; x < this.size - 3; x += 2) {
                const setA = currentSets.get(x);
                const setB = currentSets.get(x + 2);

                // Join if different sets (or randomly if not last row)
                const isLastRow = y === this.size - 2;
                if (setA !== setB && (Math.random() > 0.5 || isLastRow)) {
                    // Merge sets
                    this.grid[y][x + 1] = 1;
                    for (const [cx, cs] of currentSets) {
                        if (cs === setB) currentSets.set(cx, setA);
                    }
                }
            }

            // Create vertical connections (not for last row)
            if (y + 2 < this.size) {
                // Group cells by set
                const setGroups = new Map();
                for (const [x, set] of currentSets) {
                    if (!setGroups.has(set)) setGroups.set(set, []);
                    setGroups.get(set).push(x);
                }

                // Each set must have at least one downward connection
                for (const [set, cells] of setGroups) {
                    this._shuffle(cells);
                    const connectCount = Math.max(1, Math.floor(Math.random() * cells.length) + 1);

                    for (let i = 0; i < connectCount; i++) {
                        const x = cells[i];
                        this.grid[y + 1][x] = 1;
                        this.grid[y + 2][x] = 1;
                        newSets.set(x, set);
                    }
                }
            }

            currentSets = newSets.size > 0 ? newSets : new Map();
        }
    }

    /**
     * Binary Tree Algorithm
     * Very fast, but biased (NE corner always reachable)
     * Creates distinctive diagonal texture
     */
    _generateBinaryTree() {
        for (let y = 1; y < this.size - 1; y += 2) {
            for (let x = 1; x < this.size - 1; x += 2) {
                this.grid[y][x] = 1;

                const canGoNorth = y > 1;
                const canGoWest = x > 1;

                if (canGoNorth && canGoWest) {
                    // Randomly choose north or west
                    if (Math.random() > 0.5) {
                        this.grid[y - 1][x] = 1;
                    } else {
                        this.grid[y][x - 1] = 1;
                    }
                } else if (canGoNorth) {
                    this.grid[y - 1][x] = 1;
                } else if (canGoWest) {
                    this.grid[y][x - 1] = 1;
                }
            }
        }
    }

    /**
     * Sidewinder Algorithm
     * Similar to Binary Tree but more variety
     * Creates horizontal runs with vertical connections
     */
    _generateSidewinder() {
        for (let y = 1; y < this.size - 1; y += 2) {
            let runStart = 1;

            for (let x = 1; x < this.size - 1; x += 2) {
                this.grid[y][x] = 1;

                const atEasternBoundary = x + 2 >= this.size - 1;
                const atNorthernBoundary = y <= 1;
                const shouldCloseRun = atEasternBoundary || (!atNorthernBoundary && Math.random() > 0.5);

                if (shouldCloseRun) {
                    // Close the run: carve north from random cell in run
                    if (!atNorthernBoundary) {
                        const runCells = [];
                        for (let rx = runStart; rx <= x; rx += 2) {
                            runCells.push(rx);
                        }
                        const randomX = runCells[Math.floor(Math.random() * runCells.length)];
                        this.grid[y - 1][randomX] = 1;
                    }
                    runStart = x + 2;
                } else {
                    // Carve east
                    this.grid[y][x + 1] = 1;
                }
            }
        }
    }

    /**
     * Hunt and Kill Algorithm
     * Like backtracking but "hunts" for unvisited cells
     * Creates long, winding passages
     */
    _generateHuntAndKill() {
        let currentX = 1;
        let currentY = 1;
        this.grid[currentY][currentX] = 1;

        while (true) {
            // Walk phase: random walk from current cell
            const neighbors = this._getUnvisitedNeighbors(currentX, currentY);

            if (neighbors.length > 0) {
                const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];

                // Carve path
                const wallX = currentX + (nx - currentX) / 2;
                const wallY = currentY + (ny - currentY) / 2;
                this.grid[wallY][wallX] = 1;
                this.grid[ny][nx] = 1;

                currentX = nx;
                currentY = ny;
            } else {
                // Hunt phase: find unvisited cell adjacent to visited cell
                let found = false;

                for (let y = 1; y < this.size - 1 && !found; y += 2) {
                    for (let x = 1; x < this.size - 1 && !found; x += 2) {
                        if (this.grid[y][x] === 0) {
                            const visitedNeighbors = this._getVisitedNeighbors(x, y);
                            if (visitedNeighbors.length > 0) {
                                // Found a cell to continue from
                                const [vx, vy] = visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];

                                // Carve path
                                const wallX = x + (vx - x) / 2;
                                const wallY = y + (vy - y) / 2;
                                this.grid[wallY][wallX] = 1;
                                this.grid[y][x] = 1;

                                currentX = x;
                                currentY = y;
                                found = true;
                            }
                        }
                    }
                }

                if (!found) break; // Maze complete
            }
        }
    }

    _getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (this._isInBounds(nx, ny) && this.grid[ny][nx] === 0) {
                neighbors.push([nx, ny]);
            }
        }
        return neighbors;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Ensure the end point is reachable
     */
    _ensureEndReachable() {
        const ex = this.end.x;
        const ey = this.end.y;

        this.grid[ey][ex] = 1;

        const neighbors = [
            [ex - 1, ey], [ex + 1, ey],
            [ex, ey - 1], [ex, ey + 1]
        ];

        const hasPathNeighbor = neighbors.some(([nx, ny]) =>
            this._isInBounds(nx, ny) && this.grid[ny][nx] === 1
        );

        if (!hasPathNeighbor) {
            for (const [nx, ny] of neighbors) {
                if (this._isInBounds(nx, ny)) {
                    this.grid[ny][nx] = 1;
                    break;
                }
            }
        }

        this.grid[ey][ex] = 3;
    }

    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    _isInBounds(x, y) {
        return x > 0 && x < this.size - 1 && y > 0 && y < this.size - 1;
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return false;
        }
        return this.grid[y][x] !== 0;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isWalkable(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }

    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return 0;
        }
        return this.grid[y][x];
    }

    getData() {
        return {
            size: this.size,
            grid: this.grid,
            start: this.start,
            end: this.end,
            algorithm: this.algorithm
        };
    }

    /**
     * Get algorithm description
     */
    static getAlgorithmInfo(algorithm) {
        const info = {
            backtracking: {
                name: 'Recursive Backtracking',
                description: 'Crea corredores largos y sinuosos. Basado en DFS.',
                complexity: 'Media'
            },
            prims: {
                name: "Prim's Algorithm",
                description: 'Laberintos con más ramificaciones. Basado en MST.',
                complexity: 'Alta'
            },
            kruskals: {
                name: "Kruskal's Algorithm",
                description: 'Laberintos uniformemente aleatorios. Usa Union-Find.',
                complexity: 'Alta'
            },
            ellers: {
                name: "Eller's Algorithm",
                description: 'Genera fila por fila. Eficiente en memoria.',
                complexity: 'Media'
            },
            binary: {
                name: 'Binary Tree',
                description: 'Muy rápido. Crea textura diagonal característica.',
                complexity: 'Baja'
            },
            sidewinder: {
                name: 'Sidewinder',
                description: 'Similar a Binary Tree con más variedad.',
                complexity: 'Baja'
            },
            huntandkill: {
                name: 'Hunt and Kill',
                description: 'Crea pasajes largos. Similar a backtracking.',
                complexity: 'Media'
            }
        };
        return info[algorithm] || info.backtracking;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Maze;
}
