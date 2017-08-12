"use strict"

var stage, hero, queue, preloadText;
var currentLevel=0;
var tilesheet;
var platforms=[];
var key ={
    up: false,
    down: false,
    left: false,
    right: false,
    enter: false,
    space: false
};

var lives = 2;
var myScore = 0;

var enemies=[];

var state = {
    gameRunning: false,
    levelComplete: false,
    gamePaused: false,
    gameOver: false
};

var game = {
    backgroundMovement:1};

var settings = {
    maxGravity:3, //pixels per second
    resetJumpPower:22,
    heroSpeed: 1
};

function preload(){ //function init <body onload="init()">
    console.log("hi there, inside preload");
    "use strict";

    stage = new createjs.Stage("myGame");

    preloadText = new createjs.Text("Loading", "40px Josefin Sans", "#FFFFFF");
    preloadText.textBaseline="middle";
    preloadText.textAlign="center";
    preloadText.x=stage.canvas.width/2;
    preloadText.y=stage.canvas.height/2;
    stage.addChild(preloadText);

    queue = new createjs.LoadQueue(true);
    queue.installPlugin(createjs.Sound);
    "use strict";

    queue.on("progress", progress);
    queue.on("complete", setup);
    queue.on('complete', queueComplete);

    queue.loadManifest([
        {id: "bgSplash", src:"assets/img/bg-03.jpg"},
        {id: "gameOver", src:"assets/img/youLose.png"},
        {id: "bgMusic", src:"assets/audio/game.ogg"},
        {id: "jump", src:"assets/audio/jump.wav"},
        {id: "overSound", src:"assets/audio/over-sound.wav"},
        {id: "gomu", src:"assets/json/gomu.json"},
        {id: "tiles", src:"assets/json/tiles2.json"},
        {id: "levels", src:"assets/json/levels2.json"}

    ]);
    console.log("hi there, preloading is done");
}

function setup() { //same as gamReady
    "use strict";

    stage.removeChild(preloadText);

    tilesheet = new createjs.SpriteSheet(queue.getResult("tiles"));
    nextLevel();

    window.addEventListener('keyup', fingerUp);
    window.addEventListener('keydown', fingerDown);

    // HERO //
    var heroSS = new createjs.SpriteSheet(queue.getResult("gomu"));
    hero = new createjs.Sprite(heroSS, "idle");
    hero.y = stage.canvas.height-107;
    hero.width=60;
    hero.height=59;
    hero.jumpPower=0;
    hero.nextX;
    hero.nextY;
    hero.gravityEffect=0;
    stage.addChild(hero);

    //HUD


    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener('tick', heartBeat);
    }

function nextLevel(){
    //currentLevel++;
    stage.removeAllChildren();
    "use strict";
    var i, r;
    platforms=[];

    var img = new createjs.Bitmap("assets/img/bg-01.jpg");
    stage.addChild(img);

    var temp = queue.getResult('levels');
    var levelData = temp.levels[currentLevel];

    for(i=0; i<levelData.platforms.length;i++){
        //console.log(levelData.platforms[0].type);
        for(r=0; r<levelData.platforms[i].repeat; r++){
        var t = new createjs.Sprite(tilesheet, levelData.platforms[i].type);
        t.x = levelData.platforms[i].x+50*r;
        t.y = levelData.platforms[i].y;
        t.width= 50;
        t.height= 54;
        stage.addChild(t);
        platforms.push(t)
            console.log("tile added")
        }
    }
    stage.addChild(hero);
    currentLevel++;
    console.log("i found a pf");
}

function predictHit(player, rect2){
    if (player.nextX >= rect2.x + rect2.width
        || player.nextX + player.width <= rect2.x
        || player.nextY >= rect2.y + rect2.height
        || player.nextY + player.height <= rect2.y)
    {
        return false;
    }
    return true;
}

function progress(e){ //same as loadProgress
    var percent = Math.round(e.progress*100);
    preloadText.text = "Loading: "+percent+"%";
    stage.update();
    console.log("progress is done")
}

function queueComplete() {
    var bgMusic = createjs.Sound.play("bgMusic");
    bgMusic.volume = 1;                               //uncomment later
    //console.log("queue complete");

    createjs.Ticker.setFPS(60);
    createjs.Ticker.on('tick', heartBeat);
}
function fingerUp(e){
    "use strict";
    switch(e.keyCode){
        case 13:
            key.enter = false;
            break;
        case 32:
            key.space = false;
        case 37:
            key.left = false;
            break;
        case 38:
            key.up = false;
            break;
        case 39:
            key.right = false;
            break;
        case 40:
            key.down = false;
            break;
    }
}
function fingerDown(e){
    "use strict";
    switch(e.keyCode){
        /*case 13:
            key.enter = true;
            nextLevel();
            break;*/
        case 32:
            key.space = true;
            break;
        case 37:
            key.left = true;
            break;
        case 38:
            key.up = true;
            break;
        case 39:
            key.right = true;
            break;
        case 40:
            key.down = true;
            break;
    }
}


