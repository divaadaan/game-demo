// Player class for Mining Game
// Handles player movement, rendering, and digging

class Player {
    constructor(x, y, gridSystem) {
        this.x = x;
        this.y = y;
        this.gridSystem = gridSystem;
        
        // Visual properties
        this.PLAYER_RADIUS = 12;
        this.PLAYER_COLOR = '#4a90e2';
        this.DIRECTION_INDICATOR_LENGTH = 8;
        this.DIRECTION_INDICATOR_COLOR = '#2c5aa0';
        
        // Direction the player is facing (for digging)
        this.direction = { x: 0, y: 1 }; // Default facing down
        
        // Animation properties
        this.animationOffset = 0;
        this.animationTime = 0;
        this.BOUNCE_SPEED = 0.003;
        this.BOUNCE_AMPLITUDE = 2;
    }
    
    // Attempt to move player to new position
    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // Check if new position is valid (within bounds and empty)
        if (this.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
            
            // Update direction if actually moving
            if (dx !== 0 || dy !== 0) {
                this.direction.x = dx;
                this.direction.y = dy;
            }
            
            return true;
        }
        
        // Even if can't move, update direction for digging
        if (dx !== 0 || dy !== 0) {
            this.direction.x = dx;
            this.direction.y = dy;
        }
        
        return false;
    }
    
    // Check if player can move to specified position
    canMoveTo(x, y) {
        // Check bounds
        if (x < 0 || x >= this.gridSystem.width || 
            y < 0 || y >= this.gridSystem.height) {
            return false;
        }
        
        // Can only move to empty tiles
        return this.gridSystem.getTerrainAt(x, y) === TerrainType.EMPTY;
    }
    
    // Attempt to dig in current facing direction
    dig() {
        const digX = this.x + this.direction.x;
        const digY = this.y + this.direction.y;
        
        // Attempt to dig at target position
        const success = this.gridSystem.digAt(digX, digY);
        
        if (success) {
            console.log(`Dug tile at (${digX}, ${digY})`);
            // Return affected visual tiles for updating
            return this.gridSystem.getAffectedVisualTiles(digX, digY);
        }
        
        return null;
    }
    
    // Update animation
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.animationOffset = Math.sin(this.animationTime * this.BOUNCE_SPEED) * this.BOUNCE_AMPLITUDE;
    }
    
    // Render the player
    render(ctx, offsetX = 0, offsetY = 0) {
        const tileSize = this.gridSystem.tileRenderer.RENDER_TILE_SIZE;
        
        // Calculate screen position (center of tile)
        const screenX = this.x * tileSize + tileSize / 2 + offsetX;
        const screenY = this.y * tileSize + tileSize / 2 + offsetY + this.animationOffset;
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX, this.y * tileSize + tileSize / 2 + offsetY + 4, 
                   this.PLAYER_RADIUS * 0.8, this.PLAYER_RADIUS * 0.4, 
                   0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player circle
        ctx.fillStyle = this.PLAYER_COLOR;
        ctx.strokeStyle = this.DIRECTION_INDICATOR_COLOR;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw direction indicator
        this.renderDirectionIndicator(ctx, screenX, screenY);
        
        // Draw dig preview (highlight tile that would be dug)
        this.renderDigPreview(ctx, offsetX, offsetY);
    }
    
    renderDirectionIndicator(ctx, centerX, centerY) {
        // Calculate direction indicator position
        const indicatorX = centerX + this.direction.x * this.DIRECTION_INDICATOR_LENGTH;
        const indicatorY = centerY + this.direction.y * this.DIRECTION_INDICATOR_LENGTH;
        
        // Draw direction line
        ctx.strokeStyle = this.DIRECTION_INDICATOR_COLOR;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(indicatorX, indicatorY);
        ctx.stroke();
        
        // Draw arrow head
        const arrowSize = 4;
        const angle = Math.atan2(this.direction.y, this.direction.x);
        
        ctx.fillStyle = this.DIRECTION_INDICATOR_COLOR;
        ctx.beginPath();
        ctx.moveTo(indicatorX, indicatorY);
        ctx.lineTo(
            indicatorX - arrowSize * Math.cos(angle - Math.PI / 6),
            indicatorY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            indicatorX - arrowSize * Math.cos(angle + Math.PI / 6),
            indicatorY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }
    
    renderDigPreview(ctx, offsetX, offsetY) {
        const digX = this.x + this.direction.x;
        const digY = this.y + this.direction.y;
        
        // Check if target tile is diggable
        if (this.gridSystem.getTerrainAt(digX, digY) === TerrainType.DIGGABLE) {
            const tileSize = this.gridSystem.tileRenderer.RENDER_TILE_SIZE;
            const screenX = digX * tileSize + offsetX;
            const screenY = digY * tileSize + offsetY;
            
            // Draw highlight
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
            ctx.setLineDash([]);
        }
    }
    
    // Get player grid position
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    // Set player position
    setPosition(x, y) {
        if (this.canMoveTo(x, y)) {
            this.x = x;
            this.y = y;
            return true;
        }
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}