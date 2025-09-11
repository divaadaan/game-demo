// Map Generator for Mining Game - Refactored
// Creates different types of maps with consistent structure

class MapGenerator {
    constructor() {
        // Map size constants
        this.MAP_WIDTH = 20;
        this.MAP_HEIGHT = 24;
        
        // Available map types
        this.MAP_TYPES = {
            BELL_JAR: 'bellJar',
            SIMPLE_BOX: 'simpleBox',
            OPEN_FIELD: 'openField',
            MAZE: 'maze',
            CAVERN: 'cavern'
        };
        
        // Current map type
        this.currentMapType = this.MAP_TYPES.BELL_JAR; // Default
        
        // Consistent zone boundaries for all maps
        this.HOME_BASE_HEIGHT = 3;
        this.SEPARATOR_ROW = 3; // Row between home base and entrance
        this.NECK_START = 4;    // Start of neck area (after separator)
        this.NECK_END = 8;      // End of neck area
        this.BODY_START = 8;    // Start of main play area
        
        // Entrance configuration
        this.ENTRANCE_WIDTH = 3;
        
        // Home base color (light green) - this will be handled in the renderer
        this.HOME_BASE_TERRAIN = TerrainType.EMPTY; // Still empty for gameplay
    }
    
    // Main method to generate map based on current type
    generateMap(mapType = null) {
        // Use provided type or fall back to current setting
        const typeToGenerate = mapType || this.currentMapType;
        
        console.log(`Generating map type: ${typeToGenerate}`);
        
        // Create base structure that all maps share
        const grid = this.createBaseMapStructure();
        
        // Generate the specific play area for this map type
        this.generatePlayArea(grid, typeToGenerate);
        
        return grid;
    }
    
    // Set the current map type for future generations
    setMapType(mapType) {
        if (Object.values(this.MAP_TYPES).includes(mapType)) {
            this.currentMapType = mapType;
            console.log(`Map type set to: ${mapType}`);
        } else {
            console.warn(`Invalid map type: ${mapType}`);
        }
    }
    
    // Create the consistent base structure for all maps
    createBaseMapStructure() {
        const grid = this.createEmptyGrid();
        
        // 1. Generate undiggable borders
        this.generateBorders(grid);
        
        // 2. Generate home base area (consistent for all maps)
        this.generateHomeBase(grid);
        
        // 3. Generate separator with entrance (consistent for all maps)
        this.generateSeparatorWithEntrance(grid);
        
        // 4. Generate neck area (consistent for all maps)
        this.generateNeck(grid);
        
        return grid;
    }
    
    // Generate the play area specific to each map type
    generatePlayArea(grid, mapType) {
        switch(mapType) {
            case this.MAP_TYPES.BELL_JAR:
                this.generateBellJarPlayArea(grid);
                break;
            case this.MAP_TYPES.SIMPLE_BOX:
                this.generateSimpleBoxPlayArea(grid);
                break;
            case this.MAP_TYPES.OPEN_FIELD:
                this.generateOpenFieldPlayArea(grid);
                break;
            case this.MAP_TYPES.MAZE:
                this.generateMazePlayArea(grid);
                break;
            case this.MAP_TYPES.CAVERN:
                this.generateCavernPlayArea(grid);
                break;
            default:
                console.warn(`Unknown map type: ${mapType}, using bell jar`);
                this.generateBellJarPlayArea(grid);
        }
    }
    
    // ========== BASE STRUCTURE METHODS (SHARED) ==========
    
