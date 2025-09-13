// Input Handler for Mining Game
// Manages keyboard input for player movement and actions

class InputHandler {
    constructor() {
        this.keys = {};
        this.keyDownHandlers = new Map();
        this.keyUpHandlers = new Map();
        
        // Key codes
        this.KEY_CODES = {
            ARROW_UP: 'ArrowUp',
            ARROW_DOWN: 'ArrowDown',
            ARROW_LEFT: 'ArrowLeft',
            ARROW_RIGHT: 'ArrowRight',
            SPACE: ' ',
            W: 'w',
            A: 'a',
            S: 's',
            D: 'd',
            SHIFT: 'Shift'
        };
        
        // Initialize input listeners
        this.initializeListeners();
    }
    
    initializeListeners() {
        // Keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (e) => {
            if (this.isGameKey(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyDown(event) {
        const key = event.key;
        
        // Track key state
        if (!this.keys[key]) {
            this.keys[key] = true;
            
            // Trigger registered handlers
            if (this.keyDownHandlers.has(key)) {
                this.keyDownHandlers.get(key)(event);
            }
        }
    }
    
    handleKeyUp(event) {
        const key = event.key;
        
        // Update key state
        this.keys[key] = false;
        
        // Trigger registered handlers
        if (this.keyUpHandlers.has(key)) {
            this.keyUpHandlers.get(key)(event);
        }
    }
    
    // Register a handler for key down events
    onKeyDown(key, handler) {
        this.keyDownHandlers.set(key, handler);
    }
    
    // Register a handler for key up events
    onKeyUp(key, handler) {
        this.keyUpHandlers.set(key, handler);
    }
    
    // Check if a key is currently pressed
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    // Check if this is a game control key
    isGameKey(key) {
        return Object.values(this.KEY_CODES).includes(key);
    }
    
    // Get movement vector based on current input
    getMovementVector() {
        let dx = 0;
        let dy = 0;
        
        // Check arrow keys
        if (this.isKeyPressed(this.KEY_CODES.ARROW_UP) || this.isKeyPressed(this.KEY_CODES.W)) {
            dy = -1;
        }
        if (this.isKeyPressed(this.KEY_CODES.ARROW_DOWN) || this.isKeyPressed(this.KEY_CODES.S)) {
            dy = 1;
        }
        if (this.isKeyPressed(this.KEY_CODES.ARROW_LEFT) || this.isKeyPressed(this.KEY_CODES.A)) {
            dx = -1;
        }
        if (this.isKeyPressed(this.KEY_CODES.ARROW_RIGHT) || this.isKeyPressed(this.KEY_CODES.D)) {
            dx = 1;
        }
        
        // Prevent diagonal movement (prioritize most recent direction)
        if (dx !== 0 && dy !== 0) {
            // For simplicity, cancel out diagonal movement
            // In a more complex implementation, you might track which key was pressed last
            dy = 0;
        }
        
        return { dx, dy };
    }
    
    // Setup player controls
    setupPlayerControls(player, gridSystem, onDig) {
        // Movement keys
        const movementKeys = [
            this.KEY_CODES.ARROW_UP, this.KEY_CODES.ARROW_DOWN,
            this.KEY_CODES.ARROW_LEFT, this.KEY_CODES.ARROW_RIGHT,
            this.KEY_CODES.W, this.KEY_CODES.A, this.KEY_CODES.S, this.KEY_CODES.D
        ];
        
        // Handle movement
        movementKeys.forEach(key => {
            this.onKeyDown(key, () => {
                const movement = this.getMovementFromKey(key);
                player.move(movement.dx, movement.dy);
                this.updatePlayerPositionDisplay(player);
            });
        });
        
        // Handle digging
        this.onKeyDown(this.KEY_CODES.SPACE, () => {
            const affectedTiles = player.dig();
            if (affectedTiles && onDig) {
                onDig(affectedTiles);
            }
        });
    }
    
    getMovementFromKey(key) {
        switch(key) {
            case this.KEY_CODES.ARROW_UP:
            case this.KEY_CODES.W:
                return { dx: 0, dy: -1 };
            case this.KEY_CODES.ARROW_DOWN:
            case this.KEY_CODES.S:
                return { dx: 0, dy: 1 };
            case this.KEY_CODES.ARROW_LEFT:
            case this.KEY_CODES.A:
                return { dx: -1, dy: 0 };
            case this.KEY_CODES.ARROW_RIGHT:
            case this.KEY_CODES.D:
                return { dx: 1, dy: 0 };
            default:
                return { dx: 0, dy: 0 };
        }
    }
    
    updatePlayerPositionDisplay(player) {
        const posDisplay = document.getElementById('playerPos');
        if (posDisplay) {
            const pos = player.getPosition();
            posDisplay.textContent = `Player: (${pos.x}, ${pos.y})`;
        }
    }

    setupTileEditingControls(canvas, gridSystem, player, mapGenerator, onTileChanged) {
        // Store references for tile editing
        this.gridSystem = gridSystem;
        this.player = player;
        this.mapGenerator = mapGenerator;
        this.onTileChanged = onTileChanged;
        
        // Add mouse click listener for tile editing
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e, canvas));
        
        // Prevent context menu on alt+click
        canvas.addEventListener('contextmenu', (e) => {
            if (e.altKey) {
                e.preventDefault();
            }
        });
    }
    
    handleCanvasClick(event, canvas) {
        // Only process if Alt key is held
        if (!event.altKey) return;
        
        // Get canvas bounds and mouse position
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Account for canvas padding (from main.js)
        const CANVAS_PADDING = 20;
        const tileSize = this.gridSystem.tileRenderer.RENDER_TILE_SIZE;
        
        // Calculate tile coordinates
        const tileX = Math.floor((x - CANVAS_PADDING) / tileSize);
        const tileY = Math.floor((y - CANVAS_PADDING) / tileSize);
        
        // Validate tile coordinates
        if (tileX < 0 || tileX >= this.gridSystem.width || 
            tileY < 0 || tileY >= this.gridSystem.height) {
            return;
        }
        
        // Check constraints
        if (!this.canEditTile(tileX, tileY)) {
            console.log(`Cannot edit tile at (${tileX}, ${tileY})`);
            return;
        }
        
        // Perform tile type cycling
        this.cycleTileType(tileX, tileY);
    }
    
    canEditTile(x, y) {
        // Check if tile is in home base
        if (this.mapGenerator && this.mapGenerator.isInHomeBase(x, y)) {
            console.log('Cannot edit: Tile is in home base area');
            return false;
        }
        
        // Check if player is on this tile
        const playerPos = this.player.getPosition();
        if (playerPos.x === x && playerPos.y === y) {
            console.log('Cannot edit: Player is on this tile');
            return false;
        }
        
        return true;
    }
    
    cycleTileType(x, y) {
        const currentType = this.gridSystem.getTerrainAt(x, y);
        let newType;
        
        // Cycle: Empty -> Diggable -> Undiggable -> Empty
        switch(currentType) {
            case TerrainType.EMPTY:
                newType = TerrainType.DIGGABLE;
                break;
            case TerrainType.DIGGABLE:
                newType = TerrainType.UNDIGGABLE;
                break;
            case TerrainType.UNDIGGABLE:
                newType = TerrainType.EMPTY;
                break;
            default:
                newType = TerrainType.EMPTY;
        }
        
        // Update the tile
        this.gridSystem.setTerrainAt(x, y, newType);
        
        // Log the change
        const typeNames = ['Empty', 'Diggable', 'Undiggable'];
        console.log(`Tile (${x}, ${y}): ${typeNames[currentType]} -> ${typeNames[newType]}`);
        
        // Get affected visual tiles for updating
        const affectedTiles = this.gridSystem.getAffectedVisualTiles(x, y);
        
        // Trigger callback if provided
        if (this.onTileChanged) {
            this.onTileChanged(x, y, newType, affectedTiles);
        }
    }
    
    destroy() {
        // Remove keyboard listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        // Remove canvas listeners if they exist
        if (this.canvas && this.boundHandleCanvasClick) {
            this.canvas.removeEventListener('click', this.boundHandleCanvasClick);
        }
        if (this.canvas && this.boundHandleContextMenu) {
            this.canvas.removeEventListener('contextmenu', this.boundHandleContextMenu);
        }
        
        // Clear handlers and references
        this.keyDownHandlers.clear();
        this.keyUpHandlers.clear();
        
        // Clear tile editing references
        this.canvas = null;
        this.gridSystem = null;
        this.player = null;
        this.mapGenerator = null;
        this.onTileChanged = null;
        this.boundHandleCanvasClick = null;
        this.boundHandleContextMenu = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}