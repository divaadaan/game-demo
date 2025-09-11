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
    
    // Check if a visual grid position is in the home base area
    isVisualTileInHomeBase(visualX, visualY) {
        // A visual tile is in the home base if ANY of its four corners
        // (base grid samples) are in the home base area
        // This ensures proper visual coverage of the home base zone
        
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
    
    // NEW: Render base grid shadows - shows the skeleton of the map
    renderBaseGridShadows(ctx, offsetX, offsetY) {
        const tileSize = this.tileRenderer.RENDER_TILE_SIZE;
        
        // Shadow colors for base grid visualization
        const shadowColors = {
            [TerrainType.EMPTY]: 'rgba(200, 255, 200, 0.3)',    // Light green shadow
            [TerrainType.DIGGABLE]: 'rgba(139, 115, 85, 0.3)',  // Brown shadow
            [TerrainType.UNDIGGABLE]: 'rgba(50, 50, 50, 0.3)'   // Dark gray shadow
        };
        
        // Draw base grid shadows
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrainType = this.baseGrid[y][x];
                const screenX = x * tileSize + offsetX;
                const screenY = y * tileSize + offsetY;
                
                // Draw colored shadow for this base grid cell
                ctx.fillStyle = shadowColors[terrainType];
                ctx.fillRect(screenX, screenY, tileSize, tileSize);
                
                // Add subtle border to show base grid structure
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(screenX, screenY, tileSize, tileSize);
            }
        }
        
        // Highlight home base area if available
        if (this.mapGenerator) {
            ctx.fillStyle = 'rgba(144, 238, 144, 0.2)'; // Extra light green overlay for home base
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.mapGenerator.isInHomeBase(x, y)) {
                        const screenX = x * tileSize + offsetX;
                        const screenY = y * tileSize + offsetY;
                        ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    }
                }
            }
        }
    }
    
    // Unified grid rendering method that handles all grid visualization
    renderGridVisualization(ctx, offsetX, offsetY) {
        const tileSize = this.tileRenderer.RENDER_TILE_SIZE;
        
        // First, render base grid shadows to show the map skeleton
        this.renderBaseGridShadows(ctx, offsetX, offsetY);
        
        // Then render the grid lines on top
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); // Dashed lines for visual grid
        
        // Draw visual grid lines (these align with the visual tiles)
        for (let x = 0; x <= this.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize + offsetX, offsetY);
            ctx.lineTo(x * tileSize + offsetX, this.height * tileSize + offsetY);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.height; y++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, y * tileSize + offsetY);
            ctx.lineTo(this.width * tileSize + offsetX, y * tileSize + offsetY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset line dash
        
        // Add coordinate labels INSIDE the canvas area to avoid UI conflicts
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Label x-coordinates 
        for (let x = 0; x < this.width; x++) {
            const screenX = x * tileSize + tileSize / 2 + offsetX;
            const screenY = offsetY + 10;
            ctx.fillText(x.toString(), screenX, screenY);
        }
        
        // Label y-coordinates 
        ctx.textAlign = 'left';
        for (let y = 0; y < this.height; y++) {
            const screenX = offsetX + 5; 
            const screenY = y * tileSize + tileSize / 2 + offsetY;
            ctx.fillText(y.toString(), screenX, screenY);
        }
    }
    
    // Render the entire dual grid system
    render(ctx, offsetX = 0, offsetY = 0, showGrid = false, showBaseGrid = false) {
        // Clear canvas area
        const canvasWidth = this.width * this.tileRenderer.RENDER_TILE_SIZE;
        const canvasHeight = this.height * this.tileRenderer.RENDER_TILE_SIZE;
        ctx.clearRect(offsetX, offsetY, canvasWidth, canvasHeight);
        
        // Render base grid debug view if enabled (full debug mode)
        if (showBaseGrid) {
            this.tileRenderer.renderBaseGridDebug(ctx, this.baseGrid, offsetX, offsetY, this.mapGenerator);
        }
        
        // Render visual tiles
        // Visual grid has same dimensions as base grid but samples corners
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
        
        // Render grid visualization if enabled (includes base shadows + grid lines)
        if (showGrid && !showBaseGrid) {
            // Use the new unified grid visualization method
            this.renderGridVisualization(ctx, offsetX, offsetY);
        } else if (showGrid && showBaseGrid) {
            // If both are enabled, just draw grid lines since base grid debug is already shown
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