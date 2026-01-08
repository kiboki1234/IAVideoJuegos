/**
 * Game Controller
 * Main game logic and UI orchestration
 */

class Game {
    constructor() {
        // Canvas and renderer
        this.canvas = document.getElementById('mazeCanvas');
        this.renderer = new Renderer(this.canvas);

        // Game objects
        this.maze = null;
        this.npc = null;
        this.pathfinder = null;

        // State
        this.isRunning = false;
        this.isPaused = false;
        this.currentAlgorithm = 'bfs';
        this.mazeAlgorithm = 'backtracking';
        this.animationSpeed = 50;
        this.mazeSize = 21;

        // Animation
        this.animationFrameId = null;
        this.lastTime = 0;
        this.visitedQueue = [];
        this.visitedIndex = 0;
        this.solutionPath = [];
        this.phase = 'idle'; // idle, exploring, solving, following

        // Timing
        this.explorationDelay = 50;
        this.solutionDelay = 30;
        this.moveDelay = 100;
        this.lastStepTime = 0;

        // Metrics
        this.metrics = {
            nodesVisited: 0,
            pathLength: 0,
            startTime: 0,
            endTime: 0
        };

        // Initialize
        this._bindEvents();
        this._updateSpeedFromSlider();
    }

    /**
     * Bind UI events
     */
    _bindEvents() {
        // Algorithm selection
        document.querySelectorAll('.algo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentAlgorithm = btn.dataset.algo;
            });
        });

        // Maze algorithm selector
        const mazeAlgoSelect = document.getElementById('mazeAlgo');
        if (mazeAlgoSelect) {
            mazeAlgoSelect.addEventListener('change', () => {
                this.mazeAlgorithm = mazeAlgoSelect.value;
            });
        }

        // Maze size slider
        const sizeSlider = document.getElementById('mazeSize');
        const sizeValue = document.getElementById('sizeValue');
        sizeSlider.addEventListener('input', () => {
            let size = parseInt(sizeSlider.value);
            if (size % 2 === 0) size++; // Ensure odd
            this.mazeSize = size;
            sizeValue.textContent = `${size} × ${size}`;
        });

        // Speed slider
        const speedSlider = document.getElementById('speed');
        speedSlider.addEventListener('input', () => {
            this._updateSpeedFromSlider();
        });

        // Action buttons
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateMaze();
        });

        document.getElementById('solveBtn').addEventListener('click', () => {
            this.solve();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.maze) {
                this.renderer.init(this.maze);
                this.renderer.renderMaze();
            }
        });
    }

    /**
     * Update speed values from slider
     */
    _updateSpeedFromSlider() {
        const speed = parseInt(document.getElementById('speed').value);
        this.animationSpeed = speed;

        // Map speed to delays (inverse relationship)
        const speedFactor = 1 - (speed / 100);
        this.explorationDelay = 5 + speedFactor * 100;
        this.solutionDelay = 3 + speedFactor * 50;
        this.moveDelay = 20 + speedFactor * 150;

        if (this.npc) {
            this.npc.setSpeed(speed);
        }
    }

    /**
     * Generate a new maze
     */
    generateMaze() {
        this.stop();

        // Create new maze with selected algorithm
        this.maze = new Maze(this.mazeSize, this.mazeAlgorithm);
        this.maze.generate();

        // Initialize renderer
        this.renderer.init(this.maze);
        this.renderer.renderMaze();

        // Create NPC at start
        this.npc = new NPC(this.maze.start.x, this.maze.start.y);
        this.npc.setSpeed(this.animationSpeed);
        this.renderer.drawNPC(this.npc);

        // Create pathfinder
        this.pathfinder = new PathfindingAlgorithms(this.maze);

        // Hide overlay
        document.getElementById('overlay').classList.add('hidden');

        // Enable solve button
        document.getElementById('solveBtn').disabled = false;

        // Reset metrics
        this._resetMetrics();
    }

    /**
     * Start solving with selected algorithm
     */
    solve() {
        if (!this.maze || this.isRunning) return;

        // Reset visualization
        this.renderer.clear();
        this.renderer.renderMaze();

        // Reset NPC
        this.npc.reset(this.maze.start.x, this.maze.start.y);

        // Run algorithm
        this.metrics.startTime = performance.now();
        const result = this.pathfinder.solve(
            this.currentAlgorithm,
            this.maze.start,
            this.maze.end
        );
        this.metrics.endTime = performance.now();

        // Store results for animation
        this.visitedQueue = result.visited;
        this.solutionPath = result.path;
        this.visitedIndex = 0;

        // Update metrics
        this.metrics.nodesVisited = result.visited.length;
        this.metrics.pathLength = result.path.length;

        // Setup solution path for NPC
        this.npc.setPath(this.solutionPath);
        this.renderer.setSolutionPath(this.solutionPath);

        // Start animation
        this.isRunning = true;
        this.phase = 'exploring';
        this.lastStepTime = 0;

        // Update UI
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('solveBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.querySelector('.metrics-card').classList.add('solving');

        // Start animation loop
        this._animate(0);
    }

    /**
     * Main animation loop
     */
    _animate(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        switch (this.phase) {
            case 'exploring':
                this._animateExploration(currentTime);
                break;
            case 'solving':
                this._animateSolution(currentTime);
                break;
            case 'following':
                this._animateNPC(deltaTime);
                break;
            case 'complete':
                this._onComplete();
                return;
        }

        // Update display
        this._updateMetricsDisplay();

        this.animationFrameId = requestAnimationFrame((t) => this._animate(t));
    }

    /**
     * Animate exploration phase
     */
    _animateExploration(currentTime) {
        if (currentTime - this.lastStepTime < this.explorationDelay) return;
        this.lastStepTime = currentTime;

        if (this.visitedIndex < this.visitedQueue.length) {
            const cell = this.visitedQueue[this.visitedIndex];
            this.renderer.markVisited(cell.x, cell.y);
            this.visitedIndex++;
        } else {
            // Move to solution phase
            this.phase = 'solving';
            this.lastStepTime = 0;
        }
    }

    /**
     * Animate solution path
     */
    _animateSolution(currentTime) {
        if (currentTime - this.lastStepTime < this.solutionDelay) return;
        this.lastStepTime = currentTime;

        if (this.renderer.advanceSolution()) {
            // Still drawing solution
        } else {
            // Move to following phase
            this.phase = 'following';
        }
    }

    /**
     * Animate NPC following path
     */
    _animateNPC(deltaTime) {
        // Update NPC
        const isAnimating = this.npc.update(deltaTime);

        // Redraw
        this.renderer.redraw(this.npc);

        // Move to next cell if not animating
        if (!isAnimating) {
            if (!this.npc.moveToNext()) {
                // Reached end
                this.phase = 'complete';
            }
        }
    }

    /**
     * Handle completion
     */
    _onComplete() {
        this.isRunning = false;

        // Final redraw
        this.renderer.redraw(this.npc);

        // Update UI
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('solveBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.querySelector('.metrics-card').classList.remove('solving');

        // Final metrics update
        this._updateMetricsDisplay();
    }

    /**
     * Stop current animation
     */
    stop() {
        this.isRunning = false;
        this.phase = 'idle';

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Update UI
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('solveBtn').disabled = !this.maze;
        document.getElementById('stopBtn').disabled = true;
        document.querySelector('.metrics-card').classList.remove('solving');
    }

    /**
     * Reset metrics display
     */
    _resetMetrics() {
        this.metrics = {
            nodesVisited: 0,
            pathLength: 0,
            startTime: 0,
            endTime: 0
        };
        this._updateMetricsDisplay();
    }

    /**
     * Update metrics display
     */
    _updateMetricsDisplay() {
        const timeElapsed = this.metrics.endTime - this.metrics.startTime;

        document.getElementById('nodesVisited').textContent =
            this.phase === 'exploring' ? this.visitedIndex : this.metrics.nodesVisited;
        document.getElementById('pathLength').textContent = this.metrics.pathLength;
        document.getElementById('timeElapsed').textContent = `${timeElapsed.toFixed(1)} ms`;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
