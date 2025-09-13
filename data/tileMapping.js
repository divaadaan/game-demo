// data/artistTileMapping.js
// Manual mapping between pattern indices and artist tilemap positions

// Artist tilemap layout info (adjust these based on actual tilemap)
const ARTIST_TILEMAP = {
    TILE_SIZE: 100,           // Size of each tile in artist's tilemap
    COLUMNS: 4,               // Actual columns in artist's tilemap
    ROWS: 20,                 // Actual rows (or whatever the layout is)
    TOTAL_TILES: 80           // Should match your pattern count
};

// Direct mapping: patternIndex -> { gridX, gridY }
// You'll manually populate this by examining the artist's tilemap
const PATTERN_TO_ARTIST_TILE = new Map([
    // Format: [patternIndex, { gridX, gridY }]
    // Example mappings - you'll need to fill these in manually
    [0, { gridX: 0, gridY: 0 }],    // Pattern "0001" -> artist tile at (0,0)
    [1, { gridX: 1, gridY: 0 }],    // Pattern "0002" -> artist tile at (1,0)
    [2, { gridX: 2, gridY: 0 }],    // Pattern "0010" -> artist tile at (2,0)
    [3, { gridX: 3, gridY: 0 }],    // Pattern "0011" -> artist tile at (3,0)
    [4, { gridX: 0, gridY: 1 }],    // Pattern "0012" -> artist tile at (0,1)
    // ... continue for all 80 patterns
    
    // You can organize these by pattern type for easier manual entry:
    
    // All corners same type
    [26, { gridX: 0, gridY: 5 }],   // Pattern "1111" (all diggable)
    [80, { gridX: 3, gridY: 19 }],  // Pattern "2222" (all undiggable) - last tile
    
    // Mixed patterns - organize however makes sense for your artist's layout
    // [someIndex, { gridX: x, gridY: y }],
]);

// Reverse lookup for debugging: artist position -> pattern
const ARTIST_TILE_TO_PATTERN = new Map();
for (const [patternIndex, position] of PATTERN_TO_ARTIST_TILE.entries()) {
    const key = `${position.gridX},${position.gridY}`;
    ARTIST_TILE_TO_PATTERN.set(key, patternIndex);
}

// Fast lookup function - O(1) performance
function getArtistTilePosition(patternIndex) {
    const position = PATTERN_TO_ARTIST_TILE.get(patternIndex);
    if (!position) {
        console.warn(`No artist tile mapping for pattern ${patternIndex}, using fallback`);
        // Fallback to first tile
        return { gridX: 0, gridY: 0 };
    }
    return position;
}

// Helper for manual mapping creation
function generateMappingTemplate() {
    console.log('// Copy this template and fill in the artist tile positions:');
    for (let i = 0; i < TOTAL_TILES; i++) {
        const pattern = getPatternByIndex(i);
        console.log(`[${i}, { gridX: ?, gridY: ? }], // Pattern "${pattern.patternName}" (${pattern.tl},${pattern.tr},${pattern.bl},${pattern.br})`);
    }
}

// Validation function
function validateMapping() {
    const mapped = PATTERN_TO_ARTIST_TILE.size;
    const expected = TOTAL_TILES;
    
    console.log(`Mapped ${mapped}/${expected} patterns`);
    
    if (mapped !== expected) {
        console.warn('Incomplete mapping!');
        
        // Find missing patterns
        for (let i = 0; i < expected; i++) {
            if (!PATTERN_TO_ARTIST_TILE.has(i)) {
                const pattern = getPatternByIndex(i);
                console.warn(`Missing pattern ${i}: "${pattern.patternName}"`);
            }
        }
    }
    
    // Check for duplicate artist positions
    const positions = new Set();
    for (const [patternIndex, pos] of PATTERN_TO_ARTIST_TILE.entries()) {
        const key = `${pos.gridX},${pos.gridY}`;
        if (positions.has(key)) {
            console.warn(`Duplicate artist position ${key} for pattern ${patternIndex}`);
        }
        positions.add(key);
    }
    
    return mapped === expected;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ARTIST_TILEMAP,
        PATTERN_TO_ARTIST_TILE,
        ARTIST_TILE_TO_PATTERN,
        getArtistTilePosition,
        generateMappingTemplate,
        validateMapping
    };
}