# Pong
This is pong in the command line, written in NodeJS.

![npm](https://badgen.net/npm/v/command-line-pong)
![downloads](https://badgen.net/npm/dt/command-line-pong)
![node](https://badgen.net/badge/node/>=12.0.0/green)
![licence](https://badgen.net/npm/licence/command-line-pong)

### Installation

```bash
$ npm i -g command-line-pong
```

### Usage

Once installed, run ```pong``` in your command line, followed by any extra options (see below). Use up and down arrows to move the right paddle, the left moves automatically. The first to 10 points wins!

##### Options

```bash
$ pong [option [value]] [option [value]] ...

Options:
  -w, --width           Width of pong board             {default: 110}
  -h, --height          Height of pong board            {default: 30}
  -c, --color,          Color of border, paddles, ball  {default: white}
    --fg, --foreground
  --bg, --background,   Background color of pong board  {default: black}
    --backgroundColor 
```