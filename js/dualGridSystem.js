// Dual Grid System for Mining Game - Updated with Home Base Support
// Manages base grid (logic) and draw grid (visual) layers

class DualGridSystem {
    constructor(width, height, tileRenderer) {
        this.width = width;
        this.height = height;
        this.tileRenderer = tileRenderer;
        
        // Base grid stores terrain types at integer coordinates
        this.baseGrid = [];
        
        // Visual offset for draw grid (0.5, 0.5 from base grid)
        this.VISUAL_OFFSET = 0.5;
        
        // Initialize base grid
        this.initializeGrid();
    }
    
    initializeGrid() {
        for (let y = 0; y < this.height; y++) {
            this.baseGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.baseGrid[y][x] = TerrainType.EMPTY;
            }
        }
    }
    
    setBaseGrid(grid) {
        this.baseGrid = grid;
        this.height = grid.length;
        this.width = grid[0].length;
    }
    
    // Get terrain type at base grid position
    getTerrainAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TerrainType.UNDIGGABLE; // Treat out-of-bounds as undiggable
        }
        return this.baseGrid[y][x];
    }
    
    // Set terrain type at base grid position
    setTerrainAt(x, y, terrainType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.baseGrid[y][x] = terrainType;
        }
    }
    
    // Dig at specified position (convert diggable to empty)
    digAt(x, y) {
        if (this.getTerrainAt(x, y) === TerrainType.DIGGABLE) {
            this.setTerrainAt(x, y, TerrainType.EMPTY);
            return true;
        }
        return false;
    }
    
    // Get pattern for a visual tile based on its 4 corner samples
    getVisualTilePattern(visualX, visualY) {
        // Visual tile at (vx, vy) samples from base grid at:
        // TL: (vx, vy)
        // TR: (vx+1, vy)
        // BL: (vx, vy+1)  
        // BR: (vx+1, vy+1)
        
        const tl = this.getTerrainAt(visualX, visualY);
        const tr = this.getTerrainAt(visualX + 1, visualY);
        const bl = this.getTerrainAt(visualX, visualY + 1);
        const br = this.getTerrainAt(visualX + 1, visualY + 1);
        
        return { tl, tr, bl, br };
    }
    
    // Get tile index from pattern lookup
    getTileIndex(visualX, visualY) {
        const pattern = this.getVisualTilePattern(visualX, visualY);
        const key = `${pattern.tl},${pattern.tr},${pattern.bl},${pattern.br}`;
        
        // Get tile index from pattern lookup
        const tileIndex = PATTERN_LOOKUP.get(key);
        
        // Return found index or default to 0 (all empty)
        return tileIndex !== undefined ? tileIndex : 0;
    }
    
    // Render the entire dual grid system
    render(ctx, offsetX = 0, offsetY = 0, showGrid = false, showBaseGrid = false) {
        // Clear canvas area
        const canvasWidth = this.width * this.tileRenderer.RENDER_TILE_SIZE;
        const canvasHeight = this.height * this.tileRenderer.RENDER_TILE_SIZE;
        ctx.clearRect(offsetX, offsetY, canvasWidth, canvasHeight);
        
        // Render base grid debug view if enabled
        if (showBaseGrid) {
            this.tileRenderer.renderBaseGridDebug(ctx, this.baseGrid, offsetX, offsetY);
        }
        
        // Render visual tiles
        // Visual grid has same dimensions as base grid but samples corners
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileIndex = this.getTileIndex(x, y);
                const screenX = x * this.tileRenderer.RENDER_TILE_SIZE + offsetX;
                const screenY = y * this.tileRenderer.RENDER_TILE_SIZE + offsetY;
                
                // Pass grid coordinates for home base detection
                this.tileRenderer.renderTile(ctx, tileIndex, screenX, screenY, x, y);
            }
        }
        
        // Render grid lines if enabled
        if (showGrid) {
            this.tileRenderer.renderGridLines(ctx, this.width, this.height, offsetX, offsetY);
        }
    }
    
    // Get list of visual tiles that need updating when base position changes
    getAffectedVisualTiles(baseX, baseY) {
        // When base grid at (x,y) changes, up to 4 visual tiles are affected:
        // - Visual tile at (x-1, y-1) - uses this as BR corner
        // - Visual tile at (x, y-1) - uses this as BL corner  
        // - Visual tile at (x-1, y) - uses this as TR corner
        // - Visual tile at (x, y) - uses this as TL corner
        
        const affected = [];
        
        // Check each potentially affected visual tile
        const positions = [
            { x: baseX - 1, y: baseY - 1 },
            { x: baseX, y: baseY - 1 },
            { x: baseX - 1, y: baseY },
            { x: baseX, y: baseY }
        ];
        
        for (const pos of positions) {
            // Only include if within visual grid bounds
            if (pos.x >= 0 && pos.x < this.width && 
                pos.y >= 0 && pos.y < this.height) {
                affected.push(pos);
            }
        }
        
        return affected;
    }
    
    // Update specific visual tiles (for optimized rendering after digging)
    updateVisualTiles(ctx, tiles, offsetX = 0, offsetY = 0) {
        for (const tile of tiles) {
            const tileIndex = this.getTileIndex(tile.x, tile.y);
            const screenX = tile.x * this.tileRenderer.RENDER_TILE_SIZE + offsetX;
            const screenY = tile.y * this.tileRenderer.RENDER_TILE_SIZE + offsetY;
            
            // Clear tile area
            ctx.clearRect(screenX, screenY, 
                        this.tileRenderer.RENDER_TILE_SIZE, 
                        this.tileRenderer.RENDER_TILE_SIZE);
            
            // Render updated tile with visual grid coordinates for home base detection
            this.tileRenderer.renderTile(ctx, tileIndex, screenX, screenY, tile.x, tile.y);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualGridSystem;
}