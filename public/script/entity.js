/*
        Default AI
*/

var DefaultAI = {
    "entity/player-1":(entity) => {
        if (!(entity.init))
        {
            entity.init = true;
            entity.die = () => {
                //window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                WORLD_DATA = [];
                restartGame();
            }
        }

        if (!freezePhysics)
        {
            entity.state = (Math.abs(entity.xVel * CELL_SIZE) > 0.2) ? "walk" : "default";
            entity.state = entity.jumped ? "jump" : entity.state;
            if (entity.power != "" && entity.power != undefined)
                entity.state = entity.power + "_" + entity.state;
            entity.animFlip = Math.abs(entity.xVel) > 0.01 ? entity.xVel < 0 : entity.animFlip;         
        }
        runAnimation(entity);

        /*
                Flag Animation
        */
        if (entity.x >= 198.5 && !freezePhysics && !Player.flagA)
        {
            freeze();
            freezeControls = true;
            entity.x = 198.5;
            if (entity.power != "" && entity.power != undefined)
                entity.state = entity.power + "_climb";
            else
                entity.state = "climb"
            setTimeout(function() {
                entity.flagA = true;
            }, 400)
        }
        if (entity.flagA)
        {
            if (entity.y + entity.height <= 12.8)
            {
                entity.y += 0.1;
            }
            else if (!(entity.flagAB))
            {
                setTimeout(function() {
                    entity.flagB = true;
                    unfreeze();
                    entity.state = "walk";
                }, 400);
                entity.flagAB = true;
            }
        }
        if (entity.flagB)
        {
            if (entity.x <= 205)
            {
                entity.xVel += 0.0075;
                entity.yVel += GRAVITY;
            }
            else if (Player)
            {
                setTimeout(function() {
                    loadWorld("1-2")
                    restartGame();
                }, 1000)
                deleteFromWorld(Player);
            }
        }
    },
    "entity/goomba-1":(entity) => {
        if (!(entity.init))
        {
            entity.init = true;
            entity.flip = () => {
                entity.state = "flip";
                entity.speed = 0;
                setTimeout(() => {
                    deleteFromWorld(entity)
                }, 200);
            };
            entity.loadAnimations({
                "default":2,
                "squash":1,
                "flip":1
            }, false);
        }
        bounce(entity);
        runAnimation(entity);
    },
    "question/block-1":(entity) => {
        if (!(entity.init))
        {
            entity.init = true;
            entity.animSpeed = 0.1;
            entity.loadAnimations({
                "default":4,
                "used":1
            }, false);
        }
        bounceAnimation(entity);
    },
    "coin/coin-anim-1":(entity) => {
        if (!(entity.init))
        {
            entity.init = true;
            entity.loadAnimations({
                "default":4
            }, false);
            entity.animSpeed = 0.2;
            setTimeout(() => {
                deleteFromWorld(entity)
            }, 500);
        }
        entity.y -= 0.1;
        runAnimation(entity);
    },
    "power/shroom-1":(entity) => {
        if (!(entity.init))
        {
            entity.init = true;
            entity.flip = () => {
                // TODO
            };
        }
        bounce(entity);
        runAnimation(entity);
    }
}

/*
        Animations
*/

function runAnimation(entity)
{
    if (!("animSprites" in entity) || !("animSpeed" in entity))
        return;
    if (!(entity.animInit))
    {
        entity.state = "default";
        entity.animFlip = false;
        entity.animFrame = 0;
        entity.animInit = true;
    }

    var realAnimState = entity.animFlip ? entity.state + "_flip" : entity.state;
    entity.animFrame += entity.animSpeed;
    if (entity.animFrame >= entity.animSprites[realAnimState].length)
        entity.animFrame = 0;
    entity.sprite = entity.animSprites[realAnimState][Math.floor(entity.animFrame)];
}

function bounceAnimation(entity)
{
    if (!("animSprites" in entity) || !("animSpeed" in entity))
        return;
    if (!(entity.animInit))
    {
        entity.state = "default";
        entity.animFlip = false;
        entity.animFrame = 0;
        entity.animInit = true;
    }

    var realAnimState = entity.animFlip ? entity.state + "_flip" : entity.state;
    entity.animFrame += entity.animSpeed;
    if (entity.animFrame >= entity.animSprites[realAnimState].length || entity.animFrame <= 0) {
        entity.animSpeed *= -1;
        entity.animFrame += entity.animSpeed * 10;
    }
    if (entity.animFrame >= entity.animSprites[realAnimState].length || entity.animFrame <= 0) {
        entity.animFrame = 0;
    }
    entity.sprite = entity.animSprites[realAnimState][Math.floor(entity.animFrame)];
}

/*
        Universal AI
*/
function hop(entity)
{
    entity.y -= 0.2;
    entity.jumped = true;
    setTimeout(() => {
        entity.y += 0.2;
        entity.jumped = false;
    }, 100);

    var e = checkPoint(entity.x + entity.width / 2, entity.y - entity.height / 2, entity);
    if (e)
    {
        if ("flip" in e)
        {
            e.flip();
        }
    }
}
function bounce(entity)
{
    if (!(entity.initBounce))
    {
        entity.direction = true;
        entity.speed = 0.03;
        entity.initBounce = true;
        entity.animSpeed = 0.1;
    }
    if (entity.direction)
        entity.x += entity.speed;
    else
        entity.x -= entity.speed;
    var x = entity.direction ? entity.width + entity.x - 0.1 : entity.x + 0.1;
    if (checkPoint(x, entity.y + entity.height / 2, entity) || !checkPoint(entity.x + entity.width / 2, entity.y + entity.height, entity))
        entity.direction = !entity.direction;
}
function checkPoint(x, y, entity)
{
    for (var i = 0; i < WORLD_DATA.length; i++) {
        const block = WORLD_DATA[i];
        if (block.solid && block != entity)
        {
            if (checkCollisions(x, y, 0, 0, block.x, block.y, block.width, block.height))
            {
                return block;
            }
        }
    }
    return false;
}