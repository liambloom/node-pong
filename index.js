// Get localhost IP address: os.networkInterfaces()["Wi-Fi 2"].find(e => e.family === "IPv4").address

const flags = require("./flags")();
const cmdDraw = require("./cmdDraw");

const cmd = new cmdDraw.CMD({
  width: flags.w || flags.width || 110,
  height: flags.h || flags.height || 30,
  border: "solid"
});

const fg = flags.c || flags.color || flags.fg || flags.foreground;
const bg = flags.bg || flags.background || flags.backgroundColor;
if (fg) cmd.color.fg = fg;
if (bg) cmd.color.bg = bg;

cmd.drawLine(cmd.width / 2, 0, cmd.width / 2, cmd.height, 2, true, 0.5);
/*cmd.drawLine(0,   0, cmd.width, 0, 1, true, 0.5);
cmd.drawLine(0,   1, cmd.width, 1, 1, true, 1  );
cmd.drawLine(0,   2, cmd.width, 2, 1, true, 1.5);
cmd.drawLine(0,   3, cmd.width, 3, 1, true, 2  );
cmd.drawLine(0.5, 4, cmd.width, 4, 1, true, 0.5);
cmd.drawLine(0.5, 5, cmd.width, 5, 1, true, 1  );
cmd.drawLine(0.5, 6, cmd.width, 6, 1, true, 1.5);
cmd.drawLine(0.5, 7, cmd.width, 7, 1, true, 2  );*/

/*const leftPaddle = new cmdDraw.Sprite({

});*/

//cmd.drawBox(0, 0, cmd.width, cmd.height);

/*function drawPaddle (x, y) {
  if (x < 0.5 || x > width + 1.5 || y < 0.5 || y > height + 1.5) return false;
  x += lrMargin;
  y += tbMargin - 2.5;
  if (y % 1 < 0.75 && y % 1 > 0.25) {
    process.stdout.cursorTo(x, Math.floor(y));
    process.stdout.write("\u2584\u2584");
  }
  const fullBlockY = y % 1 < 0.25 ? Math.floor(y) : Math.ceil(y);
  for (let row = 0; row < 5; row++) {
    process.stdout.cursorTo(x, Math.ceil(y) + row);
    process.stdout.write("\u2588\u2588");
  }
  return true;
}

process.stdout.on("resize", onresize);

process.stdout.cursorTo(0, 0);
process.stdout.clearScreenDown();
onresize();
drawBorder();

drawPaddle(6, height / 2);*/


/*if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = callback => {
    return setImmediate(() => {
      callback(performance.now());
    });
  };
  global.cancelAnimationFrame = global.clearImmediate;
}*/

/*let currentDots = 1;
setInterval(() => {
  process.stdout.cursorTo(0, 0);
  process.stdout.clearScreenDown();
  for (let i = 0; i < currentDots; i++) process.stdout.write(".\n");
  if (currentDots++ === 3) currentDots = 1;
}, 500);*/