// Map Generator for Mining Game
// Creates bell jar-shaped maps with home base area

class MapGenerator {
    constructor() {
        // Map size constants
        this.MAP_WIDTH = 20;
        this.MAP_HEIGHT = 24;
        
        // Zone boundaries
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
    
    generateMap() {
        const grid = [];
        
        // Initialize grid with empty terrain
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            grid[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                grid[y][x] = TerrainType.EMPTY;
            }
        }
        
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
    
    // Get a safe starting position for the player
    getPlayerStartPosition() {
        // Start in the home base area
        return {
            x: Math.floor(this.MAP_WIDTH / 2),
            y: Math.floor(this.HOME_BASE_HEIGHT / 2)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapGenerator;
}