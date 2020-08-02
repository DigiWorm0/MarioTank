/*
        Check Player Collisions
*/

function checkPlayerCollisions(block)
{
    if (block.type.includes("coin/coin-") && block.type != "coin/coin-anim-1")
    {
        Player.coins++;
        deleteFromWorld(block);
        return false;
    }
    else if (block.type.includes("question/block-") && (Player.x + Player.width - 0.1) > block.x && (Player.x + 0.1) < block.x + block.width && Player.yVel < 0 && block.state != "used")
    {
        block.state="used";
        if (block.prop != "")
            WORLD_DATA.push(new WorldObject(block.prop, block.x, block.y - 1, {
                "solid":false
            }))
        Player.score += 200;
        Player.coins += 1;
        hop(block);
        return true;
    }
    else if (block.type.includes("brick/float-") && (Player.x + Player.width - 0.1) > block.x && (Player.x + 0.1) < block.x + block.width && Player.yVel < 0 && !(block.jumped)) {
        hop(block);
        return true;
    }
    else if (block.type.includes("pipe/up") && block.prop != "" && Controls.down)
    {
        loadWorld(block.prop, "spawn/" + currentWorld)
        return true;
    }
    else if (block.type.includes("pipe/left") && block.prop != "" && Controls.right)
    {
        loadWorld(block.prop, "spawn/" + currentWorld)
        return false;
    }
    else if (block.type == "entity/goomba-1")
    {
        if (Player.yVel > 0.02) {
            var b = block;
            setTimeout(() => {
                deleteFromWorld(b)
            }, 200);
        
            block.speed = 0;
            block.state = "squash";
            block.solid = false;
            block.y += 0.75;

            Player.score += 100;

            if (Controls.up) {
                Player.yVel = -BOUNCE_FORCE * 2;
                Player.jumped = true
            }
            else
                Player.yVel = -BOUNCE_FORCE;
            Player.y += Player.yVel;
        }
        else
        {
            Player.die();
        }
        return false;
    }
    return block.solid;
}