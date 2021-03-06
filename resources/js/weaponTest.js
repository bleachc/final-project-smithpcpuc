var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var pit;
var leftBullets;
var rightBullets;
var spaceBar;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('bullet', 'resources/img/bullet.png');
    this.load.image('sky', 'resources/img/swamp.png');
    this.load.image('ground', 'resources/img/junglefloor.png');
    this.load.image('ledge', 'resources/img/jungleplatform.png');
    this.load.image('wall', 'resources/img/junglewall.png');
    this.load.image('lvlBound', 'resources/img/levelBoundary.png');
    this.load.image('star', 'resources/img/CoinAnimation.gif');
    this.load.image('bomb', 'resources/img/Monkey.gif');
    this.load.spritesheet('guy', 'resources/img/JungleGuy-v5.png', { frameWidth: 120, frameHeight: 92 });
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(4).refreshBody();

    //  Now let's create some ledges
    //platforms.create(600, 390, 'ledge').setScale(.50).refreshBody();

    platforms.create(800, 335, 'wall').setScale(3.5).refreshBody();
    platforms.create(10, 335, 'wall').setScale(3.5).refreshBody();

    //Level Boundary
    //platforms.create(800, 80, 'lvlBound').setScale(5).refreshBody();

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'guy').setScale(.85).refreshBody();

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('guy', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'guy', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('guy', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 5,
        setXY: { x: 200, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
    });

    bombs = this.physics.add.group();

    leftBullets = this.physics.add.group();

    rightBullets = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 16, 'SCORE: 0', { fontSize: '32px', fill: '#ff0000' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    this.physics.add.collider(leftBullets, rightBullets, bombs, killBomb, null, this);

    this.physics.add.collider(leftBullets, rightBullets, platforms, killBullet, null, this);
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);

        if (spaceBar.isDown)
    {
        leftBullets.create(parseInt(player.body.x), parseInt(player.body.y), 'bullet').setScale(5).refreshBody;
        leftBullets.setVelocityX(-200);
        leftBullets.setVelocityY(0)
    }

    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);

        if (spaceBar.isDown)
    {
        rightBullets.create(parseInt(player.body.x), parseInt(player.body.y), 'bullet').setScale(5).refreshBody;
        rightBullets.setVelocityX(200);
        rightBullets.setVelocityY(0)
    }
            console.log(player.body.x);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }

    if (player.body.y > 800)
    {
        alert("Game Over");
    }  
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}

function killBomb (leftBullets, rightBullets, bombs)
{
    bombs.disableBody(true, true);
    leftBullets.disableBody(true, true);
    rightBullets.disableBody(true, true);
}

function killBullet (leftBullets, rightBullets, platforms)
{
    leftBullets.disableBody(true, true);
    rightBullets.disableBody(true, true);
}