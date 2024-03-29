var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var sprites = {};
var coinAnim = {};
var cameraX = 0;
var cameraY = 0;
var bgColor = "black";

ctx.imageSmoothingEnabled = false;
initAnim(coinAnim, {
    "default":8
}, 0.15);
window.addEventListener('resize', function() {
    var aspect = window.innerWidth/window.innerHeight;
    var width = canvas.height * aspect;
    width = Math.ceil(width/CELL_SIZE)*CELL_SIZE;
    canvas.width = width;
    ctx.imageSmoothingEnabled = false;
    CELL_WIDTH = width / CELL_SIZE;
});
window.dispatchEvent(new Event('resize'));
preloadSprites();

/**
 * Draws a rectangle
 * @param {number} x
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {string} color 
 */
function drawRect(x, y, width, height, color)
{
    ctx.fillStyle = color;
    ctx.fillRect(x*CELL_SIZE - cameraX, y*CELL_SIZE - cameraY, width*CELL_SIZE, height*CELL_SIZE)
}

/**
 * Draws a rectangle outline
 * @param {number} x
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {string} color 
 */
function drawRectOutline(x, y, width, height, color)
{
    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.strokeStyle = color;
    ctx.rect(x*CELL_SIZE - cameraX, y*CELL_SIZE - cameraY, width*CELL_SIZE, height*CELL_SIZE);
    ctx.stroke();
}

/**
 * Draws a line from (x1, y1) to (x2, y2)
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {string} color 
 */
function drawLine(x1, y1, x2, y2, color)
{
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1*CELL_SIZE - cameraX, y1*CELL_SIZE - cameraY);
    ctx.lineTo(x2*CELL_SIZE - cameraX, y2*CELL_SIZE - cameraY);
    ctx.stroke();
}

/**
 * Draws Text at a Position
 * @param {string} text 
 * @param {number} x 
 * @param {number} y 
 * @param {string} [font="8px PressStart2P"]
 * @param {string} [color="white"]
 */
function drawText(text, x, y, font=(CELL_SIZE / 2) + "px PressStart2P", color="white")
{
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x - cameraX, y - cameraY);
}

/**
 * Draws an image
 * @param {Object} sprite
 * @param {number} x
 * @param {number} y
 * @param {number} [width=1]
 * @param {number} [height=1]
 */
function drawSprite(sprite, x, y, width=1, height=1)
{
    try {
        if (width == 1 && height == 1)
            ctx.drawImage(sprite, x*CELL_SIZE - cameraX, y*CELL_SIZE - cameraY, sprite.width * SPRITE_SCALE, sprite.height * SPRITE_SCALE);
        else
            ctx.drawImage(sprite, x*CELL_SIZE - cameraX, y*CELL_SIZE - cameraY, width*CELL_SIZE, height*CELL_SIZE);
    }
    catch {}
}

/**
 * Gets the sprite of the given type
 * @param {string} type - Object type
 */
function getSprite(type)
{
    if (!(sprites[type]))
    {
        var sprite = new Image();
        sprite.src = "/sprites/" + type + ".png";
        sprites[type] = sprite;
    }
    return sprites[type];
}

/**
 * Draws a Block at (x,y)
 * @param {Object} block - Block to draw
 * @param {number} [x=block.x] - X position
 * @param {number} [y=block.y] - Y position
 * @param {boolean} [stretch=true] - Stretches the sprite across the width and height
 */
function drawBlock(block, x=block.x + block.xOffset, y=block.y + block.yOffset, stretch=true)
{
    var trueY = block.hop ? y - (1/8) : y;
    if (stretch)
    {
        if (block.useAnim)
            drawSprite(getSprite(block.type + getAnim(block)), x - 1, trueY - 1, block.width, block.height);
        else
            drawSprite(getSprite(block.type), x - 1, trueY - 1, block.width, block.height);
    }
    else
    {
        if (block.useAnim)
            drawSprite(getSprite(block.type + getAnim(block)), x - 1, trueY - 1);
        else
            drawSprite(getSprite(block.type), x - 1, trueY - 1);
    }
}

