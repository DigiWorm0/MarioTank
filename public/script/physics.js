/*
        Motion
*/
function addMotion(entity)
{
    entity.yVel += GRAVITY;

    entity.y += entity.yVel;

    
    if (!verifyMovement(entity))
    {
        entity.y -= entity.yVel;

        if (entity.yVel > 0)
            entity.jumped = false;
        
        entity.yVel = 0;
    }
    

    entity.x += entity.xVel;

    if (!verifyMovement(entity) || entity.x <= 0)
    {
        entity.x -= entity.xVel;

        entity.xVel = 0;
    }

    entity.xVel *= X_MOTION_DAMPING;
    entity.yVel *= Y_MOTION_DAMPING;
}

/*
        Collision Detection
*/
function verifyMovement(entity)
{
    var collision = true;
    for (var i = 0; i < WORLD_DATA.length; i++) {
        const block = WORLD_DATA[i];
        if (block.solid && block != entity)
        {
            var collides = checkCollisions(entity.x, entity.y, entity.width, entity.height, block.x, block.y, block.width, block.height)
            if (collides)
            {
                if (block.type == "question/block-1" && (entity.x + entity.width / 2) > block.x && (entity.x + entity.width / 2) < block.x + block.width && entity.yVel < 0)
                    block.state="used";
                if (block.type == "entity/goomba-1" && entity.yVel > 0.02) {
                    WORLD_DATA.splice(i, 1)
                    entity.yVel = -BOUNCE_FORCE;

                }
                else
                    collision = false;
            }
        }
    }
    return collision;
}
function checkCollisions(x1, y1, w1, h1, x2, y2, w2, h2) {
    if (x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2){
        return false;
    }
    return true;
}

/*
        World Update
*/
function updateWorld(world)
{
    world.forEach(block => {
        if (block.type in DefaultAI)
        {
            DefaultAI[block.type](block);
        }
    });
}