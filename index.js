// Get localhost IP address: os.networkInterfaces()["Wi-Fi 2"].find(e => e.family === "IPv4").address

/**
 * Todo:
 *  Make winning do something other than throw an error (error because there is no preset 7-bit 10)
 */

"use strict";
const flags = require("./flags")();
const { Terminal, Box } = require("./cmdDraw");
console = require("./colorConsole");

const random = (min, max) => Math.random() * (max - min) + min;
const randomSlope = (min, max) => Math.tan(random(Math.atan(min), Math.atan(max)));
function directionFunc (n, direction) {
  const min = 0;
  const max = terminal.width - ball.width;
  if (Math.abs(n) === Infinity) {
    if (direction === "right") return max;
    else return min;
  }
  else return Math.min(Math.max(n, min), max);
}
function nextPoint (slope, direction) {
  const directionMod = direction === "right" ? 1 : -1;
  const ballYInt = -slope * ball.x + ball.y;
  const x = directionFunc(directionMod * slope < 0 ? -ballYInt / slope : (terminal.height - ball.height - ballYInt) / slope, direction);
  const y = ball.yRounder(slope * x + ballYInt);
  if (x > paddleX + paddleWidth) leftPaddle.moveTo(paddleX, Math.min(Math.max(y + 1 - paddleHeight / 2, 0), terminal.height - paddleHeight));
  else leftPaddle.moveTo(paddleX, ball.yRounder(Math.min(Math.max(slope * (paddleX + paddleWidth) + ballYInt + 1 - paddleHeight / 2, 0), terminal.height - paddleHeight)));
  return [ball.xRounder(x), y];
}
const writeScore = (score, location) => terminal.sevenSegment(location === "right" ? rightScoreX : leftScoreX, 1, ...Terminal.sevenSegmentPresets.numbers[score]);