    // Initialize empty grid
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            grid[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                grid[y][x] = TerrainType.EMPTY;
            }
        }
        return grid;
    }
    
    generateBorders(grid) {
        // Left and right borders
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            grid[y][0] = TerrainType.UNDIGGABLE;
            grid[y][this.MAP_WIDTH - 1] = TerrainType.UNDIGGABLE;
        }
        
        // Top and bottom borders
        for (let x = 0; x < this.MAP_WIDTH; x++) {
            grid[0][x] = TerrainType.UNDIGGABLE;
            grid[this.MAP_HEIGHT - 1][x] = TerrainType.UNDIGGABLE;
        }
    }
    
    generateHomeBase(grid) {
        // Home base area (top section) - light green area where player spawns
        for (let y = 1; y < this.HOME_BASE_HEIGHT; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                grid[y][x] = TerrainType.EMPTY; // Will be rendered as light green
            }
        }
    }
    
    generateSeparatorWithEntrance(grid) {
        // Separator between home base and rest of map
        const separatorY = this.SEPARATOR_ROW;
        for (let x = 0; x < this.MAP_WIDTH; x++) {
            grid[separatorY][x] = TerrainType.UNDIGGABLE;
        }
        
        // Create entrance in the middle of the separator
        const entranceX = Math.floor((this.MAP_WIDTH - this.ENTRANCE_WIDTH) / 2);
        for (let i = 0; i < this.ENTRANCE_WIDTH; i++) {
            grid[separatorY][entranceX + i] = TerrainType.DIGGABLE;
        }
    }
    
    generateNeck(grid) {
        // Neck area - narrow passage with undiggable edges (same for all maps)
        const neckWidth = 8;
        const neckStart = Math.floor((this.MAP_WIDTH - neckWidth) / 2);
        
        for (let y = this.NECK_START; y < this.NECK_END; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                if (x < neckStart || x >= neckStart + neckWidth) {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                } else {
                    // Neck interior is mostly empty with some diggable
                    grid[y][x] = Math.random() < 0.3 ? TerrainType.DIGGABLE : TerrainType.EMPTY;
                }
            }
        }
        
        // Add some undiggable obstacles in the neck
        for (let y = this.NECK_START; y < this.NECK_END; y++) {
            for (let x = neckStart; x < neckStart + neckWidth; x++) {
                if (Math.random() < 0.1) {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
    }
    
    // ========== PLAY AREA METHODS (MAP-SPECIFIC) ==========
    
    generateBellJarPlayArea(grid) {
        // Body area - wider section with mixed terrain (original bell jar behavior)
        const BODY_EMPTY_CHANCE = 0.04;
        const BODY_DIGGABLE_CHANCE = 0.9;
        const BODY_UNDIGGABLE_CHANCE = 0.06;
        
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                const rand = Math.random();
                
                if (rand < BODY_EMPTY_CHANCE) {
                    grid[y][x] = TerrainType.EMPTY;
                } else if (rand < BODY_EMPTY_CHANCE + BODY_DIGGABLE_CHANCE) {
                    grid[y][x] = TerrainType.DIGGABLE;
                } else {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        // Ensure some paths exist through the body
        this.carveRandomPaths(grid);
    }
    
    generateSimpleBoxPlayArea(grid) {
        // Simple box: just fill the play area with diggable tiles
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                grid[y][x] = TerrainType.DIGGABLE;
            }
        }
    }
    
    generateOpenFieldPlayArea(grid) {
        // Open field: mixed terrain with more empty spaces
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                const rand = Math.random();
                if (rand < 0.4) {
                    grid[y][x] = TerrainType.EMPTY;
                } else if (rand < 0.8) {
                    grid[y][x] = TerrainType.DIGGABLE;
                } else {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        // Create some clear areas
        this.createClearings(grid);
    }
    
    generateMazePlayArea(grid) {
        // Maze: create a maze pattern in the play area
        // Start with all diggable
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                grid[y][x] = TerrainType.DIGGABLE;
            }
        }
        
        // Create maze walls with undiggable blocks
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y += 3) {
            for (let x = 2; x < this.MAP_WIDTH - 1; x += 3) {
                if (x < this.MAP_WIDTH - 1 && y < this.MAP_HEIGHT - 1) {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        for (let x = 2; x < this.MAP_WIDTH - 1; x += 3) {
            for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y += 3) {
                if (x < this.MAP_WIDTH - 1 && y < this.MAP_HEIGHT - 1) {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        // Create some openings in the maze
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * (this.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (this.MAP_HEIGHT - this.BODY_START - 1)) + this.BODY_START;
            grid[y][x] = TerrainType.EMPTY;
        }
    }
    
    generateCavernPlayArea(grid) {
        // Cavern: create cavern-like structures in the play area
        // Start with mostly undiggable
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                grid[y][x] = TerrainType.UNDIGGABLE;
            }
        }
        
        // Create cavern chambers
        const caverns = [];
        for (let i = 0; i < 4; i++) {
            const cx = Math.floor(Math.random() * (this.MAP_WIDTH - 8)) + 4;
            const cy = Math.floor(Math.random() * (this.MAP_HEIGHT - this.BODY_START - 4)) + this.BODY_START + 2;
            const radius = Math.random() * 2 + 2;
            caverns.push({ x: cx, y: cy, r: radius });
        }
        
        // Create cavern areas
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                for (const cavern of caverns) {
                    const dist = Math.sqrt(
                        Math.pow(x - cavern.x, 2) + 
                        Math.pow(y - cavern.y, 2)
                    );
                    if (dist < cavern.r) {
                        grid[y][x] = TerrainType.EMPTY;
                    } else if (dist < cavern.r + 1.5) {
                        grid[y][x] = TerrainType.DIGGABLE;
                    }
                }
            }
        }
        
        // Connect caverns with tunnels
        this.connectCaverns(grid, caverns);
    }
    
    // ========== HELPER METHODS ==========
    
    carveRandomPaths(grid) {
        // Carve a few guaranteed paths through the body (for bell jar)
        const numPaths = 2;
        
        for (let p = 0; p < numPaths; p++) {
            let x = Math.floor(Math.random() * (this.MAP_WIDTH - 4)) + 2;
            let y = this.BODY_START;
            
            while (y < this.MAP_HEIGHT - 2) {
                grid[y][x] = TerrainType.EMPTY;
                
                // Random walk
                const direction = Math.random();
                if (direction < 0.3 && x > 2) {
                    x--;
                } else if (direction < 0.6 && x < this.MAP_WIDTH - 3) {
                    x++;
                }
                y++;
            }
        }
    }
    
    createClearings(grid) {
        // Create some open clearings for open field map
        const numClearings = 3;
        
        for (let i = 0; i < numClearings; i++) {
            const cx = Math.floor(Math.random() * (this.MAP_WIDTH - 8)) + 4;
            const cy = Math.floor(Math.random() * (this.MAP_HEIGHT - this.BODY_START - 4)) + this.BODY_START + 2;
            const radius = 2;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = cx + dx;
                    const y = cy + dy;
                    if (x > 0 && x < this.MAP_WIDTH - 1 && 
                        y >= this.BODY_START && y < this.MAP_HEIGHT - 1) {
                        if (dx * dx + dy * dy <= radius * radius) {
                            grid[y][x] = TerrainType.EMPTY;
                        }
                    }
                }
            }
        }
    }
    
    connectCaverns(grid, caverns) {
        // Connect caverns with tunnels (for cavern map)
        for (let i = 0; i < caverns.length - 1; i++) {
            const c1 = caverns[i];
            const c2 = caverns[i + 1];
            
            let x = Math.floor(c1.x);
            let y = Math.floor(c1.y);
            const tx = Math.floor(c2.x);
            const ty = Math.floor(c2.y);
            
            // Carve horizontal tunnel
            while (x !== tx) {
                if (grid[y] && grid[y][x] !== undefined) {
                    grid[y][x] = TerrainType.DIGGABLE;
                }
                x += x < tx ? 1 : -1;
            }
            
            // Carve vertical tunnel
            while (y !== ty) {
                if (grid[y] && grid[y][x] !== undefined) {
                    grid[y][x] = TerrainType.DIGGABLE;
                }
                y += y < ty ? 1 : -1;
            }
        }
    }
    
    // Get a safe starting position for the player (same for all maps)
    getPlayerStartPosition() {
        // Always spawn in the center of the home base area
        return { 
            x: Math.floor(this.MAP_WIDTH / 2), 
            y: Math.floor(this.HOME_BASE_HEIGHT / 2) 
        };
    }
    
    // Check if a position is in the home base area (for special rendering)
    isInHomeBase(x, y) {
        return y > 0 && y < this.HOME_BASE_HEIGHT && x > 0 && x < this.MAP_WIDTH - 1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}