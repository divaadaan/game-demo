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
        
        // Reference to map generator for home base detection
        this.mapGenerator = null;
        
        // Initialize base grid
        this.initializeGrid();
    }
    
    // Set the map generator reference
    setMapGenerator(mapGenerator) {
        this.mapGenerator = mapGenerator;
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
        
        // Return found index or default to 0
        return tileIndex !== undefined ? tileIndex : 0;
    }
    
    // Check if a visual grid position is in the home base area
    isVisualTileInHomeBase(visualX, visualY) {
        if (!this.mapGenerator) return false;
        
        // Check all four corners that this visual tile samples from
        const corners = [
            { x: visualX, y: visualY },         // Top-left
            { x: visualX + 1, y: visualY },     // Top-right
            { x: visualX, y: visualY + 1 },     // Bottom-left
            { x: visualX + 1, y: visualY + 1 }  // Bottom-right
        ];
        
        // If any corner is in the home base, render this visual tile as home base
        for (const corner of corners) {
            if (this.mapGenerator.isInHomeBase(corner.x, corner.y)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Render the draw layer (visual tiles)
    renderDrawLayer(ctx, offsetX, offsetY) {
        // Render visual tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileIndex = this.getTileIndex(x, y);
                const screenX = x * this.tileRenderer.RENDER_TILE_SIZE + offsetX;
                const screenY = y * this.tileRenderer.RENDER_TILE_SIZE + offsetY;
                
                // Check if this visual tile is in the home base area
                if (this.isVisualTileInHomeBase(x, y)) {
                    // Render with home base styling
                    this.tileRenderer.renderHomeBaseTile(ctx, tileIndex, screenX, screenY);
                } else {
                    // Render standard tile
                    this.tileRenderer.renderStandardTile(ctx, tileIndex, screenX, screenY);
                }
            }
        }
    }
    
    // Render the base layer (logic grid)
    renderBaseLayer(ctx, offsetX, offsetY) {
        // Render base grid debug view
        this.tileRenderer.renderBaseGridDebug(ctx, this.baseGrid, offsetX, offsetY, this.mapGenerator);
    }
    
    // Main render method - refactored to use view modes
    render(ctx, offsetX = 0, offsetY = 0, viewMode = 'draw', showGridLines = false) {
        // Clear canvas area
        const canvasWidth = this.width * this.tileRenderer.RENDER_TILE_SIZE;
        const canvasHeight = this.height * this.tileRenderer.RENDER_TILE_SIZE;
        ctx.clearRect(offsetX, offsetY, canvasWidth, canvasHeight);
        
        // Render the appropriate layer based on view mode
        if (viewMode === 'base') {
            this.renderBaseLayer(ctx, offsetX, offsetY);
        } else {
            // Default to draw layer
            this.renderDrawLayer(ctx, offsetX, offsetY);
        }
        
        // Render grid lines if enabled
        if (showGridLines) {
            this.tileRenderer.renderGridLines(ctx, this.width, this.height, offsetX, offsetY);
        }
    }
    
    // Get list of visual tiles that need updating when base position changes
    getAffectedVisualTiles(baseX, baseY) {
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
            
            // Check if this visual tile is in the home base area
            if (this.isVisualTileInHomeBase(tile.x, tile.y)) {
                // Render with home base styling
                this.tileRenderer.renderHomeBaseTile(ctx, tileIndex, screenX, screenY);
            } else {
                // Render standard tile
                this.tileRenderer.renderStandardTile(ctx, tileIndex, screenX, screenY);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DualGridSystem;
}