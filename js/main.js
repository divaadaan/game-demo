// Mining Game Demo with Dual Grid System

class MiningGame {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        
        // Debug options
        this.viewMode = 'draw';
        this.showGridLines = false;
        
        // Game systems
        this.mapGenerator = null;
        this.tileRenderer = null;
        this.gridSystem = null;
        this.player = null;
        this.inputHandler = null;
        
        // Canvas settings
        this.CANVAS_PADDING = 20;
        
        // Track Alt key state for cursor
        this.altKeyPressed = false;
    }
    
    async initialize() {
        console.log('Initializing Mining Game...');
        
        // Initialize systems
        this.mapGenerator = new MapGenerator();
        this.tileRenderer = new TileRenderer();
        this.inputHandler = new InputHandler();
        
        // Load tilemap
        await this.tileRenderer.loadTilemap('assets/tilemap.png');
        
        // Generate map
        const baseGrid = this.mapGenerator.generateMap();
        
        // Create dual grid system
        this.gridSystem = new DualGridSystem(
            this.mapGenerator.MAP_WIDTH,
            this.mapGenerator.MAP_HEIGHT,
            this.tileRenderer
        );
        
        // Connect map generator to dual grid system
        this.gridSystem.setMapGenerator(this.mapGenerator);
        this.gridSystem.setBaseGrid(baseGrid);
        
        // Set canvas size based on map
        this.resizeCanvas();
        
        // Create player
        const startPos = this.mapGenerator.getPlayerStartPosition();
        this.player = new Player(startPos.x, startPos.y, this.gridSystem);
        
        this.setupControls();
        this.setupDebugControls();
        this.setupMapTypeControls();
        this.setupAltKeyTracking();
        this.logTileSystemInfo();
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game initialized successfully!');
    }
    
    logTileSystemInfo() {
        console.log('=== Tile System Information ===');
        console.log(`Total tiles supported: ${TOTAL_TILES}`);
        console.log(`Tilemap layout: ${TILEMAP_COLUMNS}x${TILEMAP_ROWS}`);
        console.log(`Pattern lookup size: ${PATTERN_LOOKUP.size}`);
        console.log(`Fallback mode: ${!this.tileRenderer.USE_TILEMAP ? 'ACTIVE' : 'DISABLED'}`);
        
        // Test a few pattern lookups
        console.log('Sample pattern lookups:');
        console.log(`  All empty (0,0,0,0): tile ${getPatternIndex(0,0,0,0)}`);
        console.log(`  All diggable (1,1,1,1): tile ${getPatternIndex(1,1,1,1)}`);
        console.log(`  All undiggable (2,2,2,2): tile ${getPatternIndex(2,2,2,2)}`);
        console.log(`  Mixed (0,1,2,1): tile ${getPatternIndex(0,1,2,1)}`);
        
        // Show current map patterns in use
        this.analyzeCurrentMapPatterns();
    }
    
    analyzeCurrentMapPatterns() {
        console.log('=== Current Map Pattern Analysis ===');
        const usedPatterns = new Set();
        const patternCounts = new Map();
        
        // Analyze all visual tiles in current map
        for (let y = 0; y < this.mapGenerator.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.mapGenerator.MAP_WIDTH; x++) {
                const tileIndex = this.gridSystem.getTileIndex(x, y);
                usedPatterns.add(tileIndex);
                patternCounts.set(tileIndex, (patternCounts.get(tileIndex) || 0) + 1);
            }
        }
        
        console.log(`Unique patterns in use: ${usedPatterns.size}/${TOTAL_TILES + 1} (including empty)`);
        console.log('Top 10 most used patterns:');
        
        const sortedPatterns = Array.from(patternCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        sortedPatterns.forEach(([index, count]) => {
            if (index === -1) {
                console.log(`  Empty tile (0,0,0,0): ${count} times`);
            } else {
                const pattern = getPatternByIndex(index);
                console.log(`  Tile ${index} (${pattern.tl},${pattern.tr},${pattern.bl},${pattern.br}): ${count} times`);
            }
        });
    }
    
    resizeCanvas() {
        const tileSize = this.tileRenderer.RENDER_TILE_SIZE;
        this.canvas.width = this.mapGenerator.MAP_WIDTH * tileSize + this.CANVAS_PADDING * 2;
        this.canvas.height = this.mapGenerator.MAP_HEIGHT * tileSize + this.CANVAS_PADDING * 2;
    }
    
    setupAltKeyTracking() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' && !this.altKeyPressed) {
                this.altKeyPressed = true;
                this.canvas.classList.add('alt-editing');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' && this.altKeyPressed) {
                this.altKeyPressed = false;
                this.canvas.classList.remove('alt-editing');
            }
        });
        
        // Remove alt-editing class when window loses focus
        window.addEventListener('blur', () => {
            this.altKeyPressed = false;
            this.canvas.classList.remove('alt-editing');
        });
    }
    
    setupControls() {
        // Setup player controls with dig callback
        this.inputHandler.setupPlayerControls(
            this.player,
            this.gridSystem,
            (affectedTiles) => this.handleDig(affectedTiles)
        );
        
        // Setup tile editing controls with Alt-Click
        this.inputHandler.setupTileEditingControls(
            this.canvas,
            this.gridSystem,
            this.player,
            this.mapGenerator,
            (x, y, newType, affectedTiles) => this.handleTileEdit(x, y, newType, affectedTiles)
        );
        
        this.inputHandler.updatePlayerPositionDisplay(this.player);
    }
    
    setupDebugControls() {
        // View mode radio buttons
        const viewDrawRadio = document.getElementById('viewDraw');
        const viewBaseRadio = document.getElementById('viewBase');
        
        if (viewDrawRadio) {
            viewDrawRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.viewMode = 'draw';
                    console.log('Switched to Draw Layer view');
                }
            });
        }
        
        if (viewBaseRadio) {
            viewBaseRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.viewMode = 'base';
                    console.log('Switched to Base Layer view');
                }
            });
        }
        
        // Grid lines toggle
        const gridLinesCheckbox = document.getElementById('showGridLines');
        if (gridLinesCheckbox) {
            gridLinesCheckbox.addEventListener('change', (e) => {
                this.showGridLines = e.target.checked;
                console.log(`Grid lines: ${this.showGridLines ? 'ON' : 'OFF'}`);
            });
        }
        
        // Debug button
        const debugButton = document.getElementById('debugTilesBtn');
        if (debugButton) {
            debugButton.addEventListener('click', () => this.debugTileSystem());
        }
    }
    
    setupMapTypeControls() {
        // Map type selector
        const mapTypeSelector = document.getElementById('mapTypeSelector');
        if (mapTypeSelector) {
            mapTypeSelector.addEventListener('change', (e) => {
                this.changeMapType(e.target.value);
            });
        }
    }
    
    debugTileSystem() {
        console.log('=== Tile System Debug ===');
        
        // Log all 81 patterns
        if (typeof debugPatterns === 'function') {
            debugPatterns();
        }
        
        // Re-analyze current map
        this.analyzeCurrentMapPatterns();
        
        // Show tilemap dimensions if loaded
        if (this.tileRenderer.tilemapImage) {
            console.log(`Tilemap image: ${this.tileRenderer.tilemapImage.width}x${this.tileRenderer.tilemapImage.height}`);
            console.log(`Expected: ${TILEMAP_COLUMNS * TILE_SIZE}x${TILEMAP_ROWS * TILE_SIZE}`);
        }
        
        // Test pattern at player position
        const playerPos = this.player.getPosition();
        const pattern = this.gridSystem.getVisualTilePattern(playerPos.x, playerPos.y);
        const tileIndex = this.gridSystem.getTileIndex(playerPos.x, playerPos.y);
        console.log(`Player position (${playerPos.x},${playerPos.y}): pattern (${pattern.tl},${pattern.tr},${pattern.bl},${pattern.br}) -> tile ${tileIndex}`);
        
        // Check if player is in home base
        const inHomeBase = this.gridSystem.isVisualTileInHomeBase(playerPos.x, playerPos.y);
        console.log(`Player in home base: ${inHomeBase}`);

        console.log(`Current view mode: ${this.viewMode}`);
        console.log(`Grid lines: ${this.showGridLines ? 'ON' : 'OFF'}`);
    }
    
    changeMapType(mapType) {
        console.log(`Changing map type to: ${mapType}`);
        
        // Set the new map type
        this.mapGenerator.setMapType(mapType);
        
        // Generate new map
        const baseGrid = this.mapGenerator.generateMap();
        this.gridSystem.setBaseGrid(baseGrid);
        
        // Reset player to starting position
        const startPos = this.mapGenerator.getPlayerStartPosition();
        this.player.setPosition(startPos.x, startPos.y);
        this.inputHandler.updatePlayerPositionDisplay(this.player);
        
        // Re-analyze patterns for new map
        this.analyzeCurrentMapPatterns();
        
        console.log(`Map changed to ${mapType}, player reset to (${startPos.x}, ${startPos.y})`);
    }
    
    handleDig(affectedTiles) {
        // Tiles have been dug, need to update visuals
        if (affectedTiles && affectedTiles.length > 0) {
            console.log(`Dig affected ${affectedTiles.length} visual tiles`);
            // For now, we'll just re-render everything
            // In a more optimized version, we'd only update affected tiles
            this.render();
        }
    }

    handleTileEdit(x, y, newType, affectedTiles) {
        // Log the edit
        const typeNames = ['Empty', 'Diggable', 'Undiggable'];
        console.log(`Tile edited at (${x}, ${y}) to ${typeNames[newType]}`);
        
        // Force re-render to show changes
        this.render();
        
        // Only update affected tiles for better performance
        this.gridSystem.updateVisualTiles(this.ctx, affectedTiles, this.CANVAS_PADDING, this.CANVAS_PADDING);
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render everything
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update player animation
        this.player.update(deltaTime);
    }
    
    render() {
        // Clear entire canvas
        this.ctx.fillStyle = '#f8f8f8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render dual grid system with new parameters
        this.gridSystem.render(
            this.ctx, 
            this.CANVAS_PADDING, 
            this.CANVAS_PADDING,
            this.viewMode,
            this.showGridLines
        );
        
        // Render player on top
        this.player.render(this.ctx, this.CANVAS_PADDING, this.CANVAS_PADDING, this.viewMode);        // Render UI overlay
        this.renderUI();
    }
    
    renderUI() {
        // Draw border around game area
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.CANVAS_PADDING - 1,
            this.CANVAS_PADDING - 1,
            this.mapGenerator.MAP_WIDTH * this.tileRenderer.RENDER_TILE_SIZE + 2,
            this.mapGenerator.MAP_HEIGHT * this.tileRenderer.RENDER_TILE_SIZE + 2
        );
    }
    
    stop() {
        this.isRunning = false;
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, starting game initialization...');
    
    // Create and initialize game
    const game = new MiningGame();
    
    try {
        await game.initialize();
        
        // Make game accessible globally for debugging
        window.game = game;
        
        console.log('Game started successfully!');
        console.log('Controls: Arrow keys to move, Space to dig');
        console.log('Debug: Check "Show Grid" or "Show Base Grid" to visualize the dual-grid system');
        console.log('Debug: Click "Debug Tiles" button to analyze tile patterns');
        console.log('Map Types: Use the dropdown to switch between different map layouts');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.stop();
    }
});