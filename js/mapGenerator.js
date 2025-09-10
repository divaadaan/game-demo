// Map Generator for Mining Game
// Creates different types of maps for testing and gameplay

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
        
        // Zone boundaries for bell jar
        this.HOME_BASE_HEIGHT = 3;
        this.NECK_START = 6;
        this.NECK_END = 10;
        this.BODY_START = 10;
        
        // Terrain distribution for body
        this.BODY_EMPTY_CHANCE = 0.2;
        this.BODY_DIGGABLE_CHANCE = 0.6;
        this.BODY_UNDIGGABLE_CHANCE = 0.2;
        
        // Entrance configuration
        this.ENTRANCE_WIDTH = 3;
    }
    
    // Main method to generate map based on current type
    generateMap(mapType = null) {
        // Use provided type or fall back to current setting
        const typeToGenerate = mapType || this.currentMapType;
        
        console.log(`Generating map type: ${typeToGenerate}`);
        
        switch(typeToGenerate) {
            case this.MAP_TYPES.BELL_JAR:
                return this.generateBellJarMap();
            case this.MAP_TYPES.SIMPLE_BOX:
                return this.generateSimpleBoxMap();
            case this.MAP_TYPES.OPEN_FIELD:
                return this.generateOpenFieldMap();
            case this.MAP_TYPES.MAZE:
                return this.generateMazeMap();
            case this.MAP_TYPES.CAVERN:
                return this.generateCavernMap();
            default:
                console.warn(`Unknown map type: ${typeToGenerate}, using bell jar`);
                return this.generateBellJarMap();
        }
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
    
    // ========== BELL JAR MAP (Original) ==========
    generateBellJarMap() {
        const grid = this.createEmptyGrid();
        
        // Generate bell jar shape
        this.generateBorders(grid);
        this.generateHomeBase(grid);
        this.generateNeck(grid);
        this.generateBody(grid);
        this.generateEntrance(grid);
        
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
        // Home base area (top section) - mostly undiggable with entrance
        for (let y = 1; y < this.HOME_BASE_HEIGHT; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                grid[y][x] = TerrainType.EMPTY;
            }
        }
        
        // Separator between home base and rest of map
        const separatorY = this.HOME_BASE_HEIGHT;
        for (let x = 0; x < this.MAP_WIDTH; x++) {
            grid[separatorY][x] = TerrainType.UNDIGGABLE;
        }
    }
    
    generateEntrance(grid) {
        // Create entrance in the middle of the separator
        const entranceX = Math.floor((this.MAP_WIDTH - this.ENTRANCE_WIDTH) / 2);
        const separatorY = this.HOME_BASE_HEIGHT;
        
        for (let i = 0; i < this.ENTRANCE_WIDTH; i++) {
            grid[separatorY][entranceX + i] = TerrainType.DIGGABLE;
        }
    }
    
    generateNeck(grid) {
        // Neck area - narrow passage with undiggable edges
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
    
    generateBody(grid) {
        // Body area - wider section with mixed terrain
        for (let y = this.BODY_START; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                const rand = Math.random();
                
                if (rand < this.BODY_EMPTY_CHANCE) {
                    grid[y][x] = TerrainType.EMPTY;
                } else if (rand < this.BODY_EMPTY_CHANCE + this.BODY_DIGGABLE_CHANCE) {
                    grid[y][x] = TerrainType.DIGGABLE;
                } else {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        // Ensure some paths exist through the body
        this.carveRandomPaths(grid);
    }
    
    carveRandomPaths(grid) {
        // Carve a few guaranteed paths through the body
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
    
    // ========== SIMPLE BOX MAP ==========
    generateSimpleBoxMap() {
        const grid = this.createEmptyGrid();
        
        // Create undiggable border
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (y === 0 || y === this.MAP_HEIGHT - 1 || 
                    x === 0 || x === this.MAP_WIDTH - 1) {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                } else {
                    // Fill interior with diggable tiles
                    grid[y][x] = TerrainType.DIGGABLE;
                }
            }
        }
        
        // Create a small starting area at top
        for (let y = 1; y <= 3; y++) {
            for (let x = Math.floor(this.MAP_WIDTH / 2) - 2; 
                 x <= Math.floor(this.MAP_WIDTH / 2) + 2; x++) {
                if (x > 0 && x < this.MAP_WIDTH - 1) {
                    grid[y][x] = TerrainType.EMPTY;
                }
            }
        }
        
        return grid;
    }
    
    // ========== OPEN FIELD MAP ==========
    generateOpenFieldMap() {
        const grid = this.createEmptyGrid();
        
        // Create undiggable border
        this.generateBorders(grid);
        
        // Fill with mixed terrain
        for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                const rand = Math.random();
                if (rand < 0.3) {
                    grid[y][x] = TerrainType.EMPTY;
                } else if (rand < 0.8) {
                    grid[y][x] = TerrainType.DIGGABLE;
                } else {
                    grid[y][x] = TerrainType.UNDIGGABLE;
                }
            }
        }
        
        // Ensure starting area is clear
        const centerX = Math.floor(this.MAP_WIDTH / 2);
        const centerY = Math.floor(this.MAP_HEIGHT / 2);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x > 0 && x < this.MAP_WIDTH - 1 && 
                    y > 0 && y < this.MAP_HEIGHT - 1) {
                    grid[y][x] = TerrainType.EMPTY;
                }
            }
        }
        
        return grid;
    }
    
    // ========== MAZE MAP ==========
    generateMazeMap() {
        const grid = this.createEmptyGrid();
        
        // Fill everything with diggable first
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                grid[y][x] = TerrainType.DIGGABLE;
            }
        }
        
        // Create maze pattern with undiggable walls
        for (let y = 0; y < this.MAP_HEIGHT; y += 2) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                grid[y][x] = TerrainType.UNDIGGABLE;
            }
        }
        
        for (let x = 0; x < this.MAP_WIDTH; x += 2) {
            for (let y = 0; y < this.MAP_HEIGHT; y++) {
                grid[y][x] = TerrainType.UNDIGGABLE;
            }
        }
        
        // Create some openings
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * (this.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (this.MAP_HEIGHT - 2)) + 1;
            grid[y][x] = TerrainType.EMPTY;
        }
        
        // Clear starting area
        grid[1][1] = TerrainType.EMPTY;
        grid[1][2] = TerrainType.EMPTY;
        grid[2][1] = TerrainType.EMPTY;
        
        return grid;
    }
    
    // ========== CAVERN MAP ==========
    generateCavernMap() {
        const grid = this.createEmptyGrid();
        
        // Start with all undiggable
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                grid[y][x] = TerrainType.UNDIGGABLE;
            }
        }
        
        // Carve out cavern areas using cellular automata
        const caverns = [];
        for (let i = 0; i < 5; i++) {
            const cx = Math.floor(Math.random() * (this.MAP_WIDTH - 6)) + 3;
            const cy = Math.floor(Math.random() * (this.MAP_HEIGHT - 6)) + 3;
            const radius = Math.random() * 3 + 2;
            caverns.push({ x: cx, y: cy, r: radius });
        }
        
        // Create cavern areas
        for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                for (const cavern of caverns) {
                    const dist = Math.sqrt(
                        Math.pow(x - cavern.x, 2) + 
                        Math.pow(y - cavern.y, 2)
                    );
                    if (dist < cavern.r) {
                        grid[y][x] = TerrainType.EMPTY;
                    } else if (dist < cavern.r + 2) {
                        grid[y][x] = TerrainType.DIGGABLE;
                    }
                }
            }
        }
        
        // Connect caverns with tunnels
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
                    if (y > 0) grid[y - 1][x] = TerrainType.DIGGABLE;
                    if (y < this.MAP_HEIGHT - 1) grid[y + 1][x] = TerrainType.DIGGABLE;
                }
                x += x < tx ? 1 : -1;
            }
            
            // Carve vertical tunnel
            while (y !== ty) {
                if (grid[y] && grid[y][x] !== undefined) {
                    grid[y][x] = TerrainType.DIGGABLE;
                    if (x > 0) grid[y][x - 1] = TerrainType.DIGGABLE;
                    if (x < this.MAP_WIDTH - 1) grid[y][x + 1] = TerrainType.DIGGABLE;
                }
                y += y < ty ? 1 : -1;
            }
        }
        
        return grid;
    }
    
    // Get a safe starting position for the player
    getPlayerStartPosition() {
        // Different starting positions based on map type
        switch(this.currentMapType) {
            case this.MAP_TYPES.SIMPLE_BOX:
                return { x: Math.floor(this.MAP_WIDTH / 2), y: 2 };
            case this.MAP_TYPES.OPEN_FIELD:
                return { x: Math.floor(this.MAP_WIDTH / 2), y: Math.floor(this.MAP_HEIGHT / 2) };
            case this.MAP_TYPES.MAZE:
                return { x: 1, y: 1 };
            case this.MAP_TYPES.CAVERN:
                // Find first empty space
                for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
                    for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                        // This will be set after map generation
                        return { x: Math.floor(this.MAP_WIDTH / 2), y: Math.floor(this.MAP_HEIGHT / 2) };
                    }
                }
                return { x: Math.floor(this.MAP_WIDTH / 2), y: Math.floor(this.MAP_HEIGHT / 2) };
            case this.MAP_TYPES.BELL_JAR:
            default:
                return { x: Math.floor(this.MAP_WIDTH / 2), y: Math.floor(this.HOME_BASE_HEIGHT / 2) };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}