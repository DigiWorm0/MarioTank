var enableGravity = true;

/**
 * Applys controls, velocity, and gravity to player
 * @param {Object} player - Player to apply vectors to
 * @param {Object} world - World the block exists in
 */
function applyPlayerVectors(player, world)
{
    // Controls
    if (!(player))
        return;
    if (!(player.x) || !(player.y))
        return;
    UpdateControls();
    if (!isAnimating)
    {
        if (Controls.up && player.onground && !player.jumping)
        {
            player.jumped = true;
            player.jumping = true;
            player.onground = false;
            player.yVel -= JUMP_FORCE;

            setTimeout(function() {
                player.jumping = false;
            }, 100);
        }
        if (!Controls.up && player.jumping)
        {
            player.jumping = false;
        }
        if (player.jumping)
        {
            player.yVel -= CONTINUOUS_JUMP_FORCE
        }
        
        if (player.onground && Controls.sprint)
            player.xVel += Controls.horizontal * (player.moveSpeed + 0.0075);
        else if (player.onground)
            player.xVel += Controls.horizontal * (player.moveSpeed + 0.0025);
        else
            player.xVel += Controls.horizontal * player.moveSpeed;
        
        if (!player.fired && Controls.fire && player.power in powerups)
        {
            player.fired = true;
            setTimeout(() => {
                player.fired = false;
            }, 300);
            powerups[player.power].fire();
        }
    }

    // Physics
    if (enableGravity)
        player.yVel += GRAVITY;
    player.x += player.xVel;
    if (!isAnimating)
        _correctXMovement(player, world);
    player.y += player.yVel;
    if (!isAnimating)
        _correctYMovement(player, world);
    player.xVel *= X_MOTION_DAMPING;
    player.yVel *= Y_MOTION_DAMPING;
    socket.emit('updatePlayer', player)
}

/**
 * Corrects movement in the Y axis
 * @param {Object} player - player to correct any invalid movements
 * @param {Object} world - World the player exists in
 * @private
 */
function _correctYMovement(player, world)
{
    for (var id in world.blocks)
    {
        if (_boxCollider(player.x, player.y, player.width, player.height, world.blocks[id].x, world.blocks[id].y, world.blocks[id].width, world.blocks[id].height))
        {
            if (player.collision(player, world.blocks[id]))
            {
                if ("onground" in player && player.yVel > 0)
                {
                    player.onground = true;
                    player.jumped = false;
                }

                var d1 = (world.blocks[id].y) - (player.y + player.height)-0.0001;
                var d2 = -((player.y) - (world.blocks[id].y + world.blocks[id].height))+0.0001;
                var d = Math.abs(d1) < Math.abs(d2) ? d1 : d2;
                player.y += d;
                player.yVel = 0;
            }
        }
    }
}

/**
 * Corrects movement in the X axis
 * @param {Object} player - player to correct any invalid movements
 * @param {Object} world - World the player exists in
 * @private
 */
function _correctXMovement(player, world)
{
    for (var id in world.blocks)
    {
        if (_boxCollider(player.x, player.y, player.width, player.height, world.blocks[id].x, world.blocks[id].y, world.blocks[id].width, world.blocks[id].height))
        {
            if (player.collision(player, world.blocks[id]))
            {
                var d1 = (world.blocks[id].x) - (player.x + player.width)-0.0001;
                var d2 = -((player.x) - (world.blocks[id].x + world.blocks[id].width))+0.0001;
                var d = Math.abs(d1) < Math.abs(d2) ? d1 : d2;
                player.x += d;
                player.xVel = 0;
            }
        }
    }
}

/**
 * Checks if there is a collision between (x1, y1, w1, h1) and (x2, y2, w2, h2)
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} w1 
 * @param {number} h1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} w2 
 * @param {number} h2 
 * @returns {boolean} - True if there is a collision, false otherwise
 */
function _boxCollider(x1, y1, w1, h1, x2, y2, w2, h2)
{
    return !(x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2)
}

/**
 * Updates player each Frame
 * @param {Object} block
 */
