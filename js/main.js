// Updated Main.js - connects map generator to tile renderer
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
        this.showGrid = false;
        this.showBaseGrid = false;
        
        // Game systems
        this.mapGenerator = null;
        this.tileRenderer = null;
        this.gridSystem = null;
        this.player = null;
        this.inputHandler = null;
        
        // Canvas settings
        this.CANVAS_PADDING = 20;
    }
    
    async initialize() {
        console.log('Initializing Mining Game...');
        
        // Initialize systems
        this.mapGenerator = new MapGenerator();
        this.tileRenderer = new TileRenderer();
        this.inputHandler = new InputHandler();
        
        // Connect map generator to tile renderer for home base detection
        this.tileRenderer.setMapGenerator(this.mapGenerator);
        
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
        this.gridSystem.setBaseGrid(baseGrid);
        
        // Set canvas size based on map
        this.resizeCanvas();
        
        // Create player
        const startPos = this.mapGenerator.getPlayerStartPosition();
        this.player = new Player(startPos.x, startPos.y, this.gridSystem);
        
        // Setup controls
        this.setupControls();
        
        // Setup debug controls
        this.setupDebugControls();
        
        // Setup map type controls
        this.setupMapTypeControls();
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game initialized successfully!');
    }
    
    resizeCanvas() {
        const tileSize = this.tileRenderer.RENDER_TILE_SIZE;
        this.canvas.width = this.mapGenerator.MAP_WIDTH * tileSize + this.CANVAS_PADDING * 2;
        this.canvas.height = this.mapGenerator.MAP_HEIGHT * tileSize + this.CANVAS_PADDING * 2;
    }
    
    setupControls() {
        // Setup player controls with dig callback
        this.inputHandler.setupPlayerControls(
            this.player,
            this.gridSystem,
            (affectedTiles) => this.handleDig(affectedTiles)
        );
        
        // Update initial position display
        this.inputHandler.updatePlayerPositionDisplay(this.player);
    }
    
    setupDebugControls() {
        // Grid toggle
        const gridCheckbox = document.getElementById('showGrid');
        if (gridCheckbox) {
            gridCheckbox.addEventListener('change', (e) => {
                this.showGrid = e.target.checked;
            });
        }
        
        // Base grid toggle
        const baseGridCheckbox = document.getElementById('showBaseGrid');
        if (baseGridCheckbox) {
            baseGridCheckbox.addEventListener('change', (e) => {
                this.showBaseGrid = e.target.checked;
            });
        }
    }
    
    setupMapTypeControls() {
        // Add map type selector to debug area
        const debugInfo = document.querySelector('.debug-info');
        if (debugInfo) {
            const mapTypeSelector = document.createElement('select');
            mapTypeSelector.id = 'mapTypeSelector';
            mapTypeSelector.innerHTML = `
                <option value="bellJar">Bell Jar</option>
                <option value="simpleBox">Simple Box</option>
                <option value="openField">Open Field</option>
                <option value="maze">Maze</option>
                <option value="cavern">Cavern</option>
            `;
            
            const mapTypeLabel = document.createElement('label');
            mapTypeLabel.textContent = 'Map Type: ';
            mapTypeLabel.appendChild(mapTypeSelector);
            
            debugInfo.appendChild(mapTypeLabel);
            
            // Handle map type changes
            mapTypeSelector.addEventListener('change', (e) => {
                this.changeMapType(e.target.value);
            });
        }
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
        
        console.log(`Map changed to ${mapType}, player reset to (${startPos.x}, ${startPos.y})`);
    }
    
    handleDig(affectedTiles) {
        // Tiles have been dug, need to update visuals
        if (affectedTiles && affectedTiles.length > 0) {
            // For now, we'll just re-render everything
            // In a more optimized version, we'd only update affected tiles
            this.render();
        }
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
        
        // Render dual grid system
        this.gridSystem.render(
            this.ctx, 
            this.CANVAS_PADDING, 
            this.CANVAS_PADDING,
            this.showGrid,
            this.showBaseGrid
        );
        
        // Render player on top
        this.player.render(this.ctx, this.CANVAS_PADDING, this.CANVAS_PADDING);
        
        // Render UI overlay
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
        console.log('Map Types: Use the dropdown to switch between different map layouts');
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