function objectOnPlatform(moving, stationary){
    if(moving.x < stationary.x + stationary.width
        && moving.x+moving.width > stationary.x
        && Math.abs((moving.y + moving.height)-stationary.y)<3
    ){
        moving.y = stationary.y-moving.height;
        return true;
    }
    return false;
}

//console.log("objet on platform called")

function moveHero() {
    "use strict";
    var i, standingOnPlatform = false;
    var canJump = false;
    for (i = 0; i < platforms.length; i++) {
        if (objectOnPlatform(hero, platforms[i])) {
            standingOnPlatform = true;
            //console.log("on PF")
            canJump = true;
        }
    }

    //jumping logic
    if (key.up && canJump) {
        canJump=false;
        standingOnPlatform=false;
        hero.jumpPower=settings.resetJumpPower;
        var jumpSound = createjs.Sound.play("jump");
        jumpSound.volume = 0.5;
    }

    //moving
    if (key.space) {
        if (hero.currentAnimation != "shoot") {
            hero.currentAnimation = "shoot";
            hero.gotoAndPlay('shoot');
            hero.currentDirection = "shoot";
        }
    }

    if (key.right) {
        var collisionDetected=false;
        hero.nextY=hero.y;
        hero.nextX=hero.x-settings.heroSpeed;
        for (i=0; i<platforms.length; i++) {
            if (predictHit(hero, platforms[i])) {
                console.log("hit predicted")
                collisionDetected=true;
                break;
            }
        }
        if (!collisionDetected) {
            hero.x+=settings.heroSpeed;
        }
        hero.x+=settings.heroSpeed;
        if (hero.currentAnimation != "right") {
            hero.currentAnimation = "right";
            hero.gotoAndPlay('right');
            hero.currentDirection = "right";
        }
    }
    if (key.left) {
        var collisionDetected=false; //to not pass blocks
        hero.nextY=hero.y;
        hero.nextX=hero.x-settings.heroSpeed;
        for(i=0; i<platforms.length;i++) {
            if(predictHit(hero, platforms[i])) {
                console.log("hit predicted left");
                collisionDetected=true;
                break;
            }
        }
        if (!collisionDetected) {
            hero.x-=settings.heroSpeed;
        }
        hero.x-=settings.heroSpeed;
        if (hero.currentAnimation != "left") {
            hero.currentAnimation = "left";
            hero.gotoAndPlay('left');
            hero.currentDirection = "left";
        }

    if (key.up) {
        hero.y-=settings.heroSpeed;
        if(hero.currentDirection != "up"){
            hero.gotoAndPlay('up')
            hero.currentDirection="up";
        }
    }

    if (key.down) {
        hero.y+=settings.heroSpeed;
        if(hero.currentDirection != "down"){
            hero.gotoAndPlay('down')
            hero.currentDirection="down";
            }
        }
    }

    //apply gravity
    if (!standingOnPlatform){
        if(hero.jumpPower > 0) {
            var collisionDetected=false;
            hero.nextY=hero.y-hero.jumpPower; //
            hero.nextX=hero.x; //
            for(i=0;i<platforms.length;i++) {

                if(predictHit(hero, platforms[i])) {
                    console.log("hit predicted")
                    collisionDetected=true;
                    break;
                }
            }
            if(collisionDetected){
                hero.jumpPower=0;
            }
            hero.y-=hero.jumpPower;
            hero.jumpPower--;
        }
        hero.y+=hero.gravityEffect;
        hero.gravityEffect++;
        if (hero.gravityEffect>settings.maxGravity){
            hero.gravityEffect=settings.maxGravity;
        }
    }
}

function movePlatforms(){
    for(var i = 0; i<platforms.length; i++){
        platforms[i].x-=game.backgroundMovement;
    }
}

///// game over + you win functions ///

/*
function gameOver() {
    stage.removeAllChildren();
    var lost = new createjs.Bitmap(queue.getResult('gameOver'));
    stage.addChild(lost);
  game.sounds.backgroundMusic.stop();
  game.sounds.gameOverSound = createjs.Sound.play("overSound");
  gameOverScreen = new createjs.Bitmap(game.queue.getResult("gameOver"));
  //game.elements.stage.addChild(gameOverScreen);
}


//function restart()

// function youWin()


/*SCORE
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: "+score, 8, 20);
}
*/

console.log("almost heartbeat")

function heartBeat(e){
    //console.log("hi there, inside heartbeat");
    "use strict";
    movePlatforms();
    moveHero();
    stage.update(e);
}
