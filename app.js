// ---------------------
// ----- utilites
// ---------------------
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSamePos(pos1, pos2) {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

function formatTime(rawSeconds) {
  // input : seconds int (e.g. 132)
  // output : mm:ss string (e.g. 02:12)
  const min = parseInt(rawSeconds / 60);
  const sec = rawSeconds % 60;

  const strmin = min < 10 ? `0${min}` : `${min}`;
  const strsec = sec < 10 ? `0${sec}` : `${sec}`;

  return `${strmin} : ${strsec}`;
}

// ---------------------
// ----- declare global variables
// ---------------------

// enum
const DIRECTION = { up: 1, left: 2, down: 3, right: 4 };

// html elements
const $ = {
  // select
  selectContainer: document.getElementById("select-container"),
  startbtn: document.getElementById("start-btn"),
  widthInput: document.getElementById("size-width"),
  heightInput: document.getElementById("size-height"),
  speedInput: document.getElementById("speed"),

  // play
  backdrop: document.getElementById("backdrop"),
  playContainer: document.getElementById("play-container"),
  gameboard: document.getElementById("gameboard"),
  playtime: document.getElementById("playtime"),
  score: document.getElementById("score"),
};

// ---------------------
// ----- define class
// ---------------------

class Snake {
  len = 3; // snake's length (The number of block)

  dir = null; // direction
  nextDirs = []; // will be loaded to 'dir' when update() is called.

  pos = []; // pos[0] : head, pos[len-1] : tail
  popedPos = null;

  init(width, height) {
    const headRow = parseInt(height / 2) - parseInt(this.len / 2);
    const headCol = parseInt(width / 2);
    for (let i = 0; i < this.len; i++) this.addPos(headRow + i, headCol);
  }

  setInitialDirection(initialDirection) {
    this.dir = initialDirection;

    // if initial direction is down, reverse this.pos.
    if (initialDirection == DIRECTION.down) this.pos.reverse();
  }

  addPos(row, col) {
    const newpos = { row: row, col: col };
    this.pos.push(newpos);
  }

  update() {
    // The value to be added to the 'pos' depending on the 'dir'.
    let r = 0; // to the row
    let c = 0; // to the column (col)

    // Get the next direction
    const nextDir = this.nextDirs.shift();
    this.dir = nextDir ? nextDir : this.dir;

    // Determine r, c value
    if (this.dir == DIRECTION.up) r = -1;
    else if (this.dir === DIRECTION.left) c = -1;
    else if (this.dir === DIRECTION.down) r = 1;
    else if (this.dir === DIRECTION.right) c = 1;

    // Do update 'pos'
    const { row, col } = this.getHeadPos();
    this.pos.unshift({ row: row + r, col: col + c });
    this.popedPos = this.pos.pop();
  }

  addNextDirection(dir) {
    const dirs = [this.dir, ...this.nextDirs];
    const lastDir = dirs[dirs.length - 1];

    const a = lastDir === DIRECTION.up && dir === DIRECTION.down;
    const b = lastDir === DIRECTION.down && dir === DIRECTION.up;
    const c = lastDir === DIRECTION.left && dir === DIRECTION.right;
    const d = lastDir === DIRECTION.right && dir === DIRECTION.left;

    if (!a && !b && !c && !d) this.nextDirs.push(dir);
  }

  increaseLength() {
    const { row, col } = this.popedPos;
    this.addPos(row + 1, col);
    this.len++;
  }

  getHeadPos() {
    return this.pos[0];
  }

  headHitBody() {
    // Returns whether the head overlaps the body.
    const head = this.getHeadPos();
    for (let i = 1; i < this.len; i++) {
      if (isSamePos(head, this.pos[i])) {
        return true;
      }
    }
    return false;
  }
}

class Food {
  rowMax = 0;
  colMax = 0;

  pos = { row: -1, col: -1 }; // (-1) : is not exist, (0, 1, 2, ...) : is exist
  isExist = false;

  init(width, height) {
    this.rowMax = height - 1;
    this.colMax = width - 1;
    this.generate();
  }

  generate() {
    this.pos.row = getRandomInt(0, this.rowMax);
    this.pos.col = getRandomInt(0, this.colMax);
    this.isExist = true;
  }

  update() {
    if (!this.isExist) this.generate();
  }

  remove() {
    this.isExist = false;
    this.pos.row = -1;
    this.pos.row = -1;
  }
}

class Gameboard {
  // gameboard size
  width = 0;
  height = 0;

  // gameboard table-td elements
  cells = null;
  cellsIdxHaveClass = []; // List of cell index which has class (snake or food pos)

  // interval store
  intervalList = [];

  init(width, height, snakePos, foodPos) {
    // set size
    this.width = width;
    this.height = height;

    // create gameboard
    let htmlStr = "";
    htmlStr += "<tbody>";
    for (let i = 0; i < this.height; i++) {
      htmlStr += "<tr>";
      for (let j = 0; j < this.width; j++) htmlStr += "<td></td>";
      htmlStr += "</tr>";
    }
    htmlStr += "</tbody>";
    $.gameboard.innerHTML = htmlStr;

    // get table cells
    this.cells = $.gameboard.getElementsByTagName("td");

    // initialize cellsHaveClass and draw initial position
    this.update(snakePos, foodPos);
  }

  update(snakePos, foodPos) {
    this.clear();
    this.cellsIdxHaveClass = [];

    // For food pos
    {
      const { row, col } = foodPos;
      this.drawCell(row, col, "food");
    }

    // For Snake's head pos
    {
      const { row, col } = snakePos[0];
      this.drawCell(row, col, "snake-head");
    }

    // For Shake's body pos
    for (let i = 1; i < snakePos.length; i++) {
      const { row, col } = snakePos[i];
      this.drawCell(row, col, "snake-body");
    }
  }

  getCellIdx(row, col) {
    return row * this.width + col;
  }

  getCell(row, col) {
    const idx = this.getCellIdx(row, col);
    return this.cells[idx];
  }

  drawCell(row, col, classname) {
    const idx = this.getCellIdx(row, col);
    this.cellsIdxHaveClass.push(idx);
    this.cells[idx].classList.add(classname);
  }

  clear() {
    this.cellsIdxHaveClass.forEach((idx) => {
      this.cells[idx].className = "";
    });
  }

  getSize() {
    return { width: this.width, height: this.height };
  }
}

class Manager {
  speed = 0;
  playtime = 0;
  score = 0;
  gameLoopId = null;
  playtimeLoopId = null;

  initGame(width, height, speed) {
    this.speed = speed;

    snake.init(width, height);
    food.init(width, height);

    board.init(width, height, snake.pos, food.pos);
    board.update(snake.pos, food.pos);
  }

  startGame(initialDirection) {
    snake.setInitialDirection(initialDirection);

    window.onkeydown = this.handleKeydown;
    this.gameLoopId = setInterval(() => {
      if (this.isFoodEaten()) {
        snake.increaseLength();
        food.generate();
        this.score++;
      }

      snake.update();
      food.update();

      if (this.isGameover()) this.stopGame();
      else board.update(snake.pos, food.pos);

      $.score.textContent = String(this.score);
    }, parseInt(1000 / this.speed));

    this.playtimeLoopId = setInterval(() => {
      this.playtime++;
      $.playtime.textContent = formatTime(this.playtime);
    }, 1000);
  }

  stopGame() {
    clearInterval(this.gameLoopId);
    clearInterval(this.playtimeLoopId);
    $.backdrop.style.display = "flex";
    $.backdrop.innerHTML = `
        <h2>G A M E O V E R</h2>
        <a href="./app.html">Restart</a>
        <a href="./index.html">Back to Title</a>
    `;
  }

  isGameover() {
    const { row, col } = snake.getHeadPos();
    const { width, height } = board.getSize();
    if (row < 0 || col < 0 || row > height - 1 || col > width - 1) return true; // hits a wall
    else if (snake.headHitBody()) return true; // hits its body
    else return false;
  }

  isFoodEaten() {
    return isSamePos(snake.getHeadPos(), food.pos);
  }

  handleKeydown(e) {
    const key = e.key;
    let dir = null;

    if (key === "ArrowUp") dir = DIRECTION.up;
    else if (key === "ArrowLeft") dir = DIRECTION.left;
    else if (key === "ArrowDown") dir = DIRECTION.down;
    else if (key === "ArrowRight") dir = DIRECTION.right;

    if (dir) snake.addNextDirection(dir);
  }
}

// ---------------------
// ----- declare instances
// ---------------------

const manager = new Manager();
const snake = new Snake();
const food = new Food();
const board = new Gameboard();

// ---------------------
// ----- main logic
// ---------------------

function select() {
  // load config values from localstorage
  const storedWidth = new goraniStore(storeList.width);
  const storedHeight = new goraniStore(storeList.height);
  const storedSpeed = new goraniStore(storeList.speed);

  // put the loaded config into input elements
  $.widthInput.value = storedWidth.get();
  $.heightInput.value = storedHeight.get();
  $.speedInput.value = storedSpeed.get();

  // When 'Start' button is pressed.
  $.startbtn.onclick = () => {
    // get config values.
    // ** 'replace(regex)' removes all spaces.
    const wStr = $.widthInput.value.replace(/(\s*)/g, "");
    const hStr = $.heightInput.value.replace(/(\s*)/g, "");
    const sStr = $.speedInput.value.replace(/(\s*)/g, "");
    const w = parseInt(wStr);
    const h = parseInt(hStr);
    const s = parseInt(sStr);

    // validate condition
    if (!w || !h || !s || w != wStr || h != hStr || s != sStr) {
      alert("Please write number or positive integer");
      return;
    } else if (w < 10 || w > 30 || h < 10 || h > 30) {
      alert("Please check width or height value (10~30 are allowed)");
      return;
    } else if (s < 5 || s > 30) {
      alert("Please check speed value (5~30 are allowed)");
      return;
    }

    // save current config to localstorage
    storedWidth.set(w);
    storedHeight.set(h);
    storedSpeed.set(s);

    // change page to 'play' from 'select'
    $.selectContainer.style.display = "none";
    $.playContainer.style.display = "flex";

    // remove startbtn event
    $.startbtn.onclick = null;

    // call play()
    play(w, h, s);
  };
}

function play(width, height, speed) {
  // init game
  manager.initGame(width, height, speed);

  // start game when the player press any key
  window.onkeydown = (e) => {
    const key = e.key;
    let dir = null; // initial snake's direction
    if (key === "ArrowUp") dir = DIRECTION.up;
    else if (key === "ArrowLeft") dir = DIRECTION.left;
    else if (key === "ArrowDown") dir = DIRECTION.down;
    else if (key === "ArrowRight") dir = DIRECTION.right;

    if (dir) {
      $.backdrop.style.display = "none";
      window.onkeydown = null;
      manager.startGame(dir);
    }
  };
}

// ---------------------
// ----- bootstrap
// ---------------------

document.addEventListener("DOMContentLoaded", select);
