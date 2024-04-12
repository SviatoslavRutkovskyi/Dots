interface IDot {
  x: number;
  y: number;
  active: boolean;
  player: number;
}

//Stores all placed dots
// Key is stored in  "x y" format
let gameBoard = new Map<string, IDot[]>();
// Stores the most recent cycle completed
let tempCycle = new Map<string, IDot[]>();

const scores: number[] = [0, 0];

const borderDots = {
  up: Number.NEGATIVE_INFINITY,
  down: Number.POSITIVE_INFINITY,
  left: Number.POSITIVE_INFINITY,
  right: Number.NEGATIVE_INFINITY,
};

// Places the dot on the board
// Updates the border coordinates
function placeDot(theX: number, theY: number, thePlayer: number) {
  gameBoard.set(theX + " " + theY, [
    {
      x: theX,
      y: theY,
      active: true,
      player: thePlayer,
    },
  ]);
  if (theX > borderDots.right) {
    borderDots.right = theX;
  }
  if (theX < borderDots.left) {
    borderDots.left = theX;
  }
  if (theY > borderDots.up) {
    borderDots.up = theY;
  }
  if (theY < borderDots.down) {
    borderDots.down = theY;
  }
}
// Connects 2 given dots, given that they are within one cell of each other
function connect(x1: number, y1: number, x2: number, y2: number) {
  if (canConnect(x1, y1, x2, y2)) {
    const key1: string = x1 + " " + y1;
    const key2: string = x2 + " " + y2;
    gameBoard.get(key1)!.push(gameBoard.get(key2)![0]);
    gameBoard.get(key2)!.push(gameBoard.get(key1)![0]);
    if (
      gameBoard.get(key1)!.length > 2 &&
      gameBoard.get(key2)!.length > 2 &&
      checkForCycle(gameBoard.get(key1)![0], gameBoard.get(key2)![0])
    ) {
      //check for cycle
      console.log("has a cycle");
      disDots();
    }
  }
}
//Checks if 2 dots are within one cell away from each other
function canConnect(x1: number, y1: number, x2: number, y2: number) {
  return (
    gameBoard.get(x1 + " " + y1)![0].active &&
    gameBoard.get(x2 + " " + y2)![0].active &&
    Math.abs(x1 - x2) <= 1 &&
    Math.abs(y1 - y2) <= 1
  );
}
//Returns true if there is a cycle created from connected dots,
// Builds the temp cycle
function checkForCycle(dot1: IDot, dot2: IDot) {
  tempCycle.clear;
  const result = checkForCycleHelper(dot1, dot1, dot2);
  if (result) {
    tempCycle.get(dot1.x + " " + dot1.y)!.push(dot2);
  }
  return result;
}

//Performs dfs on the dots graph, returns true if cycle exists, builds the temp cycle
function checkForCycleHelper(startDot: IDot, oldDot: IDot, dot: IDot): boolean {
  if (startDot == dot) {
    tempCycle.set(dot.x + " " + dot.y, [dot, oldDot]);
    return true;
  }
  for (let i = gameBoard.get(dot.x + " " + dot.y)!.length - 1; i > 0; i--) {
    const newDot = gameBoard.get(dot.x + " " + dot.y)![i];
    if (newDot != oldDot && newDot.active) {
      const result = checkForCycleHelper(startDot, dot, newDot);
      if (result) {
        tempCycle.set(dot.x + " " + dot.y, [dot, oldDot, newDot]);
        return result;
      }
    }
  }
  return false;
}

//"Captures" enemy dots surrounded by the current cycle.
function disDots() {
  let dUp = {
    x: Number.POSITIVE_INFINITY,
    y: 0,
    active: false,
    player: -1,
  };
  for (let value of tempCycle.values()) {
    if (value[0].x < dUp.x) {
      dUp = value[0];
    }
  }
  const down =
    tempCycle.get(dUp.x + " " + dUp.y)![2].y >
    tempCycle.get(dUp.x + " " + dUp.y)![1].y
      ? 1
      : 2;
  const up = down == 1 ? 2 : 1;
  let dDown = tempCycle.get(dUp.x + " " + dUp.y)![down];

  disDotsHelper(dUp, dDown, up, down);

  console.log(tempCycle);
}

// Recursivly calls itself, works from left to rigth with 2 dots, dUp being above, and dDown below
// Checks all dots in between, and makes enemy dots inactive inside.
// Recursivly splits if encounters a dot that is in the currect cycle
function disDotsHelper(dUp: IDot, dDown: IDot, up: number, down: number) {
  console.log("dUp: " + dUp.x + ", " + dUp.y);
  console.log("dDown: " + dDown.x + ", " + dDown.y);
  while (dUp.x < dDown.x) {
    dUp = tempCycle.get(dUp.x + " " + dUp.y)![up];
  }
  if (dUp == dDown) {
    return;
  }
  for (let i = dUp.y - 1; i > dDown.y; i--) {
    const curr: string = dUp.x + " " + i;
    console.log("Checking dot " + curr);
    if (tempCycle.has(curr)) {
      console.log("recursive call");
      disDotsHelper(dUp, tempCycle.get(curr)![0], up, down);
      dUp = tempCycle.get(curr)![0];
    } else if (
      gameBoard.has(curr) &&
      gameBoard.get(curr)![0].player != dUp.player
    ) {
      gameBoard.get(curr)![0].active = false;
      scores[dUp.player] += 10;
    }
    console.log("I: " + i);
  }

  while (dUp.x == dDown.x) {
    dDown = tempCycle.get(dDown.x + " " + dDown.y)![down];
  }
  console.log("Calling recursion");
  disDotsHelper(dUp, dDown, up, down);
}

function boardToString() {
  let s = "Board State: \n";
  for (let i = borderDots.up; i >= borderDots.down; i--) {
    for (let j = borderDots.left; j <= borderDots.right; j++) {
      const curr = j + " " + i;
      if (gameBoard.has(curr)) {
        let c = gameBoard.get(curr)![0].player == 1 ? "x" : "o";
        if (gameBoard.get(curr)![0].active) {
          c = c.toUpperCase();
        }
        s += c;
      } else {
        s += " ";
      }
      s += " ";
    }
    s += "\n";
  }
  return s;
}

placeDot(1, 1, 0);
placeDot(2, 2, 0);
placeDot(2, 0, 0);
placeDot(3, 1, 0);
placeDot(2, 1, 1);

// placeDot(5, 5);

connect(1, 1, 2, 2);
connect(2, 2, 3, 1);
connect(3, 1, 2, 0);
connect(2, 0, 1, 1);

// connect(1, 1, 5, 5);
// console.log(hashMap.get("1 1"));
// console.log(hashMap.get("2 2"));
// console.log(hashMap.get("3 1"));
// console.log(hashMap.get("2 0"));
// console.log(tempCycle);
console.log(scores);
console.log(gameBoard.get("2 1")![0].active);
console.log(boardToString());
