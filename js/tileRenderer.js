// Tile Renderer for Mining Game - Updated with Home Base Support
// Handles loading and rendering tiles from the tilemap with special home base coloring

class TileRenderer {
    constructor() {
        this.tilemapImage = null;
        this.tilemapLoaded = false;
        
        // Control whether to use tilemap or fallback
        this.USE_TILEMAP = false; // Set to true to attempt loading tilemap.png
        
        // Rendering constants
        this.RENDER_TILE_SIZE = 32; // Size to render tiles on screen
        this.SOURCE_TILE_SIZE = TILE_SIZE; // From tilePatterns.js (100px)
        
        // Reference to map generator for home base detection
        this.mapGenerator = null;
        
        // Debug colors for base grid visualization
        this.DEBUG_COLORS = {
            [TerrainType.EMPTY]: 'rgba(255, 255, 255, 0.5)',
            [TerrainType.DIGGABLE]: 'rgba(128, 128, 128, 0.5)',
            [TerrainType.UNDIGGABLE]: 'rgba(0, 0, 0, 0.5)'
        };
        
        // Home base color
        this.HOME_BASE_COLOR = '#90EE90'; // Light green
    }
    
    // Set reference to map generator for home base detection
    setMapGenerator(mapGenerator) {
        this.mapGenerator = mapGenerator;
    }
    
    async loadTilemap(imagePath) {
        // Check if we should use tilemap or go straight to fallback
        if (!this.USE_TILEMAP) {
            console.log('Tilemap loading disabled, using fallback colored tiles');
            this.createFallbackTiles();
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            this.tilemapImage = new Image();
            
            this.tilemapImage.onload = () => {
                this.tilemapLoaded = true;
                console.log('Tilemap loaded successfully');
                resolve();
            };
            
            this.tilemapImage.onerror = () => {
                console.error('Failed to load tilemap, using fallback');
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
        
        // Clear tile area with light background
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(x, y, size, size);
        
        // Draw each quadrant based on pattern with better colors
        const colors = {
            0: '#e8f4f8', // Empty - light blue-white
            1: '#8b7355', // Diggable - brown earth color
            2: '#2c2c2c'  // Undiggable - dark gray stone
        };
        
        // Create gradient effect for more visual appeal
        const drawQuadrant = (qx, qy, terrainType) => {
            // Base color
            ctx.fillStyle = colors[terrainType];
            ctx.fillRect(qx, qy, half, half);
            
            // Add subtle texture/pattern
            if (terrainType === 1) {
                // Add dots for diggable terrain
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        ctx.beginPath();
                        ctx.arc(qx + 8 + i * 16, qy + 8 + j * 16, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (terrainType === 2) {
                // Add lines for undiggable terrain
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(qx, qy + i * 16);
                    ctx.lineTo(qx + half, qy + i * 16);
                    ctx.stroke();
                }
            }
        };
        
        // Draw each quadrant
        drawQuadrant(x, y, pattern.tl); // Top-left
        drawQuadrant(x + half, y, pattern.tr); // Top-right
        drawQuadrant(x, y + half, pattern.bl); // Bottom-left
        drawQuadrant(x + half, y + half, pattern.br); // Bottom-right
        
        // Add subtle grid lines for clarity
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, size, size);
    }
    
    renderTile(ctx, tileIndex, screenX, screenY, gridX = null, gridY = null) {
        if (!this.tilemapImage) return;
        
        // Check if this tile is in the home base area
        const isHomeBase = this.mapGenerator && gridX !== null && gridY !== null && 
                           this.mapGenerator.isInHomeBase(gridX, gridY);
        
        if (isHomeBase) {
            // Render home base tile with light green background
            this.renderHomeBaseTile(ctx, tileIndex, screenX, screenY);
        } else {
            // Normal tile rendering
            this.renderNormalTile(ctx, tileIndex, screenX, screenY);
        }
    }
    
    renderNormalTile(ctx, tileIndex, screenX, screenY) {
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
    
    renderHomeBaseTile(ctx, tileIndex, screenX, screenY) {
        // First draw light green background
        ctx.fillStyle = this.HOME_BASE_COLOR;
        ctx.fillRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
        
        // Then draw the normal tile with some transparency
        ctx.globalAlpha = 0.3;
        this.renderNormalTile(ctx, tileIndex, screenX, screenY);
        ctx.globalAlpha = 1.0;
        
        // Add subtle border to indicate home base
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
    }
    
    renderBaseGridDebug(ctx, baseGrid, offsetX, offsetY) {
        const gridHeight = baseGrid.length;
        const gridWidth = baseGrid[0].length;
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const screenX = x * this.RENDER_TILE_SIZE + offsetX;
                const screenY = y * this.RENDER_TILE_SIZE + offsetY;
                
                // Check if this is home base
                const isHomeBase = this.mapGenerator && this.mapGenerator.isInHomeBase(x, y);
                
                // Draw colored overlay
                let fillColor = this.DEBUG_COLORS[baseGrid[y][x]];
                if (isHomeBase) {
                    fillColor = 'rgba(144, 238, 144, 0.7)'; // Light green with transparency
                }
                
                ctx.fillStyle = fillColor;
                ctx.fillRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
                
                // Draw grid lines
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.strokeRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
                
                // Draw terrain type number
                ctx.fillStyle = isHomeBase ? 'darkgreen' : 'black';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    baseGrid[y][x].toString(),
                    screenX + this.RENDER_TILE_SIZE / 2,
                    screenY + this.RENDER_TILE_SIZE / 2
                );
                
                // Add 'H' indicator for home base in debug mode
                if (isHomeBase) {
                    ctx.fillStyle = 'darkgreen';
                    ctx.font = '8px monospace';
                    ctx.fillText(
                        'H',
                        screenX + this.RENDER_TILE_SIZE / 2,
                        screenY + this.RENDER_TILE_SIZE / 2 + 8
                    );
                }
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