# Pong
This is pong in the command line, written in NodeJS.

![](https://badgen.net/npm/v/command-line-pong)
![](https://badgen.net/badge/node/>=12.0.0/green)
![](https://badgen.net/npm/dt/command-line-pong)
![](https://badgen.net/badge/licence/MIT)

# Installation

```
$ npm i -g command-line-pong
```

# Usage

Once installed, run `pong` in your command line, followed by any extra options (see below). Use up and down arrows to move the right paddle, the left moves automatically. The first to 10 points wins!

## Options

```
$ pong [option [value]] [option [value]] ...

Options:
  -w, --width           Width of pong board             {default: 110}
  -h, --height          Height of pong board            {default: 30}
  -c, --color,          Color of border, paddles, ball  {default: white}
    --fg, --foreground
  --bg, --background,   Background color of pong board  {default: black}
    --backgroundColor 
```

### Colors

- ![#000000](https://placehold.it/15/000000?text=+) `black`
- ![#ff0000](https://placehold.it/15/ff0000?text=+) `red`
- ![#00ff00](https://placehold.it/15/00ff00?text=+) `green`
- ![#ffff00](https://placehold.it/15/ffff00?text=+) `yellow`
- ![#0000ff](https://placehold.it/15/0000ff?text=+) `blue`
- ![#ff00ff](https://placehold.it/15/ff00ff?text=+) `magenta`
- ![#00ffff](https://placehold.it/15/00ffff?text=+) `cyan`
- ![#ffffff](https://placehold.it/15/ffffff?text=+) `white`

# Troubleshooting
Tips for how to fix various errors you may encounter while running this program
## 'pong' is not recognized 

```
'pong' is not recognized as an internal or external command, 
operable program or batch file.
```

### Solution 1

Make sure you installed pong globally. You do this by running the command
```
$ npm i -g command-line-pong
```
Notice the **`-g`**, that is what makes the install global.

### Solution 2

If it is installed globally, make sure that the 'npm' is in your PATH. For instructions on how to do that, see [this stackoverflow post](https://stackoverflow.com/questions/30710550/node-js-npm-modules-installed-but-command-not-recognized#36168581).

## Undexpected '#'

```
SyntaxError: Invalid or unexpected token '#'
```

### Solution 1

Make sure that you have at least node version 12 installed. You can check your node version by running the command

```
$ node -v
```

You can install the latest version of node [here](https://nodejs.org/en/).

## Playing field too large

```
Playing field is larger than terminal. Please make terminal larger to continue. 
```

### Solution 1

Make your command line window bigger.

### Solution 2

Run pong with a smaller field using the command

```
$ pong -w <smallerWidth> -h <smallerHeight>
```