/**
 * Draws all the blocks in a world
 * @param {Object} world - World Data
 */
function drawWorld(world)
{
    for (id in world.blocks)
    {
        var block = world.blocks[id];
        if (block.isRepeat)
        {
            for(var x = 0; x < block.width; x++)
            {
                for(var y = 0; y < block.height; y++)
                {
                    drawBlock(block, x + block.x + block.xOffset, y + block.y + block.yOffset, false);
                }
            }
        }
        else
        {
            drawBlock(block);
        }
    }
}

/**
 * Draws all the players
 * @param {Object[]} players - Players to draw
 */
function drawPlayers(players)
{
    for (var id in players)
    {
        if (players[id].world != world.id)
            continue;
        ctx.textAlign = 'center';
        if (id == player.id)
        {
            drawBlock(player, Math.round(player.x*CELL_SIZE)/CELL_SIZE + player.xOffset, player.y + player.yOffset, false);
            drawText(player.name, ((player.x - 1) + (player.width / 2)) * CELL_SIZE, (player.y - 1.2)*CELL_SIZE, "7.5px PressStart2P");
            //drawRectOutline(player.x - 1, player.y - 1, player.width, player.height, "red"); // Shows Hitbox
        }
        else
        {
            drawBlock(players[id], Math.round(players[id].x*CELL_SIZE)/CELL_SIZE, players[id].y, false);
            drawText(players[id].name, ((players[id].x - 1) + (players[id].width / 2)) * CELL_SIZE, (players[id].y - 1.2)*CELL_SIZE, "7.5px PressStart2P")
        }
    }
}

/**
 * Draws the GUI at the top of the screen
 * @param {Object} player - The Player
 * @param {Object} worldProperties - The World Properties
 */
function drawGUI(player, world)
{
    ctx.textAlign = 'left';
    // Score
    drawText(player.name, (.625*CELL_SIZE) + cameraX, 1.25 * CELL_SIZE);
    drawText(pad(player.score, 6), (.625*CELL_SIZE) + cameraX, 1.875 * CELL_SIZE);
    // Coins
    drawText("x" + pad(player.coins, 2), (6.25*CELL_SIZE) + cameraX, 1.875 * CELL_SIZE);
    drawSprite(getSprite("gui/coin-1" + getAnim(coinAnim)), 5.6 + cameraX / CELL_SIZE, 1.3); 
    // World
    drawText("WORLD", (9.375*CELL_SIZE) + cameraX, 1.25 * CELL_SIZE);
    drawText(world.displayName, (9.875*CELL_SIZE) + cameraX, 1.875*CELL_SIZE);
    // Time
    drawText("TIME", (13.75*CELL_SIZE) + cameraX, 1.25 * CELL_SIZE);
    if (!(world.time))
        world.time = 400;
    drawText(pad(world.time, 3), (14.06*CELL_SIZE) + cameraX, 1.875*CELL_SIZE);
}

/**
 * Converts an int to a string with 0s as padding
 * @param {number} num - Number to convert
 * @param {number} size - Length of the string
 * @returns {string} - Number represented as a string with 0s as a pad
 * @private
 */
function pad(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}

/**
 * Clears the current canvas with bgColor
 * @param {string} [backgroundColor=bgColor] - Background Color
 */
function clearDraw(backgroundColor=bgColor)
{
    drawRect(cameraX / CELL_SIZE, cameraY / CELL_SIZE, CELL_WIDTH, CELL_HEIGHT, backgroundColor);
}


/**
 * Smoothly pans the camera to x, y
 * @param {number} x - Camera X Position
 * @param {number} y - Camera Y Position
 */
function scrollTo(x, y = 0)
{
    cameraX = Math.round((x - cameraX) * CAMERA_DAMPING + cameraX);
    cameraY = Math.round((y - cameraY) * CAMERA_DAMPING + cameraY);
    if (cameraX < 0)
        cameraX = 0;
}

