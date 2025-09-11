// Tile Renderer for Mining Game - Refactored with Better Encapsulation
// Handles loading and rendering tiles from the tilemap

class TileRenderer {
    constructor() {
        this.tilemapImage = null;
        this.tilemapLoaded = false;
        
        // Control whether to use tilemap or fallback
        this.USE_TILEMAP = false; // Set to true to attempt loading tilemap.png
        
        // Rendering constants
        this.RENDER_TILE_SIZE = 32; // Size to render tiles on screen
        this.SOURCE_TILE_SIZE = TILE_SIZE; // From tilePatterns.js (100px)
        
        // Debug colors for base grid visualization
        this.DEBUG_COLORS = {
            [TerrainType.EMPTY]: 'rgba(255, 255, 255, 0.5)',
            [TerrainType.DIGGABLE]: 'rgba(128, 128, 128, 0.5)',
            [TerrainType.UNDIGGABLE]: 'rgba(0, 0, 0, 0.5)'
        };
        
        // Home base color
        this.HOME_BASE_COLOR = '#90EE90'; // Light green
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
                console.log(`Tilemap loaded successfully - Expected size: ${TILEMAP_COLUMNS * this.SOURCE_TILE_SIZE}x${TILEMAP_ROWS * this.SOURCE_TILE_SIZE}`);
                console.log(`Actual size: ${this.tilemapImage.width}x${this.tilemapImage.height}`);
                resolve();
            };
            
            this.tilemapImage.onerror = () => {
                console.error('Failed to load tilemap, using fallback');
                this.createFallbackTiles();
                resolve();
            };
            
