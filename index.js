// Get localhost IP address: os.networkInterfaces()["Wi-Fi 2"].find(e => e.family === "IPv4").address

const flags = require("./flags")();
const { Terminal, Box } = require("./cmdDraw");
console = require("./colorConsole");

const terminal = new Terminal({
  width: flags.w || flags.width || 110,
  height: flags.h || flags.height || 30,
  border: "solid",
  dev: flags.d || flags.dev
});

const fg = flags.c || flags.color || flags.fg || flags.foreground;
const bg = flags.bg || flags.background || flags.backgroundColor;
if (terminal.out.getColorDepth() === 1 && (fg || bg)) console.warn("Colors are not supported in your terminal");
else {
  terminal.color.foreground = fg || "white";
  terminal.color.background = bg || "black";
}

terminal.drawLine(terminal.width / 2, 0, terminal.width / 2, terminal.height, null, 2, true, 0.5);

const leftPaddle = new Box(2, 8, { speed: 30 });
const rightPaddle = new Box(2, 8, { speed: 30 });

terminal.addSprite(leftPaddle);
terminal.addSprite(rightPaddle);

leftPaddle.draw(7, terminal.height / 2 - 4);
rightPaddle.draw(terminal.width - 9, terminal.height / 2 - 4);

terminal.on("up", () => {
  rightPaddle.moveTo(rightPaddle.x, Math.max(rightPaddle.y - 1, 0));
});
terminal.on("down", () => {
  rightPaddle.moveTo(rightPaddle.x, Math.min(rightPaddle.y + 1, terminal.height - rightPaddle.height));
});