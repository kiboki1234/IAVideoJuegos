/**
 * NPC (Non-Player Character)
 * Animated character that follows the pathfinding solution
 */

class NPC {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.targetX = startX;
        this.targetY = startY;
        this.displayX = startX;
        this.displayY = startY;

        // Animation properties
        this.animationProgress = 1;
        this.animationSpeed = 0.1;

        // Visual properties
        this.size = 0.7;
        this.color = '#ec4899';
        this.glowColor = 'rgba(236, 72, 153, 0.5)';

        // State
        this.isMoving = false;
        this.currentPath = [];
        this.pathIndex = 0;

        // Animation frame
        this.bounceOffset = 0;
        this.bounceTime = 0;
    }

    /**
     * Set the path for NPC to follow
     */
    setPath(path) {
        this.currentPath = path;
        this.pathIndex = 0;
        if (path.length > 0) {
            this.x = path[0].x;
            this.y = path[0].y;
            this.displayX = path[0].x;
            this.displayY = path[0].y;
        }
    }

    /**
     * Move to next point in path
     * Returns true if there are more points, false if finished
     */
    moveToNext() {
        if (this.pathIndex >= this.currentPath.length - 1) {
            this.isMoving = false;
            return false;
        }

        this.pathIndex++;
        const nextPoint = this.currentPath[this.pathIndex];

        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = nextPoint.x;
        this.targetY = nextPoint.y;
        this.animationProgress = 0;
        this.isMoving = true;

        return true;
    }

    /**
     * Update animation state
     * Returns true if still animating
     */
    update(deltaTime) {
        // Update bounce animation
        this.bounceTime += deltaTime * 0.005;
        this.bounceOffset = Math.sin(this.bounceTime * 5) * 0.05;

        // Update movement animation
        if (this.animationProgress < 1) {
            this.animationProgress += this.animationSpeed;
            if (this.animationProgress > 1) {
                this.animationProgress = 1;
            }

            // Smooth easing
            const t = this._easeInOutQuad(this.animationProgress);
            this.displayX = this.x + (this.targetX - this.x) * t;
            this.displayY = this.y + (this.targetY - this.y) * t;

            return true;
        }

        return false;
    }

    /**
     * Check if NPC has reached the end of path
     */
    hasReachedEnd() {
        return this.pathIndex >= this.currentPath.length - 1 && this.animationProgress >= 1;
    }

    /**
     * Check if NPC is currently animating
     */
    isAnimating() {
        return this.animationProgress < 1;
    }

    /**
     * Reset NPC to starting position
     */
    reset(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.targetX = startX;
        this.targetY = startY;
        this.displayX = startX;
        this.displayY = startY;
        this.animationProgress = 1;
        this.currentPath = [];
        this.pathIndex = 0;
        this.isMoving = false;
    }

    /**
     * Set animation speed (1-100)
     */
    setSpeed(speed) {
        // Map 1-100 to 0.02-0.3
        this.animationSpeed = 0.02 + (speed / 100) * 0.28;
    }

    /**
     * Get current position for rendering
     */
    getPosition() {
        return {
            x: this.displayX,
            y: this.displayY + this.bounceOffset
        };
    }

    /**
     * Easing function for smooth movement
     */
    _easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    /**
     * Get NPC render data
     */
    getRenderData() {
        return {
            x: this.displayX,
            y: this.displayY + this.bounceOffset,
            size: this.size,
            color: this.color,
            glowColor: this.glowColor,
            isMoving: this.isMoving
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPC;
}
