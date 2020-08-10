var socket = io();
var players = {};
var player;
var world;

/**
 * Runs on socket connection
 */
socket.on('connect', () => {
    player = new Player(socket.id, 1, 1);

    /**
     * Adds a block into the world
     * @param {Block} block - Block to add
     */
    socket.on('addBlock', function(worldID, block) {
        if (worldID == world.id)
        {
            world.blocks[block.id] = block;
        }
    });

    /**
     * Updates a block
     * @param {string} worldID - World ID of the block
     * @param {string} block - Block ID
     * @param {Object} changes - Changes to the block (Ex: {"isPhysics":true, "x":3})
     */
    socket.on('updateBlock', (worldID, block, changes) => {
        if (world.id == worldID)
        {
            for (var key in changes) {
                world.blocks[block][key] = changes[key];
            }
        }
    });

    /**
     * Removes a block
     * @param {string} worldID - World ID of the block
     * @param {string} block - Block ID
     */
    socket.on('removeBlock', (worldID, block) => {
        if (world.id == worldID)
        {
            delete world.blocks[block];
        }
    });
    
    /**
     * Returns a World
     * @param {World} world - World to load
     */
    socket.on('returnWorld', function(worldData) {
        world = worldData;
        if (waitForWorld) {
            waitForWorld = false;
            start();
        }
        console.log("Loaded world " + worldData.id)
    })
    
    /**
     * Updates the data from a player
     * @param {Player} plr - Player to update
     */
    socket.on('updatePlayer', function(plr) {
        players[plr.id] = plr;
    });

    /**
     * Disconnects a player
     * @param {number} id - ID of the player to disconnect
     */
    socket.on('disconnectPlayer', function(id) {
        delete players[id];
    });
});