const terminal = new Terminal({
  width: flags.w || flags.width || 110,
  height: flags.h || flags.height || 30,
  border: "solid",
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
const letters = Terminal.bitmapPresets.letters;
const borders = Terminal.BORDERS.double;
borders.horizontalDown = "\u2566";
borders.horizontalUp = "\u2569";
let cpuScore = 0;
let playerScore = 0;
let ballDirection = Math.round(Math.random()) ? "left" : "right";
let ballSlope, bouncedOff;

const drawCenterLine = () => terminal.drawLine(centerX, 0, centerX, terminal.height, null, 2, true, 0.5);

const leftPaddle = new Box(paddleWidth, paddleHeight,);
const rightPaddle = new Box(paddleWidth, paddleHeight, { speed: 30 });
const ball = new Box(2, 1, { speed: 30 });

terminal.addSprite(leftPaddle);
terminal.addSprite(rightPaddle);
terminal.addSprite(ball);

function reset () {
  // paddles
  leftPaddle.stop();
  rightPaddle.stop();
  leftPaddle.draw(paddleX, centerY - paddleHeight / 2);
  rightPaddle.draw(terminal.width - paddleX - paddleWidth, centerY - paddleHeight / 2);

  // ball
  bouncedOff = undefined;
  ballSlope = randomSlope(-0.5, 0.5);
  ball.speed = 30;
  ball.clear();
  setTimeout(() => {
    ball.draw(centerX - 1, centerY);
    bounce();
  }, 200);
}
function bounce() {
  ball.moveTo(...nextPoint(ballSlope, ballDirection));
}

function init () {
  terminal.clear();

  terminal.on("up", () => {
    rightPaddle.moveTo(rightPaddle.x, Math.max(rightPaddle.y - 1, 0));
  });
  terminal.on("down", () => {
    rightPaddle.moveTo(rightPaddle.x, Math.min(rightPaddle.y + 1, terminal.height - rightPaddle.height));
  });

  ball.on("clear", (x, y) => {
    if (x <= centerX && x >= centerX - 2) drawCenterLine();
    else if (!(y + ball.height < 1 || y > 6)) {
      if (!(x + ball.width < leftScoreX || x >= leftScoreX + 6)) writeScore(cpuScore, "left");
      else if (!(x + ball.width < rightScoreX || x >= rightScoreX + 6)) writeScore(playerScore, "right");
    }
  });
  ball.on("frame", () => {
    const touching = ball.touching(rightPaddle) ? rightPaddle : ball.touching(leftPaddle) ? leftPaddle : null;
    if (touching) {
      touching.draw();
      if (bouncedOff !== touching) {
        ball.stop();
        let x;
        if (touching === rightPaddle) {
          x = terminal.width - paddleX - 1;
          ballDirection = "left";
        }
        else {
          x = paddleX + 1;
          ballDirection = "right";
        }
        ballSlope = ((rightPaddle.y + paddleHeight / 2) - (ball.y + 0.5)) / ((terminal.width - paddleX) - Math.min(ball.x + 1, x)) / 1.5 + (Math.random() - 0.5) / 5;
        ball.speed += 10;
        bouncedOff = touching;
        bounce();
      }
    }
  });
  ball.on("moveEnded", () => {
    const playerScored = ball.x === 0;
    const cpuScored = ball.x === terminal.width - ball.width;
    if (playerScored || cpuScored) {
      let score;
      if (playerScored) score = ++playerScore;
      else if (cpuScored) score = ++cpuScore;
      if (score === 10) {
        let x = playerScored ? terminal.width / 2 - 29 : terminal.width / 2 - 33;
        const y = terminal.height / 2 - 2.5;
        terminal.removeAllListeners();
        terminal.clear();
        terminal.bitmap(x, y, letters.Y, letters.O, letters.U);
        terminal.bitmap(x + 28, y, ...(playerScored ? [letters.W, letters.I, letters.N, Terminal.bitmapPresets.punctuation["!"]] : [letters.L, letters.O, letters.O, letters.S, letters.E]));
        process.exit();
      }
      else {
        writeScore(score, ballDirection);
        ballDirection = playerScored ? "left" : "right";
        reset();
      }
    }
    else if (ball.y === 0 || ball.y === terminal.height - 1) {
      ballSlope *= -1;
      bounce();
    }
  });
  /*leftPaddle.on("stop", () => {
    throw new Error("Stopped");
  });*/

  writeScore(0, "left");
  writeScore(0, "right");

  reset();
  drawCenterLine();
}


terminal.bitmap(terminal.width / 2 - 15, terminal.height / 3 - 2.5, letters.P, letters.O, letters.N, letters.G);
terminal.write("\x1b[4mBy Liam Bloom\x1b[0m", terminal.width / 2 - 6.5, terminal.height / 3 + 3.5);
terminal.color.refresh();
terminal.write(borders.topLeft + 
  borders.horizontal.repeat(8) + borders.horizontalDown + 
  borders.horizontal.repeat(10) + borders.horizontalDown + 
  borders.horizontal.repeat(8) + borders.horizontalDown + 
  borders.horizontal.repeat(14) + borders.topRight, terminal.width / 2 - 22.5, 2 * terminal.height / 3 - 1.5);
terminal.write(borders.vertical +
  " 1:easy " + borders.vertical +
  " 2:medium " + borders.vertical +
  " 3:hard " + borders.vertical +
  " 4:impossible " + borders.vertical, terminal.width / 2 - 22.5, 2 * terminal.height / 3 - 0.5);
terminal.write(borders.bottomLeft +
  borders.horizontal.repeat(8) + borders.horizontalUp +
  borders.horizontal.repeat(10) + borders.horizontalUp +
  borders.horizontal.repeat(8) + borders.horizontalUp +
  borders.horizontal.repeat(14) + borders.bottomRight, terminal.width / 2 - 22.5, 2 * terminal.height / 3 + 0.5);

terminal.on("1", () => {
  leftPaddle.speed = 10;
  init();
});
terminal.on("2", () => {
  leftPaddle.speed = 15;
  init();
});
terminal.on("3", () => {
  leftPaddle.speed = 20;
  init();
});
terminal.on("4", () => {
  leftPaddle.speed = 30;
  init();
});