            this.tilemapImage.src = imagePath;
        });
    }
    
    createFallbackTiles() {
        // Create a canvas to generate all 80 colored tiles as fallback
        const canvas = document.createElement('canvas');
        canvas.width = this.SOURCE_TILE_SIZE * TILEMAP_COLUMNS;
        canvas.height = this.SOURCE_TILE_SIZE * TILEMAP_ROWS;
        
        const ctx = canvas.getContext('2d');
        
        console.log(`Creating fallback tilemap: ${canvas.width}x${canvas.height} (${TOTAL_TILES} tiles)`);
        
        // Generate all 80 tiles
        for (let i = 0; i < TOTAL_TILES; i++) {
            const pattern = getPatternByIndex(i);
            const x = pattern.gridX * this.SOURCE_TILE_SIZE;
            const y = pattern.gridY * this.SOURCE_TILE_SIZE;
            
            this.drawFallbackTile(ctx, x, y, pattern);
        }
        
        // Convert canvas to image
        this.tilemapImage = new Image();
        this.tilemapImage.src = canvas.toDataURL();
        this.tilemapLoaded = true;
        console.log(`Generated fallback tilemap with ${TOTAL_TILES} tiles in ${TILEMAP_COLUMNS}x${TILEMAP_ROWS} grid`);
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
        
        // Create more sophisticated visual effects for 80-tile system
        const drawQuadrant = (qx, qy, terrainType) => {
            // Base color
            ctx.fillStyle = colors[terrainType];
            ctx.fillRect(qx, qy, half, half);
            
            // Add subtle texture/pattern based on terrain type
            if (terrainType === 1) {
                // Add dots for diggable terrain
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                const dotSpacing = half / 4;
                for (let i = 1; i < 4; i++) {
                    for (let j = 1; j < 4; j++) {
                        ctx.beginPath();
                        ctx.arc(qx + i * dotSpacing, qy + j * dotSpacing, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (terrainType === 2) {
                // Add subtle stone texture for undiggable terrain
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let i = 1; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(qx, qy + i * (half / 4));
                    ctx.lineTo(qx + half, qy + i * (half / 4));
                    ctx.stroke();
                }
                // Add some vertical lines too
                for (let i = 1; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(qx + i * (half / 4), qy);
                    ctx.lineTo(qx + i * (half / 4), qy + half);
                    ctx.stroke();
                }
            }
        };
        
        // Draw each quadrant
        drawQuadrant(x, y, pattern.tl); // Top-left
        drawQuadrant(x + half, y, pattern.tr); // Top-right
        drawQuadrant(x, y + half, pattern.bl); // Bottom-left
        drawQuadrant(x + half, y + half, pattern.br); // Bottom-right
        
        // Add border between quadrants for clarity
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Vertical center line
        ctx.moveTo(x + half, y);
        ctx.lineTo(x + half, y + size);
        // Horizontal center line
        ctx.moveTo(x, y + half);
        ctx.lineTo(x + size, y + half);
        ctx.stroke();
        
        // Add tile border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, size, size);
        
        // Add pattern index for debugging (small text in corner)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(pattern.index.toString(), x + 2, y + 2);
    }
    
    // ========== PURE RENDERING METHODS (NO LOCATION CHECKS) ==========
    
    // Render a standard tile from the tilemap
    renderStandardTile(ctx, tileIndex, screenX, screenY) {
        if (!this.tilemapImage) return;
        
        // Handle special case: all-empty pattern
        if (tileIndex === -1) {
            this.renderEmptyTile(ctx, screenX, screenY);
            return;
        }

        // Validate tile index
        if (tileIndex < 0 || tileIndex >= TOTAL_TILES) {
            console.warn(`Invalid tile index: ${tileIndex}, using 0`);
            tileIndex = 0;
        }
        
        // Calculate source position in tilemap using 10x8 grid
        const pattern = getPatternByIndex(tileIndex);
        const sourceX = pattern.gridX * this.SOURCE_TILE_SIZE;
        const sourceY = pattern.gridY * this.SOURCE_TILE_SIZE;
        
        // Draw tile from tilemap to screen
        ctx.drawImage(
            this.tilemapImage,
            sourceX, sourceY, this.SOURCE_TILE_SIZE, this.SOURCE_TILE_SIZE,
            screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE
        );
    }
    
    // Render an empty tile (all corners are empty)
    renderEmptyTile(ctx, screenX, screenY) {
        const size = this.RENDER_TILE_SIZE;
        const half = size / 2;
        
        // Normal empty tile - draw four empty quadrants
        ctx.fillStyle = '#e8f4f8'; // Light blue-white (matching fallback empty color)
        ctx.fillRect(screenX, screenY, size, size);
        
        // Add quadrant dividers to match the tileset style
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Vertical center line
        ctx.moveTo(screenX + half, screenY);
        ctx.lineTo(screenX + half, screenY + size);
        // Horizontal center line
        ctx.moveTo(screenX, screenY + half);
        ctx.lineTo(screenX + size, screenY + half);
        ctx.stroke();
        
        // Add tile border to match other tiles
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX, screenY, size, size);
    }
    
    // Render a tile with home base background overlay
    renderHomeBaseTile(ctx, tileIndex, screenX, screenY) {
        // First draw light green background
        ctx.fillStyle = this.HOME_BASE_COLOR;
        ctx.fillRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
        
        // For empty tiles in home base, use lighter overlay
        if (tileIndex === -1) {
            // Draw semi-transparent empty tile overlay
            ctx.globalAlpha = 0.7;
            this.renderEmptyTile(ctx, screenX, screenY);
            ctx.globalAlpha = 1.0;
        } else {
            // For non-empty tiles, draw with reduced opacity
            ctx.globalAlpha = 0.3;
            this.renderStandardTile(ctx, tileIndex, screenX, screenY);
            ctx.globalAlpha = 1.0;
        }
        
        // Add subtle border to indicate home base
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.RENDER_TILE_SIZE, this.RENDER_TILE_SIZE);
    }
    
    // ========== DEBUG RENDERING METHODS ==========
    
    renderBaseGridDebug(ctx, baseGrid, offsetX, offsetY, mapGenerator) {
        const gridHeight = baseGrid.length;
        const gridWidth = baseGrid[0].length;
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const screenX = x * this.RENDER_TILE_SIZE + offsetX;
                const screenY = y * this.RENDER_TILE_SIZE + offsetY;
                
                // Check if this base grid position is in home base
                const isHomeBase = mapGenerator && mapGenerator.isInHomeBase(x, y);
                
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