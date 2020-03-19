const EventEmitter = require('events');
const readline = require("readline");

const roundToNearest = (num, nearest) => Math.round(num / nearest) * nearest;

module.exports.CMD = class CMD extends EventEmitter {
  constructor (config) {
    super();
    config = config || {};
    Object.defineProperty(this, "out", {
      value: config.out || process.stdout
    });
    Object.defineProperties(this, {
      in: {
        value: config.in || process.stdin
      },
      width: {
        value: Math.min(config.width || 80, this.out.columns)
      },
      height: {
        value: Math.min(config.height || 24, this.out.columns)
      },
      hasBorder: {
        value: !(config.border === "none")
      },
      borderChars: {
        value: CMD.#BORDERS[config.border || "light"]
      }
    });
    this.#onresize();
    const onresize = this.#onresize.bind(this);
    this.out.on("resize", () => onresize());
    readline.emitKeypressEvents(process.stdin);
    this.in.setRawMode(true);
    this.in.on("keypress", (str, key) => {
      if (key.ctrl && !key.meta && !key.shift && key.name === "c") process.exit();
      switch (key.code) {
        case "[A":
          this.emit("up", key);
          break;
        case "[B":
          this.emit("down", key);
          break;
        case "[C":
          this.emit("right", key);
          break;
        case "[D":
          this.emit("left", key);
          break;
      }
    });
  }
  #onresize = function () {
    this.out.cursorTo(0, 0);
    this.out.clearScreenDown();
    if (this.lrMargin < 1 || this.tbMargin < 1) this.out.write("Playing field is larger than terminal. Please make terminal larger to continue.");
    else {
      this.#drawBorder();
      const methods = this.#methodsCalled.concat();
      this.#methodsCalled = [];
      for (let method of methods) {
        method();
      }
    }
  }
  #drawLineAcross = function () {
    for (let column = 0; column < this.width; column++) process.stdout.write(this.borderChars.horizontal);
  }
  #drawBorder = function () {
    if (this.hasBorder) {
      this.out.cursorTo(this.lrMargin - 1, this.tbMargin - 1);
      this.out.write(this.borderChars.topLeft);
      this.#drawLineAcross();
      this.out.write(this.borderChars.topRight);
      for (let row = 0; row < this.height; row++) {
        this.out.cursorTo(this.lrMargin - 1, this.tbMargin + row);
        this.out.write(this.borderChars.vertical);
        this.out.cursorTo(this.lrMargin + this.width);
        this.out.write(this.borderChars.vertical);
      }
      this.out.cursorTo(this.lrMargin - 1, this.tbMargin + this.height);
      this.out.write(this.borderChars.bottomLeft);
      this.#drawLineAcross();
      this.out.write(this.borderChars.bottomRight);
    }
  }
  get lrMargin() {
    return Math.floor((this.out.columns - this.width) / 2);
  }
  get tbMargin () {
    return Math.floor((this.out.rows - this.height) / 2);
  }
  #methodsCalled = [];
  drawLine (x1, y1, x2, y2, thickness = 1, dashed = false, dashThickness = 0.5) {
    this.#methodsCalled.push(this.drawLine.bind(this, x1, y1, x2, y2, thickness, dashed, dashThickness));
    if (x1 < 0 || x1 > this.width || x2 < 0 || x2 > this.width || y1 < 0 || y1 > this.height || y2 < 0 || y2 > this.height) throw new Error("Cannot draw line outside of box");
    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const xMin = Math.min(x1, x2);
    const yMin = Math.min(y1, y2);
    dashThickness = roundToNearest(dashThickness, 0.5);
    if (m === 0) { // Horizontal line
      for (let row = 0; row < 1; row++) {
        if (dashed) {
          for (let column = 0; column < Math.floor(Math.abs(x2 - x1) / dashThickness) * dashThickness; column += dashThickness * 2) {
            this.out.cursorTo(this.lrMargin + Math.floor(xMin) + column, this.tbMargin + Math.floor(y1) + row);
            if (roundToNearest(xMin + column, 0.5) % 1 !== 0) this.out.write(CMD.#RIGHT);
            for (let i = 0; i < Math.floor(dashThickness); i++) this.out.write(CMD.#FULL);
            if (roundToNearest(xMin + column + dashThickness, 0.5) % 1 !== 0) this.out.write(CMD.#LEFT);
          }
        }
        else if (roundToNearest(y1, 0.5) % 1 !== 0) {
          this.out.cursorTo(this.lrMargin + Math.round(xMin), this.tbMargin + Math.floor(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#BOTTOM);
          this.out.cursorTo(this.lrMargin + Math.round(xMin), this.tbMargin + Math.ceil(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#TOP);
        }
        else {
          this.out.cursorTo(this.lrMargin + Math.round(xMin), this.tbMargin + Math.round(y1) + row);
          for (let column = 0; column < Math.abs(x2 - x1); column++) this.out.write(CMD.#FULL);

        }
      }
    }
    else if (m === Infinity) { // Vertical line
      for (let row = 0; row < yMin; row++) {
        this.out.cursorTo(this.lrMargin + x1, this.tbMargin + yMin + row);
        this.out.write(CMD.#FULL);
      }
    }
    else throw new Error("Diagonal Lines Not Yet Supported");
    /*else if (Math.abs(m) < 1) {

    }
    else if (Math.abs(m) > 1) {

    }
    else { // if m === 1

    }*/
  }
  drawBox (x, y, width, height) {
    this.#methodsCalled.push(this.drawBox.bind(this, x, y, width, height));
    if (x < 0 || x > this.width || y < 0 || y > this.height || x + width < this.width || y + height < this.height) throw new Error("Box cannot be outside cmd");
    for (let row = 0; row < height; row++) {
      this.out.cursorTo(this.lrMargin + x, this.tbMargin + row + y);
      for (let column = 0; column < width; column++) {
        this.out.write(CMD.#FULL);
      }
    }
  }
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
    }
  }
};

module.exports.Sprite = class Sprite {
  constructor () {

  }
};