function playerUpdate()
{
    for (var id in world.blocks)
    {
        var block = world.blocks[id];
        // Bricks
        if (block.type.includes("brick/float-") || block.type.includes("brick/wall-"))
        {
            var top = _boxCollider(player.x + 0.01, player.y - 0.01, player.width - 0.02, 0.01, block.x, block.y, block.width, block.height);
            if (top && block.state != "used" && !(block.isUnbreakable))
            {
                if (block.prop != "")
                {
                    if (block.prop == "powerup") {
                        var keys = Object.keys(powerups);
                        var prop = "power/" + keys[Math.floor(Math.random() * keys.length)] + "-1";
                        socket.emit('addBlock', world.id, prop, block.x, block.y-1, {"isSolid":false});
                        socket.emit('updateBlock', world.id, block.id, {"hop":true, "state":"used"});
                    }
                    else
                    {
                        socket.emit('addBlock', world.id, block.prop, block.x, block.y-1, {"isSolid":false});
                        player.coins += 1;
                        socket.emit('updateBlock', world.id, block.id, {"hop":true, "state":"used"});
                    }

                    block.state = "used";
                    block.hop = true;
                    let d = block.id;
                    setTimeout((id) => {
                        socket.emit('updateBlock', world.id, id, {"hop":false})
                        world.blocks[id].hop = false;
                    }, 100, d);
                }
                else if (player.power == "")
                {
                    socket.emit('updateBlock', world.id, block.id, {"hop":true});
                    block.hop = true;
                    var c = block.id;
                    setTimeout((id) => {
                        socket.emit('updateBlock', world.id, id, {"hop":false});
                        world.blocks[id].hop = false;
                    }, 100, c);
                }
                else
                {
                    socket.emit('addBlock', world.id, 'brick/debris-1',block.x, block.y, {"isSolid":false});
                    socket.emit('removeBlock', world.id, block.id);
                }
            }
        }

        // Question Blocks
        if (block.type.substring(0,15) == "question/block-")
        {
            var top = _boxCollider(player.x + 0.01, player.y - 0.01, player.width - 0.02, 0.01, block.x, block.y, block.width, block.height);
            if (block.state != "used" && top)
            {
                player.score += 200;
                if (block.prop == "powerup") {
                    var keys = Object.keys(powerups);
                    var prop = "power/" + keys[Math.floor(Math.random() * keys.length)] + "-1";
                    socket.emit('addBlock', world.id, prop, block.x, block.y-1, {"isSolid":false});
                }
                else if (block.prop != "")
                {
                    socket.emit('addBlock', world.id, block.prop, block.x, block.y-1, {"isSolid":false});
                    player.coins += 1;
                }

                // Hop
                socket.emit('updateBlock', world.id, block.id, {"hop":true, "state":"used"});
                block.state = "used";
                block.hop = true;
                let d = block.id;
                setTimeout((id) => {
                    socket.emit('updateBlock', world.id, id, {"hop":false})
                    world.blocks[id].hop = false;
                }, 100, d);
            }
        }

        // Goomba
        if (block.type.substring(0, 14) == "entity/goomba-" || block.type.substring(0, 13) == "entity/koopa-")
        {
            var bottom = _boxCollider(player.x + 0.01, player.y + player.height + 0.01, player.width - 0.02, 0.01, block.x, block.y, block.width, block.height);
            var around = _boxCollider(player.x - 0.01, player.y - 0.01, player.width + 0.02, player.height + 0.01, block.x, block.y, block.width, block.height)
            
            if (bottom)
            {
                var b = block;
            
                block.isSolid = false;
                block.state = player.power == "tank" ? "bloody" : "squash";
                socket.emit('updateBlock', world.id, block.id, {
                    "speed":0,
                    "state":block.state,
                    "isSolid":false,
                    "y":block.y + 0.75,
                    "isPhysics":false,
                    "isGravity":false,
                    "repeat":false,
                    "height":(1/3)
                });

                if (block.state != "bloody")
                {
                    setTimeout(() => {
                        socket.emit('removeBlock', world.id, b.id);
                    }, 200);
                }

                player.score += 100;

                if (Controls.up) {
                    player.yVel = 0;
                    player.jumped = true
                }
                else
                    player.yVel = -BOUNCE_FORCE;
                player.y += player.yVel;
            }
            else if (around)
            {
                player.die();
            }
        }

        // Pipes
        if (block.type.substring(0,8) == "pipe/up-")
        {
            var bottom = _boxCollider(player.x + 0.4, player.y + player.height + 0.01, player.width - 0.8, 0.01, block.x, block.y, block.width, block.height);

            if (bottom && Controls.down && block.prop != "" && block.prop != null && block.prop != undefined)
            {
                var p = block.prop;

                startAnimation("downPipe", ()=>{
                    socket.emit("getWorld", p);
                });
            }
        }
        // Pipes
        if (block.type.substring(0,10) == "pipe/left-")
        {
            var right = _boxCollider(player.x + player.width, player.y + 0.4, 0.01, player.height - 0.8, block.x, block.y, block.width, block.height);

            if (right && Controls.right && block.prop != "" && block.prop != null && block.prop != undefined)
            {
                socket.emit("getWorld", block.prop);
            }
        }
    }

    // Animation State
    if (!isAnimating)
    {
        player.state = (Math.abs(player.xVel * CELL_SIZE) > 0.2) ? "walk" : "default";
        player.state = player.jumped ? "jump" : player.state;
        player.flip = Math.abs(player.xVel) > 0.01 ? player.xVel < 0 : player.flip;
    }
}

