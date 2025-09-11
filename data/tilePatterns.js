// Tile Patterns Data - Updated for 80 Tile Support (10x8 layout)
// Defines the mapping between corner combinations and tilemap indices

const TerrainType = {
    EMPTY: 0,
    DIGGABLE: 1,
    UNDIGGABLE: 2
};

// Constants for tile dimensions
const TILE_SIZE = 100; // Size of each tile in the source tilemap
const TILEMAP_COLUMNS = 10; // 10 columns for 80 tiles
const TILEMAP_ROWS = 8; // 8 rows for 80 tiles
const TOTAL_TILES = 80; // 80 tiles (excluding all-empty pattern)

// Generate all 80 possible patterns programmatically (excluding all-empty)
// Each pattern represents a corner combination (TL, TR, BL, BR)
// Index corresponds to pattern order, skipping (0,0,0,0)
const TILE_PATTERNS = [];

function generateAllPatterns() {
    let index = 0;
    
    for (let tl = 0; tl <= 2; tl++) {
        for (let tr = 0; tr <= 2; tr++) {
            for (let bl = 0; bl <= 2; bl++) {
                for (let br = 0; br <= 2; br++) {
                    // Skip the all-empty pattern (0,0,0,0)
                    if (tl === 0 && tr === 0 && bl === 0 && br === 0) {
                        continue;
                    }
                    
                    TILE_PATTERNS.push({
                        tl: tl,
                        tr: tr,
                        bl: bl,
                        br: br,
                        index: index,
                        patternName: `${tl}${tr}${bl}${br}`,
                        // Calculate grid position for 10x8 layout
                        gridX: index % TILEMAP_COLUMNS,
                        gridY: Math.floor(index / TILEMAP_COLUMNS)
                    });
                    index++;
                }
            }
        }
    }
}

// Generate the complete pattern set
generateAllPatterns();

// Generate pattern lookup map for O(1) access
// Key format: "tl,tr,bl,br" -> tile index
const PATTERN_LOOKUP = new Map();

function initializePatternLookup() {
    // Create direct mapping - each unique corner combination maps to its tile index
    for (const pattern of TILE_PATTERNS) {
        const key = `${pattern.tl},${pattern.tr},${pattern.bl},${pattern.br}`;
        PATTERN_LOOKUP.set(key, pattern.index);
    }
    
    // Special case: map all-empty (0,0,0,0) to a fallback
    // Since we don't have a dedicated tile for it, we'll handle it specially in the renderer
    PATTERN_LOOKUP.set('0,0,0,0', -1); // Special value to indicate "render as empty"
    
    console.log(`Initialized ${PATTERN_LOOKUP.size} tile patterns (80 tiles + 1 empty fallback)`);
}

// Initialize the lookup table
initializePatternLookup();

// Helper function to get pattern by corner values
function getPatternIndex(tl, tr, bl, br) {
    const key = `${tl},${tr},${bl},${br}`;
    const index = PATTERN_LOOKUP.get(key);
    
    // Return the index, or -1 for all-empty case
    return index !== undefined ? index : -1;
}

// Helper function to get pattern by index
function getPatternByIndex(index) {
    // Handle special case for all-empty
    if (index === -1) {
        return { tl: 0, tr: 0, bl: 0, br: 0, index: -1, patternName: '0000', gridX: 0, gridY: 0 };
    }
    return TILE_PATTERNS[index] || TILE_PATTERNS[0];
}

// Debug function to list all patterns
function debugPatterns() {
    console.log('All 80 tile patterns (excluding all-empty):');
    for (let i = 0; i < TILE_PATTERNS.length; i++) {
        const p = TILE_PATTERNS[i];
        console.log(`${i}: (${p.tl},${p.tr},${p.bl},${p.br}) -> Grid(${p.gridX},${p.gridY})`);
    }
    console.log('Special case: (0,0,0,0) -> Empty tile (no dedicated texture)');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TerrainType, 
        TILE_SIZE, 
        TILEMAP_COLUMNS,
        TILEMAP_ROWS,
        TOTAL_TILES,
        TILE_PATTERNS,
        PATTERN_LOOKUP,
        getPatternIndex,
        getPatternByIndex,
        debugPatterns
    };
}