// Tile Patterns Data
// Defines the mapping between corner combinations and tilemap indices

const TerrainType = {
    EMPTY: 0,
    DIGGABLE: 1,
    UNDIGGABLE: 2
};

// Constants for tile dimensions
const TILE_SIZE = 100; // Size of each tile in the source tilemap
const TILEMAP_WIDTH = 4; // Number of tiles wide in the tilemap

// Pattern matching data
// Each pattern represents a corner combination (TL, TR, BL, BR)
// Index corresponds to position in the tilemap (row * 4 + col)
const TILE_PATTERNS = [
    // Row 0 (indices 0-3)
    { tl: 0, tr: 0, bl: 0, br: 0, index: 0 }, // All empty
    { tl: 0, tr: 0, bl: 0, br: 1, index: 1 }, // BR diggable
    { tl: 0, tr: 0, bl: 1, br: 0, index: 2 }, // BL diggable
    { tl: 0, tr: 0, bl: 1, br: 1, index: 3 }, // Bottom diggable
    
    // Row 1 (indices 4-7)
    { tl: 0, tr: 1, bl: 0, br: 0, index: 4 }, // TR diggable
    { tl: 0, tr: 1, bl: 0, br: 1, index: 5 }, // Right diggable
    { tl: 0, tr: 1, bl: 1, br: 0, index: 6 }, // Diagonal TR-BL
    { tl: 0, tr: 1, bl: 1, br: 1, index: 7 }, // All but TL
    
    // Row 2 (indices 8-11)
    { tl: 1, tr: 0, bl: 0, br: 0, index: 8 }, // TL diggable
    { tl: 1, tr: 0, bl: 0, br: 1, index: 9 }, // Diagonal TL-BR
    { tl: 1, tr: 0, bl: 1, br: 0, index: 10 }, // Left diggable
    { tl: 1, tr: 0, bl: 1, br: 1, index: 11 }, // All but TR
    
    // Row 3 (indices 12-15)
    { tl: 1, tr: 1, bl: 0, br: 0, index: 12 }, // Top diggable
    { tl: 1, tr: 1, bl: 0, br: 1, index: 13 }, // All but BL
    { tl: 1, tr: 1, bl: 1, br: 0, index: 14 }, // All but BR
    { tl: 1, tr: 1, bl: 1, br: 1, index: 15 }, // All diggable
];

// Generate pattern lookup map for faster access
// Key format: "tl,tr,bl,br" -> pattern object
const PATTERN_LOOKUP = new Map();

// Helper function to generate all possible patterns for all terrain types
function initializePatternLookup() {
    // For now, we'll handle basic patterns
    // This can be expanded to include all 81 combinations (3^4)
    
    // Generate patterns for each combination
    for (let tl = 0; tl <= 2; tl++) {
        for (let tr = 0; tr <= 2; tr++) {
            for (let bl = 0; bl <= 2; bl++) {
                for (let br = 0; br <= 2; br++) {
                    const key = `${tl},${tr},${bl},${br}`;
                    
                    // Map to simplified pattern for now (treating undiggable as diggable visually)
                    // This is a simplification - you'll need to expand this based on your tilemap
                    const simplifiedTl = tl === 0 ? 0 : 1;
                    const simplifiedTr = tr === 0 ? 0 : 1;
                    const simplifiedBl = bl === 0 ? 0 : 1;
                    const simplifiedBr = br === 0 ? 0 : 1;
                    
                    // Find matching pattern
                    const pattern = TILE_PATTERNS.find(p => 
                        p.tl === simplifiedTl && 
                        p.tr === simplifiedTr && 
                        p.bl === simplifiedBl && 
                        p.br === simplifiedBr
                    );
                    
                    if (pattern) {
                        PATTERN_LOOKUP.set(key, pattern.index);
                    } else {
                        // Default to fully empty or fully solid based on majority
                        const solidCount = (tl > 0 ? 1 : 0) + (tr > 0 ? 1 : 0) + 
                                         (bl > 0 ? 1 : 0) + (br > 0 ? 1 : 0);
                        PATTERN_LOOKUP.set(key, solidCount >= 2 ? 15 : 0);
                    }
                }
            }
        }
    }
}

// Initialize the lookup table
initializePatternLookup();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TerrainType, TILE_SIZE, TILEMAP_WIDTH, PATTERN_LOOKUP };
}