/**
 * Class representing a Player
 */
class Player {

    /**
     * Creates a Player
     * @param {string} id - Socket.io ID
     * @param {number} x - X Position
     * @param {number} y - Y Position
     * @param {string} [name=URLParameter] - Name of the Player
     * @param {Object} [properties={}] - Optional Properties
     */
    constructor(id, x, y)
    {   
        initAnim(this, {
            "default":1,
            "jump":1,
            "walk":3,
            "climb":1
        }, 0.2);
        
        this.type       = "entity/player-1";
        this.x          = null;
        this.y          = null;
        this.xVel       = 0;
        this.yVel       = 0;
        this.height     = 0.9375;
        this.width      = 0.8;
        this.coins      = 0;
        this.moveSpeed  = DEFAULT_SPEED;
        this.score      = 0; // TODO Save Data
        this.name       = (new URLSearchParams(window.location.search)).get('name');
        this.id         = id;
        this.onground   = false;
        this.jumping    = false;
        this.jumped     = false;
        this.fired      = false;
        this.hop        = false;
        this.world      = "1-1";
        this.xOffset    = 0;
        this.yOffset    = -0.0625;

        /**
        * Runs if there is a collision between player and collider
        * @param {Object} player - Current Player
        * @param {Object} collider - Block collided with
        * @returns - True if collision is valid, false otherwise
        */
       this.collision = function(player, collider)
       {
            // Coin
            if (collider.type.includes("coin/coin-") && collider.type != "coin/coin-anim-1")
            {
                player.coins++;
                delete world.blocks[collider.id];
                socket.emit('removeBlock', world.id, collider.id);
                return false;
            }
            // Power Up
            else if (collider.type.substring(0, 6) == "power/")
            {
                var power = collider.type.substring(6, collider.type.length-2);
                if (power in powerups)
                {
                    plrPowerup(powerups[power])
                    socket.emit('removeBlock', world.id, collider.id);
                    return false;
                }
            }
            // End Flag
            else if (collider.type == "flag/pole-1" && collider.prop != "")
            {
                startAnimation("flag", () => {
                    socket.emit("getWorld", collider.prop); // TODO flag pole animation
                    stallMsg("WORLD " + collider.prop);
                    if (countdownInterval != -1)
                        clearInterval(countdownInterval);
                    countdownInterval = setTimeout(() => {
                        exitStall();
                    }, 2000);
                })
            }
            return collider.isSolid;
       }

        /**
         * Runs when the Player Dies
         * @param {boolean} [force=false] - Player instantly dies regardless of power ups when true
         */
        this.die = function(force = false)
        {
            if (this.power != "" && !force)
            {
                this.power = "";
                this.height = 0.9375;
                this.width = 0.8;
                this.yOffset = -0.0625;
                this.xOffset = 0;
                this.invinsible = true;
                this.moveSpeed = DEFAULT_SPEED;
                setTimeout(() => {
                    this.invinsible = false;
                }, 5000)
                // TODO De-Power Up Animation
            }
            else if (!this.invinsible || force)
            {
                this.height = 0.9375;
                this.width = 0.8;
                this.yOffset = -0.0625;
                this.xOffset = 0;
                this.power = "";
                this.moveSpeed = DEFAULT_SPEED;
                resetWorld()
            }
        }
    }
}