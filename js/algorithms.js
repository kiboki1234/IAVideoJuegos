/**
 * Pathfinding Algorithms
 * Implements BFS, DFS, A*, and Dijkstra
 */

class PathfindingAlgorithms {
    constructor(maze) {
        this.maze = maze;
    }

    /**
     * Breadth-First Search (BFS)
     * Guarantees shortest path in unweighted graphs
     * Time: O(V + E), Space: O(V)
     */
    bfs(start, end) {
        const queue = [start];
        const visited = new Set();
        const parent = new Map();
        const visitedOrder = [];

        visited.add(this._hash(start));
        parent.set(this._hash(start), null);

        while (queue.length > 0) {
            const current = queue.shift();
            visitedOrder.push({ ...current });

            // Found the goal
            if (current.x === end.x && current.y === end.y) {
                return {
                    path: this._reconstructPath(parent, end),
                    visited: visitedOrder
                };
            }

            // Explore neighbors
            for (const neighbor of this.maze.getNeighbors(current.x, current.y)) {
                const hash = this._hash(neighbor);
                if (!visited.has(hash)) {
                    visited.add(hash);
                    parent.set(hash, current);
                    queue.push(neighbor);
                }
            }
        }

        return { path: [], visited: visitedOrder };
    }

    /**
     * Depth-First Search (DFS)
     * May not find shortest path, but explores deeply
     * Time: O(V + E), Space: O(V)
     */
    dfs(start, end) {
        const stack = [start];
        const visited = new Set();
        const parent = new Map();
        const visitedOrder = [];

        parent.set(this._hash(start), null);

        while (stack.length > 0) {
            const current = stack.pop();
            const hash = this._hash(current);

            if (visited.has(hash)) continue;
            visited.add(hash);
            visitedOrder.push({ ...current });

            // Found the goal
            if (current.x === end.x && current.y === end.y) {
                return {
                    path: this._reconstructPath(parent, end),
                    visited: visitedOrder
                };
            }

            // Explore neighbors (reverse order for natural traversal)
            const neighbors = this.maze.getNeighbors(current.x, current.y).reverse();
            for (const neighbor of neighbors) {
                const nHash = this._hash(neighbor);
                if (!visited.has(nHash)) {
                    parent.set(nHash, current);
                    stack.push(neighbor);
                }
            }
        }

        return { path: [], visited: visitedOrder };
    }

    /**
     * A* Algorithm
     * Uses Manhattan distance heuristic for optimal pathfinding
     * Time: O(E log V), Space: O(V)
     */
    astar(start, end) {
        // Priority queue implementation using array (min-heap would be better for large mazes)
        const openSet = [{ node: start, f: 0 }];
        const closedSet = new Set();
        const gScore = new Map();
        const parent = new Map();
        const visitedOrder = [];

        gScore.set(this._hash(start), 0);
        parent.set(this._hash(start), null);

        while (openSet.length > 0) {
            // Get node with lowest f-score
            openSet.sort((a, b) => a.f - b.f);
            const { node: current } = openSet.shift();
            const currentHash = this._hash(current);

            if (closedSet.has(currentHash)) continue;
            closedSet.add(currentHash);
            visitedOrder.push({ ...current });

            // Found the goal
            if (current.x === end.x && current.y === end.y) {
                return {
                    path: this._reconstructPath(parent, end),
                    visited: visitedOrder
                };
            }

            // Explore neighbors
            for (const neighbor of this.maze.getNeighbors(current.x, current.y)) {
                const neighborHash = this._hash(neighbor);
                if (closedSet.has(neighborHash)) continue;

                const tentativeG = gScore.get(currentHash) + 1;

                if (!gScore.has(neighborHash) || tentativeG < gScore.get(neighborHash)) {
                    gScore.set(neighborHash, tentativeG);
                    parent.set(neighborHash, current);

                    const h = this._manhattan(neighbor, end);
                    const f = tentativeG + h;

                    openSet.push({ node: neighbor, f });
                }
            }
        }

        return { path: [], visited: visitedOrder };
    }

    /**
     * Dijkstra's Algorithm
     * Finds shortest path (same as BFS for unweighted graphs)
     * Time: O(E log V), Space: O(V)
     */
    dijkstra(start, end) {
        const openSet = [{ node: start, dist: 0 }];
        const closedSet = new Set();
        const distance = new Map();
        const parent = new Map();
        const visitedOrder = [];

        distance.set(this._hash(start), 0);
        parent.set(this._hash(start), null);

        while (openSet.length > 0) {
            // Get node with smallest distance
            openSet.sort((a, b) => a.dist - b.dist);
            const { node: current, dist: currentDist } = openSet.shift();
            const currentHash = this._hash(current);

            if (closedSet.has(currentHash)) continue;
            closedSet.add(currentHash);
            visitedOrder.push({ ...current });

            // Found the goal
            if (current.x === end.x && current.y === end.y) {
                return {
                    path: this._reconstructPath(parent, end),
                    visited: visitedOrder
                };
            }

            // Explore neighbors
            for (const neighbor of this.maze.getNeighbors(current.x, current.y)) {
                const neighborHash = this._hash(neighbor);
                if (closedSet.has(neighborHash)) continue;

                const newDist = currentDist + 1;

                if (!distance.has(neighborHash) || newDist < distance.get(neighborHash)) {
                    distance.set(neighborHash, newDist);
                    parent.set(neighborHash, current);
                    openSet.push({ node: neighbor, dist: newDist });
                }
            }
        }

        return { path: [], visited: visitedOrder };
    }

    /**
     * Manhattan distance heuristic
     */
    _manhattan(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Create hash for position
     */
    _hash(pos) {
        return `${pos.x},${pos.y}`;
    }

    /**
     * Reconstruct path from parent map
     */
    _reconstructPath(parent, end) {
        const path = [];
        let current = end;

        while (current !== null) {
            path.unshift({ ...current });
            current = parent.get(this._hash(current));
        }

        return path;
    }

    /**
     * Get algorithm by name
     */
    solve(algorithm, start, end) {
        switch (algorithm) {
            case 'bfs':
                return this.bfs(start, end);
            case 'dfs':
                return this.dfs(start, end);
            case 'astar':
                return this.astar(start, end);
            case 'dijkstra':
                return this.dijkstra(start, end);
            default:
                return this.bfs(start, end);
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathfindingAlgorithms;
}
