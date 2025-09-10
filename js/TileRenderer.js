// Tile Renderer for Mining Game
// Handles loading and rendering tiles from the tilemap

class TileRenderer {
    constructor() {
        this.tilemapImage = null;
        this.tilemapLoaded = false;
        
        // Rendering constants
        this.RENDER_TILE_SIZE = 32; // Size to render tiles on screen
        this.SOURCE_TILE_SIZE = TILE_SIZE; // From tilePatterns.js (100px)
        
        // Debug colors for base grid visualization
        this.DEBUG_COLORS = {
            [TerrainType.EMPTY]: 'rgba(255, 255, 255, 0.5)',
            [TerrainType.DIGGABLE]: 'rgba(128, 128, 128, 0.5)',
            [TerrainType.UNDIGGABLE]: 'rgba(0, 0, 0, 0.5)'
        };
    }
    
    async loadTilemap(imagePath) {
        return new Promise((resolve, reject) => {
            this.tilemapImage = new Image();
            
            this.tilemapImage.onload = () => {
                this.tilemapLoaded = true;
                console.log('Tilemap loaded successfully');
                resolve();
            };
            
            this.tilemapImage.onerror = () => {
                console.error('Failed to load tilemap');
                // Create fallback colored tiles if image fails to load
                this.createFallbackTiles();
                resolve(); // Still resolve so game can continue with fallback
            };
            
            this.tilemapImage.src = imagePath;
        });
    }
    
    createFallbackTiles() {
        // Create a canvas to generate colored tiles as fallback
        const canvas = document.createElement('canvas');
        const tileCount = 16; // 4x4 grid of tiles
        canvas.width = this.SOURCE_TILE_SIZE * TILEMAP_WIDTH;
        canvas.height = this.SOURCE_TILE_SIZE * Math.ceil(tileCount / TILEMAP_WIDTH);
        
        const ctx = canvas.getContext('2d');
        
        // Generate basic colored tiles for each pattern
        for (let i = 0; i < tileCount; i++) {
            const col = i % TILEMAP_WIDTH;
            const row = Math.floor(i / TILEMAP_WIDTH);
            const x = col * this.SOURCE_TILE_SIZE;
            const y = row * this.SOURCE_TILE_SIZE;
            
            // Draw a tile based on pattern index
            const pattern = TILE_PATTERNS[i];
            if (pattern) {
                this.drawFallbackTile(ctx, x, y, pattern);
            }
        }
        
        // Convert canvas to image
        this.tilemapImage = new Image();
        this.tilemapImage.src = canvas.toDataURL();
        this.tilemapLoaded = true;
        console.log('Using fallback colored tiles');
    }
    
    drawFallbackTile(ctx, x, y, pattern) {
        const size = this.SOURCE_TILE_SIZE;
        const half = size / 2;
        
        // Clear tile area
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, size, size);
        
        // Draw each quadrant based on pattern
        const colors = {
            0: '#ffffff', // Empty
            1: '#808080', // Diggable
            2: '#000000'  // Undiggable
        };
        
        // Top-left
        ctx.fillStyle = colors[pattern.tl];
        ctx.fillRect(x, y, half, half);
        
        // Top-right
        ctx.fillStyle = colors[pattern.tr];
        ctx.fillRect(x + half, y, half, half);
        
        // Bottom-left
        ctx.fillStyle = colors[pattern.bl];
        ctx.fillRect(x, y + half, half, half);
        
        // Bottom-right
        ctx.fillStyle = colors[pattern.br];
        ctx.fillRect(x + half, y + half, half, half);
        
        // Add grid lines for clarity
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, size, size);
        ctx.beginPath();
        ctx.moveTo(x + half, y);
        ctx.lineTo(x + half, y + size);
        ctx.moveTo(x, y + half);
        ctx.lineTo(x + size, y + half);
        ctx.stroke();
    }
    
    renderTile(ctx, tileIndex, screenX, screenY) {
        if (!this.tilemapImage) return;
        
        // Calculate source position in tilemap
        const sourceCol = tileIndex % TILEMAP_WIDTH;
        const sourceRow = Math.floor(tileIndex / TILEMAP_WIDTH);
        const sourceX = sourceCol * this.SOURCE_TILE_SIZE;
        const sourceY = sourceRow * this.SOURCE_TILE_SIZE;
        
        // Draw tile from tilemap to screen
        ctx.drawImage(
            this.tilemapImage,
            sourceX, sourceY, this.SOURCE_TILE_SIZE, this.SOURCE_TILE_SIZE,
            screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE
        );
    }
    
    renderBaseGridDebug(ctx, baseGrid, offsetX, offsetY) {
        const gridHeight = baseGrid.length;
        const gridWidth = baseGrid[0].length;
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const screenX = x * this.RENDER_TILE_SIZE + offsetX;
                const screenY = y * this.RENDER_TILE_SIZE + offsetY;
                
                // Draw colored overlay
                ctx.fillStyle = this.DEBUG_COLORS[baseGrid[y][x]];
                ctx.fillRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
                
                // Draw grid lines
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.strokeRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
                
                // Draw terrain type number
                ctx.fillStyle = 'black';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    baseGrid[y][x].toString(),
                    screenX + this.RENDER_TILE_SIZE / 2,
                    screenY + this.RENDER_TILE_SIZE / 2
                );
            }
        }
    }
    
    renderGridLines(ctx, gridWidth, gridHeight, offsetX, offsetY) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.RENDER_TILE_SIZE + offsetX, offsetY);
            ctx.lineTo(x * this.RENDER_TILE_SIZE + offsetX, gridHeight * this.RENDER_TILE_SIZE + offsetY);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, y * this.RENDER_TILE_SIZE + offsetY);
            ctx.lineTo(gridWidth * this.RENDER_TILE_SIZE + offsetX, y * this.RENDER_TILE_SIZE + offsetY);
            ctx.stroke();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TileRenderer;
}