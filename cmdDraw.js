const EventEmitter = require('events');
const readline = require("readline");
const { performance } = require("perf_hooks");
const verify = require("./verifyType");
require("./animation");

const roundToNearest = (num, nearest) => Math.round(num / nearest) * nearest;
const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

class Margin {
  constructor (out, width, height) {
    this.#out = out;
    this.#width = width;
    this.#height = height;
  }
  get lr() {
    return Math.floor((this.#out.columns - this.#width) / 2);
  }
  get tb() {
    return Math.floor((this.#out.rows - this.#height) / 2);
  }
  #out;
  #width;
  #height;
}

class Color extends EventEmitter {
  constructor (out) {
    super();
    this.#out = out;
  }
  reset () {
    this.#foreground = undefined;
    this.#background = undefined;
    this.#out.write(Color.RESET);
    this.emit("change");
  }
  refresh () {
    this.#out.write(Color.RESET);
    if (this.foreground) this.#out.write(Color.getForegroundColor(this.foreground));
    if (this.background) this.#out.write(Color.getBackgroundColor(this.background));
  }
  get foreground () {
    return this.#foreground;
  }
  set foreground (color) {
    this.#out.write(Color.getForegroundColor(color));
    this.#foreground = color;
    this.emit("change");
  }
  get background () {
    return this.#background;
  }
  set background (color) {
    this.#out.write(Color.getBackgroundColor(color));
    this.#background = color;
    this.emit("change");
  }
  #out;
  #foreground;
  #background;
  static getForegroundColor (color) {
    const index = this.#COLORS.indexOf(color);
    if (index === -1) throw new Error(color + " is not a valid color");
    else return `\x1b[3${index}m`;
  }
  static getBackgroundColor(color) {
    const index = this.#COLORS.indexOf(color);
    if (index === -1) throw new Error(color + " is not a valid color");
    else return `\x1b[4${index}m`;
  }
  static RESET = "\x1b[0m";
  static #COLORS = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
}

module.exports.CMD = class CMD extends EventEmitter {
  constructor (config = {}) {
    super();
    Object.defineProperties(this, {
      out: {
        value: verify.config(config, "out", process.stdout)
      },
      borderChars: {
        value: CMD.#BORDERS[verify.config(config, "border", "light")] || (() => { throw new Error(`config.${config.border} is not a valid border type`); })()
      },
      // The following 2 could go in any set of property definitions
      in: {
        value: verify.config(config, "in", process.stdin)
      },
      hasBorder: {
        value: !(config.border === "none")
      },
      dev: {
        value: verify.config(config, "dev", false)
      }
    });
    config.width = verify.config(config, "width", this.out.columns - 2 * this.largestBorder, false, -this.out.columns + 1, this.out.columns);
    config.height = verify.config(config, "height", this.out.rows - 2, false, -this.out.rows + 1, this.out.rows);
    Object.defineProperties(this, {
      width: {
        value: config.width < 0 ? this.out.columns - 2 * this.largestBorder + config.width : config.width
      },
      height: {
        value: config.height < 0 ? this.out.rows - 2 + config.height : config.height
      },
      color: {
        value: new Color(this.out)
      }
    })
    Object.defineProperty(this, "margin", {
      value: new Margin(this.out, this.width, this.height)
    });
    if (config.color) {
      if (config.color.foreground) this.color.foreground = config.color.foreground;
      if (config.color.background) this.color.background = config.color.background;
    }
    this.out.on("resize", () => this.#onresize());
    this.color.on("change", () => this.#refresh());
    this.#onresize();
    readline.emitKeypressEvents(process.stdin);
    this.in.setRawMode(true);
    this.in.on("keypress", (str, key) => {
      if (key.ctrl && !key.meta && !key.shift && key.name === "c") process.exit();
      else {
        let eventName = "";
        if (key.ctrl) eventName += "ctrl+";
        if (key.meta) eventName += "alt+";
        if (key.shift) eventName += "shift+";
        eventName += key.name;
        this.emit(eventName, key);
      }
    });
    process.on("exit", () => {
      this.out.write(Color.RESET);
      if (this.dev) {
        this.out.cursorTo(0, this.out.rows - 2 - this.#methodsCalled.length);
        this.out.clearScreenDown();
        for (let method of this.#methodsCalled) {
          console.log(method);
        }
      }
      else {
        this.out.cursorTo(0, this.out.rows - 1);
        this.out.clearLine();
      }
      this.out.cursorTo(0, this.out.rows - 2);
    })
  }
  drawLine (x1, y1, x2, y2, color, thickness = 1, dashed = false, dashThickness = 0.5, spaceColor) {
    this.#methodsCalled.push(this.drawLine.bind(this, x1, y1, x2, y2, color, thickness, dashed, dashThickness, spaceColor));
    if (this.tooBig) return;
    x1 = verify(x1, Number, "x1");
    y1 = verify(y1, Number, "y1");
    x2 = verify(x2, Number, "x2");
    y2 = verify(y2, Number, "y2");
    if (color) this.out.write(Color.getForegroundColor(color));
    thickness = verify(thickness, 1, "thickness", false);
    dashed = verify(dashed, false, "dashed", false);
    dashThickness = verify(dashThickness, 0.5, "dashThickness", false);
    if (spaceColor) this.out.write(Color.getBackgroundColor(spaceColor));
    if (x1 < 0 || x1 > this.width || x2 < 0 || x2 > this.width || y1 < 0 || y1 > this.height || y2 < 0 || y2 > this.height) throw new Error("Cannot draw line outside of box");
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const xMin = Math.min(x1, x2);
    const yMin = Math.min(y1, y2);
    thickness = Math.round(thickness);
    if (m === 0) { // Horizontal line
      if (y1 + Math.ceil(-thickness / 2) < 0 || y1 + Math.ceil(thickness / 2) > this.height) throw new Error("Cannot draw line outside of box");
      for (let row = Math.ceil(-thickness / 2); row < Math.ceil(thickness / 2); row++) {
        if (dashed) {
          let dash = "";
          const startWithHalf = roundToNearest(xMin, 0.5) % 1;
          if (startWithHalf) dash += CMD.#RIGHT;
          for (let column = 0; column < Math.floor(startWithHalf ? dashThickness - 0.5 : dashThickness); column++) dash += CMD.#FULL;
          if (roundToNearest(xMin + dashThickness, 0.5) % 1) dash += CMD.#LEFT;
          for (let column = 0; column < Math.floor(Math.abs(x2 - x1) / dashThickness) * dashThickness; column += dashThickness * 2) {
            this.out.cursorTo(this.margin.lr + Math.floor(xMin) + column, this.margin.tb + Math.floor(y1) + row);
            this.out.write(dash);
          }
        }
        /*else if (roundToNearest(y1, 0.5) % 1) {
          this.out.cursorTo(this.margin.lr + Math.round(xMin), this.margin.tb + Math.floor(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#BOTTOM);
          this.out.cursorTo(this.margin.lr + Math.round(xMin), this.margin.tb + Math.ceil(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#TOP);
        }*/
        else {
          this.out.cursorTo(this.margin.lr + Math.round(xMin), this.margin.tb + Math.round(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#FULL);
        }
      }
      this.out.write(Color.DEFAULT)
      this.out.write(Color.getForegroundColor(this.color.foreground));
      this.out.write(Color.getBackgroundColor(this.color.background));
    }
    else if (m === Infinity) { // Vertical line
      if (x1 + Math.ceil(-thickness / 2) < 0 || x1 + Math.ceil(thickness / 2) > this.width) throw new Error("Cannot draw line outside of box");
      for (let column = Math.ceil(-thickness / 2); column < Math.ceil(thickness / 2); column++) {
        if (dashed) {
          let dash = [];
          const startWithHalf = roundToNearest(yMin, 0.5) % 1;
          if (startWithHalf) dash.push(CMD.#BOTTOM);
          for (let row = 0; row < Math.floor(startWithHalf ? dashThickness - 0.5 : dashThickness); row++) dash.push(CMD.#FULL);
          if (roundToNearest(yMin + dashThickness, 0.5) % 1) dash.push(CMD.#TOP);
          for (let row = 0; row < Math.floor(Math.abs(y2 - y1) / dashThickness) * dashThickness; row += dashThickness * 2) {
            for (let i = 0; i < dash.length; i++) {
              this.out.cursorTo(this.margin.lr + Math.floor(x1) + column, this.margin.tb + Math.floor(yMin) + row + i);
              this.out.write(dash[i]);
            }
          }
        }
        else {
          for (let row = 0; row < Math.abs(y2 - y1); row++) {
            this.out.cursorTo(this.margin.lr + Math.round(x1) + column, this.margin.tb + Math.round(yMin) + row);
            this.out.write(CMD.#FULL);
          }
        }
      }
    }
    else throw new Error("Diagonal lines are not supported.");
    if (color || spaceColor) this.color.refresh();
  }
  drawBox (x, y, width, height, color) { // Cannot handle decimals
    this.#methodsCalled.push(this.drawBox.bind(this, x, y, width, height, color));
    if (this.tooBig) return;
    x = verify(x, Number, "x");
    y = verify(y, Number, "y");
    width = verify(width, Number, "width", true, 0);
    height = verify(height, Number, "height", true, 0);
    if (color) this.out.write(Color.getForegroundColor(color));
    if (x < 0 || y < 0 || x + width > this.width || y + height > this.height) throw new Error("Box cannot be outside cmd");
    x = roundToNearest(x, 0.5);
    y = roundToNearest(y, 0.5);
    width = roundToNearest(width, 0.5);
    height = roundToNearest(height, 0.5);
    if ((x % 1 || width % 1) && (y % 1 || height % 1)) throw new Error("Can only use 0.5 block precision on one axis");
    for (let row = 0; row < height; row++) {
      this.out.cursorTo(this.margin.lr + x, this.margin.tb + row + y);
      for (let column = 0; column < width; column++) {
        this.out.write(CMD.#FULL);
      }
    }
    if (color) this.color.refresh();
  }
  write (text, x, y, color) {
    this.#methodsCalled.push(this.write.bind(this, text, x, y, color));
    if (this.tooBig) return;
    text = text.toString().replace(/[\n\t]/g, "  ");
    x = verify(x, 0, "x", false);
    y = verify(y, 0, "y", false);
    if (color) this.out.write(Color.getForegroundColor(color));
    if (x < 0 || x + text.length > color || y < 0 || y > this.height) throw new Error("Text cannot be outside cmd");
    this.out.cursorTo(this.margin.lr + Math.round(x), this.margin.tb + Math.round(y));
    this.out.write(text);
    if (color) this.color.refresh();
  }
  addSprite (sprite) {
    sprite = verify(sprite, Sprite, "sprite");
    Object.defineProperty(sprite, "cmd", {
      value: this
    });
    this.#sprites.add(sprite);
  }
  #clear = function () {
    this.out.cursorTo(0, 0);
    this.out.clearScreenDown();
  }
  #refresh = function () {
    this.#drawBorder();
    const methods = this.#methodsCalled.concat();
    this.#methodsCalled = [];
    for (let method of methods) {
      method();
    }
  }
  #onresize = function () {
    this.#clear();
    if (this.tooBig) {
      if (!this.#frozenStartTime) this.#frozenStartTime = performance.now();
      this.out.write(`Playing field is larger than terminal. Please make terminal larger to continue. width${this.width} height:${this.height}`);
    }
    else {
      if (this.#frozenStartTime) {
        this.#frozen += performance.now() - this.#frozenStartTime;
        this.#frozenStartTime = undefined;
      }
      this.#refresh();
    }
  }
  #drawLineAcross = function () {
    for (let column = 0; column < this.width - this.borderChars.horizontal.length + 1; column += this.borderChars.horizontal.length) process.stdout.write(this.borderChars.horizontal);
  }
  #drawBorder = function () {
    if (this.hasBorder) {
      this.out.cursorTo(this.margin.lr - this.borderChars.topLeft.length, this.margin.tb - 1);
      this.out.write(this.borderChars.topLeft);
      this.#drawLineAcross();
      this.out.write(this.borderChars.topRight);
      for (let row = 0; row < this.height; row++) {
        this.out.cursorTo(this.margin.lr - this.borderChars.vertical.length, this.margin.tb + row);
        this.out.write(this.borderChars.vertical);
        this.out.cursorTo(this.margin.lr + this.width);
        this.out.write(this.borderChars.vertical);
      }
      this.out.cursorTo(this.margin.lr - this.borderChars.bottomLeft.length, this.margin.tb + this.height);
      this.out.write(this.borderChars.bottomLeft);
      this.#drawLineAcross();
      this.out.write(this.borderChars.bottomRight);
    }
  }
  get tooBig () {
    return this.margin.lr < this.largestBorder || this.margin.tb < 1;
  }
  get largestBorder () {
    return Math.max(this.borderChars.topLeft.length, this.borderChars.vertical.length, this.borderChars.bottomLeft.length);
  }
  get time () {
    return performance.now() - this.#frozen;
  }
  #frozenStartTime;
  #frozen = 0;
  #methodsCalled = [];
  #sprites = new Set();
  static #FULL = "\u2588";
  static #TOP = "\u2580";
  static #BOTTOM = "\u2584";
  static #LEFT = "\u258C";
  static #RIGHT = "\u2590";
  static #BORDERS = {
    light: {
      vertical: "\u2502",
      horizontal: "\u2500",
      topLeft: "\u250c",
      topRight: "\u2510",
      bottomLeft: "\u2514",
      bottomRight: "\u2518"
    },
    heavy: {
      vertical: "\u2503",
      horizontal: "\u2501",
      topLeft: "\u250f",
      topRight: "\u2513",
      bottomLeft: "\u2517",
      bottomRight: "\u251b"
    },
    double: {
      vertical: "\u2551",
      horizontal: "\u2550",
      topLeft: "\u2554",
      topRight: "\u2557",
      bottomLeft: "\u255a",
      bottomRight: "\u255d"
    },
    round: {
      vertical: "\u2502",
      horizontal: "\u2500",
      topLeft: "\u256d",
      topRight: "\u256e",
      bottomLeft: "\u2570",
      bottomRight: "\u256f"
    },
    solid: {
      vertical: "\u2588\u2588",
      horizontal: "\u2588",
      topLeft: "\u2588\u2588",
      topRight: "\u2588\u2588",
      bottomLeft: "\u2588\u2588",
      bottomRight: "\u2588\u2588"
    }
  }
};

class Sprite {
  constructor (callback, config) {
    if (callback instanceof (async () => {}).constructor) throw new Error("callback of a Sprite may not be an asynchronous function");
    config = verify(config, {}, "config", false);
    Object.defineProperties(this, {
      callback: {
        value: verify(callback, Function, "callback")
      },
      ignoreErrors: {
        value: verify.config(config, "ignoreErrors", false)
      },
      preciseAxis: {
        value: verify.config(config, "preciseAxis", "neither")
      }
    });
  }
  draw (x = this.x, y = this.y, a = this.a) {
    try {
      this.callback(x, y, a);
      this.#x = x;
      this.#y = y;
      this.#a = a;
    }
    catch (err) {
      const callStack = new Error().stack.split("\n").slice(1);
      if (this.ignoreErrors && callStack[0] !== callStack[1]) this.draw();
      else throw err;
    }
  }
  move (x1, y1, x2, y2, t) {
    x1 = verify(x1, Number, "x1");
    y1 = verify(y1, Number, "y1");
    x2 = verify(x2, Number, "x2");
    y2 = verify(y2, Number, "y2");
    t = verify(t, Number, "t") * 1000;
    const xv = (x2 - x1) / t;
    const yv = (y2 - y1) / t;
    const start = this.cmd.time;
    const xRounder = this.preciseAxis === "x" ? x => x : Math.round;
    const yRounder = this.preciseAxis === "y" ? y => y : Math.round;
    const frame = () => {
      if (!this.cmd.tooBig) {
        this.draw(xRounder(x1 + xv * (this.cmd.time - start)), yRounder(y1 + yv * (this.cmd.time - start))); // The previous frame needs to be cleared
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  moveTo (x, y, t) {
    this.move(this.x, this.y, x, y, t);
  }
  spin (a1, a2, t) {

  }
  spinTo (a, t) {
    this.spin(this.a, a, t);
  }
  get x () { return this.#x; }
  get y () { return this.#y; }
  get a () { return this.#a; }
  #x;
  #y;
  #a;
};

module.exports.Sprite = Sprite;