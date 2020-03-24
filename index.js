// Get localhost IP address: os.networkInterfaces()["Wi-Fi 2"].find(e => e.family === "IPv4").address

/**
 * Todo:
 *  Make cpu player work
 *  Make winning do something other than throw an error (error because there is no preset 7-bit 10)
 *  Make bouncing off paddles work
 *  Fix bug where if ball ends up in corner of field it just stops and flickers
 */

"use strict";
const flags = require("./flags")();
const { Terminal, Sprite, Box } = require("./cmdDraw");
console = require("./colorConsole");

const random = (min, max) => Math.random() * (max - min) + min;
const randomSlope = (min, max) => Math.tan(random(Math.atan(min), Math.atan(max)));
function nextPoint (slope, direction) {
  const directionMod = direction === "right" ? 1 : -1;
  let directionFunc;
  if (direction === "right") directionFunc = n => Math.min(n, terminal.width - ball.width);
  else directionFunc = n => n === Infinity ? 0 : Math.max(n, 0);
  const ballYInt = -slope * ball.x + ball.y;
  //terminal.log(`y=${slope}x+${ballYInt}`);
  //terminal.log(directionMod * slope);
  const x = directionFunc(directionMod * slope < 0 ? -ballYInt / slope : (terminal.height - ball.height - ballYInt) / slope);
  //terminal.log(x);
  return [ball.xRounder(x), ball.yRounder(slope * x + ballYInt)];
}
const writeScore = (score, location) => terminal.sevenBit(location === "right" ? rightScoreX : leftScoreX, 1, ...Terminal.sevenBitPresets.numbers[score]);

const terminal = new Terminal({
  width: flags.w || flags.width || 110,
  height: flags.h || flags.height || 30,
  border: "solid",
  dev: flags.d || flags.dev,
  color: {
    foreground: flags.c || flags.color || flags.fg || flags.foreground || "white",
    background: flags.bg || flags.background || flags.backgroundColor || "black"
  }
});

const centerX = terminal.width / 2;
const centerY = terminal.height / 2;
const paddleHeight = 8;
const paddleWidth = 2;
const paddleX = 7;
const leftScoreX = Math.floor(terminal.width / 4 - 3);
const rightScoreX = Math.ceil(3 * terminal.width / 4 - 3);
let cpuScore = 0;
let playerScore = 0;
let framesSincePaddleMoved = 0;
let ballDirection = Math.round(Math.random()) ? "left" : "right";
let ballSlope, bouncedOff;

const drawCenterLine = () => terminal.drawLine(centerX, 0, centerX, terminal.height, null, 2, true, 0.5);
drawCenterLine();

const leftPaddle = new Box(paddleWidth, paddleHeight, { speed: 10 });
const rightPaddle = new Box(paddleWidth, paddleHeight, { speed: 30 });
const ball = new Box(2, 1, { speed: 30 });

terminal.addSprite(leftPaddle);
terminal.addSprite(rightPaddle);
terminal.addSprite(ball);

function resetPaddles () {
  leftPaddle.draw(paddleX, centerY - paddleHeight / 2);
  rightPaddle.draw(terminal.width - paddleX - paddleWidth, centerY - paddleHeight / 2);
}

terminal.on("up", () => {
  rightPaddle.moveTo(rightPaddle.x, Math.max(rightPaddle.y - 1, 0));
});
terminal.on("down", () => {
  rightPaddle.moveTo(rightPaddle.x, Math.min(rightPaddle.y + 1, terminal.height - rightPaddle.height));
});

function resetBall () {
  bouncedOff = undefined;
  ballSlope = randomSlope(-0.5, 0.5);
  ball.clear();
  setTimeout(() => {
    //terminal.log("foo");
    ball.draw(centerX - 1, centerY);
    //terminal.log("bar");
    //bounce();
    ball.moveTo(...nextPoint(ballSlope, ballDirection));
    //terminal.log("buz");
  }, 200);
}
function bounce () {
  ball.moveTo(...nextPoint(ballSlope, ballDirection));
}

//console.log(randomSlope(-1, 1));

ball.on("clear", (x, y) => {
  if (x <= centerX && x >= centerX - 2) drawCenterLine();
  else if (!(y + ball.height < 1 || y > 5)) {
    if (!(x + ball.width < leftScoreX || x >= leftScoreX + 6)) writeScore(cpuScore, "left");
    else if (!(x + ball.width < rightScoreX || x >= rightScoreX + 6)) writeScore(playerScore, "right");
  }
});
ball.on("frame", () => {
  //terminal.log("frame");
  if (bouncedOff !== rightPaddle && ball.touching(rightPaddle)) {
    ball.stop();
    ballDirection = "left";
    ballSlope = Math.tan(Math.PI * (leftPaddle.y - ball.y - 4) / 36);
    terminal.log((leftPaddle.y - ball.y - 4) / 12960);
    bouncedOff = rightPaddle;
    bounce();
  }
  else if (bouncedOff !== leftPaddle && ball.touching(leftPaddle)) {
    ball.stop();
    ballDirection = "right";
    ballSlope = Math.tan(-Math.PI * (leftPaddle.y - ball.y - 4) / 36);
    terminal.log(-(leftPaddle.y - ball.y - 4) / 0.1);
    bouncedOff = leftPaddle;
    bounce();
  }
  if (!(framesSincePaddleMoved++ % 100)) leftPaddle.moveTo(paddleX, Math.max(0, Math.min(terminal.height - paddleHeight, ball.y - (paddleHeight - ball.height) / 2)));
});
ball.on("moveEnded", () => {
  //terminal.log(ball.y);
  if (ball.y === 0 || ball.y === terminal.height - 1) {
    ballSlope *= -1;
    bounce();
  }
  else {
    if (ball.x === 0) {
      writeScore(++playerScore, "right");
      ballDirection = "left";
    }
    else {
      writeScore(++cpuScore, "left");
      ballDirection = "right";
    }
    resetPaddles();
    resetBall();
  }
});
/*leftPaddle.on("stop", () => {
  throw new Error("Stopped");
});*/

writeScore(0, "left");
writeScore(0, "right");

resetPaddles();
resetBall();