/**
 * Enables Animations for a Block
 * @param {Object} block - Block to animate
 * @param {Object} animations - Block Animations
 * @param {number} speed - Speed of the Animation
 */
function initAnim(block, animations, speed=0.15)
{
    block.useAnim = true;
    block.animations = animations;
    block.flip = false;
    block.state = "default";
    block.power = "";
    block.frame = 1;
    block.speed = speed;
}

/**
 * Gets the directory of the current animation frame
 * @param {Object} block - Block to animate
 */
function getAnim(block)
{
    if (!(block.state in block.animations))
        return "";
    block.frame += block.speed;
    if (Math.floor(block.frame) > block.animations[block.state])
        block.frame = 1;

    var str = "/";
    if (block.power)
        str += block.power + "_";
    str += block.state + "-" + Math.floor(block.frame);
    if (block.flip)
        str += "_flip";
    return str;
}

/**
 * Preloads sprites to reduce load flicker
 */
function preloadSprites()
{
    var spriteList = [
        'entity/player-1/climb-1',
        'entity/player-1/climb-1_flip',
        'entity/player-1/default-1',
        'entity/player-1/default-1_flip',
        'entity/player-1/fire_climb-1',
        'entity/player-1/fire_climb-1_flip',
        'entity/player-1/fire_default-1',
        'entity/player-1/fire_default-1_flip',
        'entity/player-1/fire_jump-1',
        'entity/player-1/fire_jump-1_flip',
        'entity/player-1/fire_walk-1',
        'entity/player-1/fire_walk-1_flip',
        'entity/player-1/fire_walk-2',
        'entity/player-1/fire_walk-2_flip',
        'entity/player-1/fire_walk-3',
        'entity/player-1/fire_walk-3_flip',
        'entity/player-1/jump-1',
        'entity/player-1/jump-1_flip',
        'entity/player-1/sanic_default-1',
        'entity/player-1/sanic_default-1_flip',
        'entity/player-1/sanic_jump-1',
        'entity/player-1/sanic_jump-1_flip',
        'entity/player-1/sanic_walk-1',
        'entity/player-1/sanic_walk-1_flip',
        'entity/player-1/sanic_walk-2',
        'entity/player-1/sanic_walk-2_flip',
        'entity/player-1/sanic_walk-3',
        'entity/player-1/sanic_walk-3_flip',
        'entity/player-1/shroom_climb-1',
        'entity/player-1/shroom_climb-1_flip',
        'entity/player-1/shroom_default-1',
        'entity/player-1/shroom_default-1_flip',
        'entity/player-1/shroom_jump-1',
        'entity/player-1/shroom_jump-1_flip',
        'entity/player-1/shroom_walk-1',
        'entity/player-1/shroom_walk-1_flip',
        'entity/player-1/shroom_walk-2',
        'entity/player-1/shroom_walk-2_flip',
        'entity/player-1/shroom_walk-3',
        'entity/player-1/shroom_walk-3_flip',
        'entity/player-1/tank_default-1',
        'entity/player-1/tank_default-1_flip',
        'entity/player-1/tank_jump-1',
        'entity/player-1/tank_jump-1_flip',
        'entity/player-1/tank_walk-1',
        'entity/player-1/tank_walk-1_flip',
        'entity/player-1/tank_walk-2',
        'entity/player-1/tank_walk-2_flip',
        'entity/player-1/tank_walk-3',
        'entity/player-1/tank_walk-3_flip',
        'entity/player-1/walk-1',
        'entity/player-1/walk-1_flip',
        'entity/player-1/walk-2',
        'entity/player-1/walk-2_flip',
        'entity/player-1/walk-3',
        'entity/player-1/walk-3_flip',
        'coin/coin-anim-1/default-1',
        'coin/coin-anim-1/default-2',
        'coin/coin-anim-1/default-3',
        'coin/coin-anim-1/default-4',
        'coin/coin-anim-1/default-5',
        'coin/coin-anim-1/default-6'
    ];

    spriteList.forEach((val, index) => {
        getSprite(val);
    });
}