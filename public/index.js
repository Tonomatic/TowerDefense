var config = {
    type: Phaser.AUTO,
    parent: "content",
    width: 1000,
    height: 800,
    physics: {
        default: "arcade",
    },
    scene: {
        key: "main",
        preload: preload,
        create: create,
        update: update,
    },
};
var game = new Phaser.Game(config);
var graphics;
var path;

function preload() {
    this.load.atlas("sprites", "spritesheet.png", "spritemovement.json");
    this.load.image("bullet", "bullet.png");
}
var ENEMY_SPEED = 1 / 10000;
var BULLET_DAMAGE = 50;
var COUNT = 0;

var map = [
    [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, -1, -1, -1, -1, -1, -1, -1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
];

var Enemy = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Enemy(scene) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, "sprites", "enemy");
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    },
    startOnPath: function () {
        this.follower.t = 0;
        path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.hp = 100;
    },
    receiveDamage: function (damage) {
        this.hp -= damage;
        // if hp drops below 0 we deactivate this enemy
        if (this.hp <= 0) {
            this.setActive(false);
            this.setVisible(false);
            COUNT++;
        }
    },
    update: function (time, delta) {
        // move the t point along the path, 0 is the start and 0 is the end
        this.follower.t += ENEMY_SPEED * delta;

        // get the new x and y coordinates in vec
        path.getPoint(this.follower.t, this.follower.vec);

        // update enemy x and y to the newly obtained x and y
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        // if we have reached the end of the path, remove the enemy
        if (this.follower.t >= 1) {
            this.setActive(false);
            this.setVisible(false);
        }
    },
});

var Turret = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,
    initialize: function Turret(scene) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, "sprites", "turret");
        this.nextTic = 0;
    },
    //then we place the turret according to the grid
    place: function (i, j) {
        this.y = i * 100 + 100 / 2;
        this.x = j * 100 + 100 / 2;
        map[i][j] = 1;
    },
    update: function (time, delta) {
        if (time > this.nextTic) {
            this.fire();
            this.nextTic = time + 1000;
        }
    },
    fire: function () {
        var enemy = getEnemy(this.x, this.y, 150);
        if (enemy) {
            var angle = Phaser.Math.Angle.Between(
                this.x,
                this.y,
                enemy.x,
                enemy.y
            );
            addBullet(this.x, this.y, angle);
            this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
        }
    },
});

var Bullet = new Phaser.Class({
    Extends: Phaser.GameObjects.Image,
    initialize: function Bullet(scene) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, "bullet");
        this.dx = 0;
        this.dy = 0;
        this.lifespan = 0;
        this.speed = Phaser.Math.GetSpeed(600, 1);
    },
    fire: function (x, y, angle) {
        this.setActive(true);
        this.setVisible(true);
        //  Bullets fire from the middle of the screen to the given x/y
        this.setPosition(x, y);
        //  we don't need to rotate the bullets as they are round
        //  this.setRotation(angle);
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
        this.lifespan = 300;
    },
    update: function (time, delta) {
        this.lifespan -= delta;
        this.x += this.dx * (this.speed * delta);
        this.y += this.dy * (this.speed * delta);
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    },
});
//making a drawgrid function
function drawGrid(graphics) {
    graphics.lineStyle(1, 0x0000ff, 0.8);
    for (let i = 0; i < 8; i++) {
        graphics.moveTo(0, i * 100);
        graphics.lineTo(1000, i * 100);
    }
    for (let j = 0; j < 10; j++) {
        graphics.moveTo(j * 100, 0);
        graphics.lineTo(j * 100, 800);
    }

    graphics.strokePath();
}

function placeTurret(pointer) {
    var i = Math.floor(pointer.y / 100);
    var j = Math.floor(pointer.x / 100);
    if (canPlaceTurret(i, j)) {
        var turret = turrets.get();
        if (turret) {
            turret.setActive(true);
            turret.setVisible(true);
            turret.place(i, j);
        }
    }
}

function canPlaceTurret(i, j) {
    return map[i][j] === 0;
}

function addBullet(x, y, angle) {
    var bullet = bullets.get();
    if (bullet) {
        bullet.fire(x, y, angle);
    }
}

function damageEnemy(enemy, bullet) {
    // only if both enemy and bullet are alive
    if (enemy.active === true && bullet.active === true) {
        // we remove the bullet right away
        bullet.setActive(false);
        bullet.setVisible(false);

        // decrease the enemy hp with BULLET_DAMAGE
        enemy.receiveDamage(BULLET_DAMAGE);
    }
}

function getEnemy(x, y, distance) {
    var enemyUnits = enemies.getChildren();
    console.log(enemies)
    for (let i = 0; i < enemyUnits.length; i++) {
        if (
            enemyUnits[i].active &&
            Phaser.Math.Distance.Between(
                x,
                y,
                enemyUnits[i].x,
                enemyUnits[i].y
            ) <= distance
        )   return enemyUnits[i];
    }
    return false;
}

function create() {
    // this graphics element is only for visualization,
    // its not related to our path
    var graphics = this.add.graphics();
    drawGrid(graphics);
    // the path for our enemies
    // parameters are the start x and y of our path
    path = this.add.path(150, -32);
    path.lineTo(150, 250);
    path.lineTo(750, 250);
    path.lineTo(750, 800);

    graphics.lineStyle(3, 0xffffff, 1);
    // visualize the path
    path.draw(graphics);
    enemies = this.physics.add.group({
        classType: Enemy,
        runChildUpdate: true,
    });
    this.nextEnemy = 0;
    turrets = this.add.group({ classType: Turret, runChildUpdate: true });
    this.input.on("pointerdown", placeTurret);
    bullets = this.physics.add.group({
        classType: Bullet,
        runChildUpdate: true,
    });
    this.physics.add.overlap(enemies, bullets, damageEnemy);
}

function update(time, delta) {
    // if its time for the next enemy
    var enemyLength = enemies.getChildren().length;
    if(enemyLength === 5) {
        return;
    }

    if (time > this.nextEnemy) {
        var enemy = enemies.get();
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);

            // place the enemy at the start of the path
            enemy.startOnPath();

            this.nextEnemy = time + 2000;
        }
    }
}
